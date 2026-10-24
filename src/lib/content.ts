import { unstable_cache } from "next/cache";
import type { Locale } from "@/i18n/config";
import { getStaticDict, type Dict } from "@/i18n/dictionaries";
import { db } from "./db";

export const CONTENT_TAG = "content";

/** Every string leaf of the dictionary as [dotted.path, value]. */
export function flatten(node: unknown, prefix = ""): [string, string][] {
  if (typeof node === "string") return [[prefix, node]];
  if (Array.isArray(node)) return node.flatMap((v, i) => flatten(v, prefix ? `${prefix}.${i}` : String(i)));
  if (node && typeof node === "object") {
    return Object.entries(node).flatMap(([k, v]) => flatten(v, prefix ? `${prefix}.${k}` : k));
  }
  return [];
}

type Row = { path: string; value: string };

function applyOverrides(base: Dict, rows: Row[]): Dict {
  if (!rows.length) return base;
  const out = structuredClone(base) as unknown as Record<string, unknown>;
  for (const { path, value } of rows) {
    const keys = path.split(".");
    let cur: unknown = out;
    for (let i = 0; i < keys.length - 1 && cur; i++) cur = (cur as Record<string, unknown>)[keys[i]];
    const last = keys[keys.length - 1];
    // Only replace strings that already exist, so a stale override can never change the shape.
    if (cur && typeof (cur as Record<string, unknown>)[last] === "string") (cur as Record<string, unknown>)[last] = value;
  }
  return out as unknown as Dict;
}

async function loadOverrides(locale: Locale): Promise<Row[]> {
  try {
    const sql = await db();
    if (!sql) return [];
    return await sql<Row[]>`select path, value from content_overrides where locale = ${locale}`;
  } catch (e) {
    console.error("[content] could not load overrides", e);
    return [];
  }
}

const cachedOverrides = unstable_cache(loadOverrides, ["content-overrides"], { tags: [CONTENT_TAG], revalidate: 300 });

/** Dictionary with admin edits applied. Falls back to built-in copy if the DB is absent or down. */
export async function getDict(locale: Locale): Promise<Dict> {
  if (!process.env.DATABASE_URL) return getStaticDict(locale);
  return applyOverrides(getStaticDict(locale), await cachedOverrides(locale));
}

/** Uncached current overrides, for the admin editor. */
export async function getOverridePaths(locale: Locale): Promise<Set<string>> {
  return new Set((await loadOverrides(locale)).map((r) => r.path));
}
export { applyOverrides, loadOverrides };
