import type { MetadataRoute } from "next";
import { locales, localeMeta, defaultLocale, isLocale } from "@/i18n/config";
import { categorySlugs, SITE } from "@/lib/site";
import { url } from "@/lib/seo";
import { allPublishedSlugs } from "@/lib/posts";

export const revalidate = 300;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const paths = ["", "/insights", ...categorySlugs.map((s) => `/products/${s}`)];
  const lastModified = new Date(SITE.updated);
  const pages: MetadataRoute.Sitemap = paths.flatMap((path) =>
    locales.map((locale) => ({
      url: url(locale, path),
      lastModified,
      changeFrequency: path === "" || path === "/insights" ? ("weekly" as const) : ("monthly" as const),
      priority: path === "" ? 1 : path === "/insights" ? 0.7 : 0.8,
      alternates: {
        languages: {
          ...Object.fromEntries(locales.map((l) => [localeMeta[l].hreflang, url(l, path)])),
          "x-default": url(defaultLocale, path),
        },
      },
    })),
  );
  const posts = (await allPublishedSlugs())
    .filter((p) => isLocale(p.locale))
    .map((p) => ({
      url: url(p.locale as (typeof locales)[number], `/insights/${p.slug}`),
      lastModified: new Date(p.updated_at),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    }));
  return [...pages, ...posts];
}
