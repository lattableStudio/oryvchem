import { unstable_cache } from "next/cache";
import { locales, type Locale } from "@/i18n/config";
import { getStaticDict } from "@/i18n/dictionaries";
import { categoryCodes, categorySlugs } from "./site";
import { db } from "./db";
import { CONTENT_TAG } from "./content";

export type CatFaq = { q: string; a: string };
/** Per-language text of a category. `examples` are the product chips shown on the card and page. */
export type CatText = { name: string; short: string; examples: string[]; intro: string; uses: string[]; faq: CatFaq[] };
export type Category = CatText & { slug: string; code: string; position: number; hidden: boolean; builtin: boolean };
type Row = { slug: string; code: string; position: number; hidden: boolean; data: Partial<Record<Locale, Partial<CatText>>> };

export const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

async function loadRows(): Promise<Row[]> {
  try {
    const sql = await db();
    if (!sql) return [];
    return await sql<Row[]>`select slug, code, position, hidden, data from categories order by position, slug`;
  } catch (e) {
    console.error("[categories] could not load", e);
    return [];
  }
}
const cachedRows = unstable_cache(loadRows, ["categories-rows"], { tags: [CONTENT_TAG], revalidate: 300 });

/** Built-ins first (in their original order, unless repositioned), then admin-created ones. A DB row with a built-in slug overrides it field by field. */
export function mergeCategories(locale: Locale, rows: Row[]): Category[] {
  const loc = getStaticDict(locale).categories.items as Record<string, CatText>;
  const out = new Map<string, Category>();
  categorySlugs.forEach((slug, i) =>
    out.set(slug, { ...loc[slug], slug, code: categoryCodes[slug], position: i * 10, hidden: false, builtin: true }),
  );
  for (const r of rows) {
    // New categories fall back to English text for languages not filled in yet.
    const text = pick({ ...(out.has(r.slug) ? {} : r.data?.en), ...r.data?.[locale] });
    const prev = out.get(r.slug) ?? { name: r.slug, short: "", examples: [], intro: "", uses: [], faq: [], slug: r.slug, code: "", position: r.position, hidden: false, builtin: false };
    out.set(r.slug, { ...prev, ...text, code: r.code || prev.code, position: r.position, hidden: r.hidden });
  }
  return [...out.values()].sort((a, b) => a.position - b.position);
}

function pick(t: Partial<CatText>): Partial<CatText> {
  const o: Partial<CatText> = {};
  if (t.name) o.name = t.name;
  if (t.short) o.short = t.short;
  if (t.intro) o.intro = t.intro;
  if (t.examples?.length) o.examples = t.examples;
  if (t.uses?.length) o.uses = t.uses;
  if (t.faq?.length) o.faq = t.faq;
  return o;
}

/** Public list: visible categories only. */
export async function getCategories(locale: Locale): Promise<Category[]> {
  const rows = process.env.DATABASE_URL ? await cachedRows() : [];
  return mergeCategories(locale, rows).filter((c) => !c.hidden);
}

export async function getCategory(locale: Locale, slug: string): Promise<Category | undefined> {
  return (await getCategories(locale)).find((c) => c.slug === slug);
}

/** Slugs of visible categories (for sitemap, static params). */
export async function getCategorySlugs(): Promise<string[]> {
  return (await getCategories("en")).map((c) => c.slug);
}

/** Uncached, including hidden — for the admin. */
export async function getAllCategoriesAdmin(locale: Locale): Promise<Category[]> {
  return mergeCategories(locale, await loadRows());
}

/** Raw stored row (uncached), for editing. */
export async function getCategoryRow(slug: string): Promise<Row | null> {
  const sql = await db();
  if (!sql) return null;
  const [r] = await sql<Row[]>`select slug, code, position, hidden, data from categories where slug = ${slug}`;
  return r ?? null;
}

export { locales };

/** Insert or replace a category row (admin). `data` is { en, ar, fr } of partial CatText. */
export async function upsertCategoryRow(r: { slug: string; code: string; position: number; hidden: boolean; data: Row["data"] }): Promise<void> {
  const sql = await db();
  if (!sql) throw new Error("No database configured");
  await sql`insert into categories (slug, code, position, hidden, data, updated_at)
    values (${r.slug}, ${r.code}, ${r.position}, ${r.hidden}, ${sql.json(r.data as never)}, now())
    on conflict (slug) do update set code = excluded.code, position = excluded.position, hidden = excluded.hidden,
      data = excluded.data, updated_at = now()`;
}

/** Delete a category row: removes a custom category, or resets a built-in one to its built-in copy. */
export async function deleteCategoryRow(slug: string): Promise<void> {
  const sql = await db();
  if (sql) await sql`delete from categories where slug = ${slug}`;
}

/** Change position/hidden only, creating an empty override row for built-ins if needed. */
export async function patchCategoryRow(slug: string, patch: { position?: number; hidden?: boolean }): Promise<void> {
  const sql = await db();
  if (!sql) throw new Error("No database configured");
  const current = (await getAllCategoriesAdmin("en")).find((c) => c.slug === slug);
  if (!current) return;
  const row = await getCategoryRow(slug);
  await upsertCategoryRow({
    slug,
    code: row?.code ?? "",
    position: patch.position ?? current.position,
    hidden: patch.hidden ?? current.hidden,
    data: row?.data ?? {},
  });
}
