import { unstable_cache } from "next/cache";
import type { Locale } from "@/i18n/config";
import { db } from "./db";
import { CONTENT_TAG } from "./content";

export type Post = {
  id: number;
  locale: string;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  published: boolean;
  published_at: Date | string | null;
  updated_at: Date | string;
};

async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch (e) {
    console.error("[posts]", e);
    return fallback;
  }
}

export const listPublished = unstable_cache(
  (locale: Locale) =>
    safe(async () => {
      const sql = await db();
      if (!sql) return [] as Post[];
      return sql<Post[]>`select * from posts where locale = ${locale} and published order by published_at desc nulls last, id desc`;
    }, [] as Post[]),
  ["posts-list"],
  { tags: [CONTENT_TAG], revalidate: 300 },
);

export const getPublished = unstable_cache(
  (locale: Locale, slug: string) =>
    safe(async () => {
      const sql = await db();
      if (!sql) return null;
      const [p] = await sql<Post[]>`select * from posts where locale = ${locale} and slug = ${slug} and published`;
      return p ?? null;
    }, null as Post | null),
  ["posts-one"],
  { tags: [CONTENT_TAG], revalidate: 300 },
);

/** Every locale/slug pair that is currently published (sitemap, static params). */
export const allPublishedSlugs = unstable_cache(
  () =>
    safe(async () => {
      const sql = await db();
      if (!sql) return [] as { locale: string; slug: string; updated_at: Date }[];
      return sql<{ locale: string; slug: string; updated_at: Date }[]>`select locale, slug, updated_at from posts where published`;
    }, [] as { locale: string; slug: string; updated_at: Date }[]),
  ["posts-slugs"],
  { tags: [CONTENT_TAG], revalidate: 300 },
);
