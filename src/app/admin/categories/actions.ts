"use server";

import { redirect } from "next/navigation";
import { revalidatePath, revalidateTag } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { dbConfigured } from "@/lib/db";
import { CONTENT_TAG } from "@/lib/content";
import { locales, type Locale } from "@/i18n/config";
import { getStaticDict } from "@/i18n/dictionaries";
import { categorySlugs } from "@/lib/site";
import {
  SLUG_RE,
  deleteCategoryRow,
  getAllCategoriesAdmin,
  getCategoryRow,
  patchCategoryRow,
  upsertCategoryRow,
  type CatText,
} from "@/lib/categories";

const str = (v: FormDataEntryValue | null, max = 20000) => (typeof v === "string" ? v.slice(0, max).replace(/\r\n/g, "\n") : "");
const lines = (s: string) => s.split("\n").map((l) => l.trim()).filter(Boolean).slice(0, 60);
const isBuiltin = (slug: string) => (categorySlugs as readonly string[]).includes(slug);

function flush(slug?: string) {
  revalidateTag(CONTENT_TAG, "max");
  revalidatePath("/", "layout");
  for (const f of ["/sitemap.xml", "/llms.txt", "/llms-full.txt"]) revalidatePath(f);
  if (slug) for (const l of locales) revalidatePath(`/${l}/products/${slug}`);
}

function readText(fd: FormData, l: Locale): CatText {
  const qs = fd.getAll(`${l}:faq_q`);
  const as = fd.getAll(`${l}:faq_a`);
  const faq = qs
    .map((q, i) => ({ q: str(q, 400).trim(), a: str(as[i] ?? "", 2000).trim() }))
    .filter((f) => f.q && f.a)
    .slice(0, 30);
  return {
    name: str(fd.get(`${l}:name`), 200).trim(),
    short: str(fd.get(`${l}:short`), 500).trim(),
    examples: lines(str(fd.get(`${l}:examples`), 4000)).map((x) => x.slice(0, 120)),
    intro: str(fd.get(`${l}:intro`), 5000).trim(),
    uses: lines(str(fd.get(`${l}:uses`), 4000)).map((x) => x.slice(0, 200)),
    faq,
  };
}

/** Keep only the fields that were filled in (and, for built-ins, that differ from the built-in copy). */
function sparse(t: CatText, builtin?: CatText): Partial<CatText> {
  const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
  const o: Partial<CatText> = {};
  for (const k of ["name", "short", "intro"] as const) if (t[k] && !(builtin && t[k] === builtin[k])) o[k] = t[k];
  for (const k of ["examples", "uses", "faq"] as const) if (t[k].length && !(builtin && same(t[k], builtin[k]))) (o as Record<string, unknown>)[k] = t[k];
  return o;
}

export async function saveCategory(fd: FormData) {
  await requireAdmin();
  const editing = str(fd.get("existing"), 80);
  const slug = editing || str(fd.get("slug"), 80).trim().toLowerCase();
  const back = editing ? `/admin/categories/${editing}` : "/admin/categories/new";
  if (!dbConfigured()) redirect(`${back}?error=db`);
  if (!SLUG_RE.test(slug)) redirect(`${back}?error=slug`);
  if (!editing && (isBuiltin(slug) || (await getCategoryRow(slug)))) redirect(`${back}?error=dup`);

  const builtin = isBuiltin(slug);
  const texts = Object.fromEntries(locales.map((l) => [l, readText(fd, l)])) as Record<Locale, CatText>;
  if (!builtin && !texts.en.name) redirect(`${back}?error=name`);

  const hidden = fd.get("hidden") === "on";
  const posRaw = Number(str(fd.get("position"), 8));
  const all = await getAllCategoriesAdmin("en");
  const position = Number.isFinite(posRaw) && str(fd.get("position"), 8).trim() !== "" ? Math.round(posRaw) : Math.max(0, ...all.map((c) => c.position)) + 10;
  let code = str(fd.get("code"), 8).trim().toUpperCase();
  if (code && !/^[A-Z]{2,4}$/.test(code)) redirect(`${back}?error=code`);
  if (!code && !builtin) code = slug.replace(/[^a-z]/g, "").slice(0, 3).toUpperCase().padEnd(2, "X");
  if (builtin && code === (all.find((c) => c.slug === slug)?.code ?? "")) code = "";

  const data: Partial<Record<Locale, Partial<CatText>>> = {};
  for (const l of locales) {
    const b = builtin ? ((getStaticDict(l).categories.items as Record<string, CatText>)[slug]) : undefined;
    const s = sparse(texts[l], b);
    if (Object.keys(s).length) data[l] = s;
  }
  try {
    await upsertCategoryRow({ slug, code, position, hidden, data });
  } catch (e) {
    console.error("[categories] save failed", e);
    redirect(`${back}?error=db`);
  }
  flush(slug);
  redirect(`/admin/categories/${slug}?saved=1`);
}

export async function deleteCategory(fd: FormData) {
  await requireAdmin();
  const slug = str(fd.get("slug"), 80);
  if (!SLUG_RE.test(slug)) return;
  await deleteCategoryRow(slug);
  flush(slug);
  redirect(isBuiltin(slug) ? `/admin/categories/${slug}?saved=reset` : "/admin/categories?deleted=1");
}

export async function toggleHidden(fd: FormData) {
  await requireAdmin();
  const slug = str(fd.get("slug"), 80);
  if (!SLUG_RE.test(slug)) return;
  await patchCategoryRow(slug, { hidden: fd.get("hide") === "1" });
  flush(slug);
  redirect("/admin/categories");
}

export async function moveCategory(fd: FormData) {
  await requireAdmin();
  const slug = str(fd.get("slug"), 80);
  const dir = fd.get("dir") === "up" ? -1 : 1;
  const all = await getAllCategoriesAdmin("en");
  const i = all.findIndex((c) => c.slug === slug);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= all.length) redirect("/admin/categories");
  // Renumber so positions are distinct, then swap the two neighbours.
  const order = all.map((c) => c.slug);
  [order[i], order[j]] = [order[j], order[i]];
  const changed = order.map((s, k) => ({ s, pos: (k + 1) * 10 })).filter(({ s, pos }) => all.find((c) => c.slug === s)!.position !== pos);
  for (const { s, pos } of changed) await patchCategoryRow(s, { position: pos });
  flush();
  redirect("/admin/categories");
}
