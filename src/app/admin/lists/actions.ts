"use server";

import { redirect } from "next/navigation";
import { revalidatePath, revalidateTag } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { CONTENT_TAG } from "@/lib/content";
import { isLocale, locales } from "@/i18n/config";
import { cleanItems, listDef } from "@/lib/lists";

const str = (v: FormDataEntryValue | null, max = 100000) => (typeof v === "string" ? v.slice(0, max) : "");

function flush() {
  revalidateTag(CONTENT_TAG, "max");
  for (const l of locales) revalidatePath(`/${l}`);
  for (const f of ["/llms.txt", "/llms-full.txt"]) revalidatePath(f);
}

function target(fd: FormData) {
  const locale = str(fd.get("locale"), 5);
  const key = str(fd.get("key"), 60);
  return isLocale(locale) && listDef(key) ? { locale, key } : null;
}

export async function saveList(fd: FormData) {
  await requireAdmin();
  const t = target(fd);
  const sql = await db();
  if (!t || !sql) return;
  let raw: unknown = [];
  try {
    raw = JSON.parse(str(fd.get("items")));
  } catch {}
  const items = cleanItems(t.key, raw).map((it) => Object.fromEntries(Object.entries(it).map(([k, v]) => [k, v.slice(0, 2000)]))).slice(0, 50);
  if (items.length) {
    await sql`insert into content_lists (locale, key, items) values (${t.locale}, ${t.key}, ${sql.json(items)})
      on conflict (locale, key) do update set items = excluded.items, updated_at = now()`;
  } else {
    // An empty list would blank the section; treat it as "use built-in".
    await sql`delete from content_lists where locale = ${t.locale} and key = ${t.key}`;
  }
  flush();
  redirect(`/admin/lists?locale=${t.locale}&saved=${t.key}`);
}

export async function resetList(fd: FormData) {
  await requireAdmin();
  const t = target(fd);
  const sql = await db();
  if (!t || !sql) return;
  await sql`delete from content_lists where locale = ${t.locale} and key = ${t.key}`;
  flush();
  redirect(`/admin/lists?locale=${t.locale}&saved=${t.key}`);
}
