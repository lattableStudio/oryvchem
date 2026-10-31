import type { Metadata } from "next";
import { locales, localeMeta, defaultLocale, type Locale } from "@/i18n/config";
import { SITE } from "./site";

/** Absolute URL for a locale + path ("" for home). */
export function url(locale: Locale, path = ""): string {
  return `${SITE.url}/${locale}${path ? encodeURI(path.startsWith("/") ? path : `/${path}`) : ""}`;
}

/** Meta-description excerpt: cut on a word boundary, with "…" only when the text was actually shortened. */
export function snippet(text: string, max = 155): string {
  const t = text.replace(/\s+/g, " ").trim();
  return t.length <= max ? t : `${t.slice(0, max).replace(/\s+\S*$/, "")}…`;
}

/** Markdown to plain text (formatting marks and link targets removed). */
export function plainText(md: string): string {
  return md.replace(/[#*`>_]|\[([^\]]*)\]\([^)]*\)/g, "$1").replace(/\s+/g, " ").trim();
}

export function alternates(locale: Locale, path = ""): Metadata["alternates"] {
  const languages: Record<string, string> = {};
  for (const l of locales) languages[localeMeta[l].hreflang] = url(l, path);
  languages["x-default"] = url(defaultLocale, path);
  return { canonical: url(locale, path), languages };
}

export function pageMetadata(opts: {
  locale: Locale;
  path?: string;
  title: string;
  description: string;
  keywords?: string[];
  /** Only a self-canonical (for pages that exist in a single language, e.g. articles). */
  selfOnly?: boolean;
  type?: "website" | "article";
  /** Absolute image URL for social sharing; defaults to the generated /og card. */
  image?: string;
}): Metadata {
  const { locale, path = "", title, description, keywords, selfOnly, type = "website", image } = opts;
  const ogImage = { url: image ?? `${SITE.url}/og`, ...(image ? {} : { width: 1200, height: 630 }), alt: "Oryvchem — industrial chemical sourcing, Foshan, China" };
  return {
    title,
    description,
    keywords,
    alternates: selfOnly ? { canonical: url(locale, path) } : alternates(locale, path),
    openGraph: {
      type,
      siteName: SITE.name,
      title,
      description,
      url: url(locale, path),
      locale: localeMeta[locale].ogLocale,
      alternateLocale: selfOnly ? undefined : locales.filter((l) => l !== locale).map((l) => localeMeta[l].ogLocale),
      images: [ogImage],
    },
    twitter: { card: "summary_large_image", title, description, images: [ogImage.url] },
  };
}
