import { unstable_cache } from "next/cache";
import { db } from "./db";
import { CONTENT_TAG } from "./content";

/** Home sections below the fixed hero + ticker, in their default order. */
export const HOME_SECTIONS = [
  { id: "answer", label: "What is Oryvchem (answer block)" },
  { id: "categories", label: "Product categories" },
  { id: "capability", label: "Sourcing capability" },
  { id: "process", label: "Process steps" },
  { id: "markets", label: "Markets" },
  { id: "cta", label: "Call-back band" },
  { id: "compliance", label: "Compliance" },
  { id: "faq", label: "FAQ" },
  { id: "contact", label: "Contact + quote form" },
] as const;

export type HomeSectionId = (typeof HOME_SECTIONS)[number]["id"];
export type HomeSection = { id: HomeSectionId; visible: boolean };
export const HOME_KEY = "home.sections";

export const isHomeSectionId = (v: unknown): v is HomeSectionId => HOME_SECTIONS.some((s) => s.id === v);
export const defaultHomeLayout = (): HomeSection[] => HOME_SECTIONS.map((s) => ({ id: s.id, visible: true }));

/** Stored layout merged onto the defaults: unknown ids dropped, duplicates ignored, missing sections appended visible. */
export function normalizeLayout(raw: unknown): HomeSection[] {
  const out: HomeSection[] = [];
  const seen = new Set<string>();
  if (Array.isArray(raw)) {
    for (const it of raw) {
      const id = (it as { id?: unknown })?.id;
      if (!isHomeSectionId(id) || seen.has(id)) continue;
      seen.add(id);
      out.push({ id, visible: (it as { visible?: unknown }).visible !== false });
    }
  }
  for (const s of defaultHomeLayout()) if (!seen.has(s.id)) out.push(s);
  return out;
}

export async function loadHomeLayout(): Promise<HomeSection[]> {
  try {
    const sql = await db();
    if (!sql) return defaultHomeLayout();
    const [row] = await sql<{ value: unknown }[]>`select value from settings where key = ${HOME_KEY}`;
    return normalizeLayout(row?.value);
  } catch (e) {
    console.error("[homeLayout] could not load", e);
    return defaultHomeLayout();
  }
}

const cached = unstable_cache(loadHomeLayout, ["home-layout"], { tags: [CONTENT_TAG], revalidate: 300 });

/** Public read: cached, defaults when there is no database. */
export async function getHomeLayout(): Promise<HomeSection[]> {
  return process.env.DATABASE_URL ? cached() : defaultHomeLayout();
}
