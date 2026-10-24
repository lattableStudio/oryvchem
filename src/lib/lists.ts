import type { Locale } from "@/i18n/config";
import type { Dict } from "@/i18n/dictionaries";
import { db } from "./db";

/** Editable repeating lists on the home page. Each list replaces the built-in array wholesale once saved. */
export type ListField = { k: string; label: string; multiline?: boolean };
export type ListDef = { key: string; label: string; help: string; fields: ListField[] };

export const LIST_DEFS: ListDef[] = [
  { key: "process.steps", label: "Process steps", help: "The numbered steps in “How a shipment moves”.", fields: [{ k: "t", label: "Title" }, { k: "d", label: "Description", multiline: true }] },
  { key: "capability.items", label: "Sourcing capability", help: "The cards in the “Sourcing capability” section.", fields: [{ k: "t", label: "Title" }, { k: "d", label: "Description", multiline: true }] },
  { key: "markets.regions", label: "Markets", help: "Regions we serve.", fields: [{ k: "name", label: "Region" }, { k: "countries", label: "Countries" }] },
  { key: "compliance.items", label: "Compliance items", help: "The checklist in the Compliance section.", fields: [{ k: "t", label: "Title" }, { k: "d", label: "Description", multiline: true }] },
];

export type ListItem = Record<string, string>;
type Row = { key: string; items: ListItem[] };

export function listDef(key: string): ListDef | undefined {
  return LIST_DEFS.find((d) => d.key === key);
}

/** Built-in items for a list, from the static dictionary. */
export function builtinList(d: Dict, key: string): ListItem[] {
  let cur: unknown = d;
  for (const part of key.split(".")) cur = (cur as Record<string, unknown> | undefined)?.[part];
  return Array.isArray(cur) ? (cur as ListItem[]) : [];
}

/** Keep only the declared string fields; drop items with every field empty. */
export function cleanItems(key: string, raw: unknown): ListItem[] {
  const def = listDef(key);
  if (!def || !Array.isArray(raw)) return [];
  return raw
    .map((it) => Object.fromEntries(def.fields.map((f) => [f.k, String((it as Record<string, unknown>)?.[f.k] ?? "").trim()])))
    .filter((it) => def.fields.some((f) => it[f.k]));
}

export async function loadLists(locale: Locale): Promise<Row[]> {
  try {
    const sql = await db();
    if (!sql) return [];
    return await sql<Row[]>`select key, items from content_lists where locale = ${locale}`;
  } catch (e) {
    console.error("[lists] could not load", e);
    return [];
  }
}

export function applyLists(base: Dict, rows: Row[]): Dict {
  if (!rows.length) return base;
  const out = structuredClone(base) as unknown as Record<string, Record<string, unknown>>;
  for (const { key, items } of rows) {
    const def = listDef(key);
    if (!def) continue;
    const [section, field] = key.split(".");
    const clean = cleanItems(key, items);
    if (clean.length && out[section] && Array.isArray(out[section][field])) out[section][field] = clean;
  }
  return out as unknown as Dict;
}
