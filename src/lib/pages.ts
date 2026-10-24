import { unstable_cache } from "next/cache";
import type { Locale } from "@/i18n/config";
import { db } from "./db";
import { CONTENT_TAG } from "./content";

export type CmsPage = {
  id: number;
  locale: string;
  slug: string;
  title: string;
  body: string;
  seo_title: string;
  seo_description: string;
  cover_media: number | string | null;
  published: boolean;
  show_in_nav: boolean;
  show_in_footer: boolean;
  position: number;
  updated_at: Date | string;
};
export type PageLink = { slug: string; title: string; show_in_nav: boolean; show_in_footer: boolean; position: number };
export type PageRef = { locale: string; slug: string; updated_at: Date | string };

/** Slugs that already mean something at /{locale}/{slug} or at the site root. */
export const RESERVED_SLUGS = new Set([
  "en", "ar", "fr", "products", "insights", "admin", "api", "og", "llms", "llms-full", "llms.txt", "sitemap", "sitemap.xml",
  "robots", "robots.txt", "manifest", "manifest.webmanifest", "media", "_next", "icon", "favicon.ico",
]);

export const slugify = (s: string) =>
  s.normalize("NFKD").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-+|-+$/g, "").slice(0, 80);

async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch (e) {
    console.error("[pages]", e);
    return fallback;
  }
}

export const getPublishedPage = unstable_cache(
  (locale: Locale, slug: string) =>
    safe(async () => {
      const sql = await db();
      if (!sql) return null;
      const [p] = await sql<CmsPage[]>`select * from pages where locale = ${locale} and slug = ${slug} and published`;
      return p ?? null;
    }, null as CmsPage | null),
  ["pages-one"],
  { tags: [CONTENT_TAG], revalidate: 300 },
);

/** Published pages for the header / footer, ordered by position. */
export const listPageLinks = unstable_cache(
  (locale: Locale) =>
    safe(async () => {
      const sql = await db();
      if (!sql) return [] as PageLink[];
      return sql<PageLink[]>`select slug, title, show_in_nav, show_in_footer, position from pages
        where locale = ${locale} and published order by position, id`;
    }, [] as PageLink[]),
  ["pages-links"],
  { tags: [CONTENT_TAG], revalidate: 300 },
);

/** Every published locale/slug pair (sitemap, hreflang). */
export const allPublishedPages = unstable_cache(
  () =>
    safe(async () => {
      const sql = await db();
      if (!sql) return [] as PageRef[];
      return sql<PageRef[]>`select locale, slug, updated_at from pages where published`;
    }, [] as PageRef[]),
  ["pages-all"],
  { tags: [CONTENT_TAG], revalidate: 300 },
);

/** Published pages in a language, with body (llms-full.txt). */
export const listPublishedPages = unstable_cache(
  (locale: Locale) =>
    safe(async () => {
      const sql = await db();
      if (!sql) return [] as CmsPage[];
      return sql<CmsPage[]>`select * from pages where locale = ${locale} and published order by position, id`;
    }, [] as CmsPage[]),
  ["pages-published"],
  { tags: [CONTENT_TAG], revalidate: 300 },
);
