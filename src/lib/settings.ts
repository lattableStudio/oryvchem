import { unstable_cache } from "next/cache";
import type { Locale } from "@/i18n/config";
import { db } from "./db";
import { SITE } from "./site";
import { CONTENT_TAG } from "./content";

export const SOCIAL_KEYS = ["linkedin", "facebook", "instagram", "x", "youtube"] as const;
export type SocialKey = (typeof SOCIAL_KEYS)[number];
export type Social = Record<SocialKey, string>;

export type SiteSettings = {
  name: string;
  url: string;
  phone: string;
  phoneHref: string;
  whatsapp: string;
  email: string;
  address: { locality: string; region: string; country: string; street: string };
  geo: { lat: number; lng: number };
  updated: string;
  social: Social;
};

/** What the admin saves under settings.key = "site". Empty/missing fields fall back to the static SITE. */
export type StoredSite = Partial<{
  phone: string;
  whatsappNumber: string;
  email: string;
  street: string;
  locality: string;
  region: string;
  country: string;
  social: Partial<Social>;
}>;

export type Banner = { enabled: boolean; text: Record<Locale, string>; link: string };

export const SITE_KEY = "site";
export const BANNER_KEY = "banner";

const emptySocial = (): Social => ({ linkedin: "", facebook: "", instagram: "", x: "", youtube: "" });
export const emptyBanner = (): Banner => ({ enabled: false, text: { en: "", ar: "", fr: "" }, link: "" });

export const phoneToHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, "")}`;
export const whatsappDigits = (url: string) => url.replace(/^https?:\/\/wa\.me\//, "").replace(/\D/g, "");

type Row = { key: string; value: unknown };

async function loadRows(): Promise<Row[]> {
  try {
    const sql = await db();
    if (!sql) return [];
    return await sql<Row[]>`select key, value from settings where key in (${SITE_KEY}, ${BANNER_KEY})`;
  } catch (e) {
    console.error("[settings] could not load", e);
    return [];
  }
}
const cachedRows = unstable_cache(loadRows, ["settings-rows"], { tags: [CONTENT_TAG], revalidate: 300 });

/** Uncached, for the admin form. */
export async function loadStored(): Promise<{ site: StoredSite; banner: Banner }> {
  return parse(await loadRows());
}

function parse(rows: Row[]): { site: StoredSite; banner: Banner } {
  const site = (rows.find((r) => r.key === SITE_KEY)?.value ?? {}) as StoredSite;
  const b = (rows.find((r) => r.key === BANNER_KEY)?.value ?? {}) as Partial<Banner>;
  return { site, banner: { ...emptyBanner(), ...b, text: { ...emptyBanner().text, ...(b.text ?? {}) } } };
}

export function mergeSite(stored: StoredSite): SiteSettings {
  const phone = stored.phone || SITE.phone;
  const wa = stored.whatsappNumber ? stored.whatsappNumber.replace(/\D/g, "") : whatsappDigits(SITE.whatsapp);
  return {
    name: SITE.name,
    url: SITE.url,
    phone,
    phoneHref: phoneToHref(phone),
    whatsapp: `https://wa.me/${wa}`,
    email: stored.email || SITE.email,
    address: {
      street: stored.street || SITE.address.street,
      locality: stored.locality || SITE.address.locality,
      region: stored.region || SITE.address.region,
      country: stored.country || SITE.address.country,
    },
    geo: { ...SITE.geo },
    updated: SITE.updated,
    social: { ...emptySocial(), ...(stored.social ?? {}) },
  };
}

async function rows(): Promise<Row[]> {
  return process.env.DATABASE_URL ? cachedRows() : [];
}

/** Static SITE defaults overlaid with admin edits. Falls back to SITE when the DB is absent or down. */
export async function getSite(): Promise<SiteSettings> {
  return mergeSite(parse(await rows()).site);
}

export async function getBanner(): Promise<Banner> {
  return parse(await rows()).banner;
}

/** Banner text for a language (falls back to English), or null when off/empty. */
export function bannerFor(b: Banner, locale: Locale): { text: string; link: string } | null {
  const text = (b.text[locale] || b.text.en || "").trim();
  return b.enabled && text ? { text, link: b.link } : null;
}

/** https URLs of the social profiles that are set, for schema.org sameAs and the footer. */
export function socialLinks(s: SiteSettings): { key: SocialKey; url: string }[] {
  return SOCIAL_KEYS.filter((k) => s.social[k]).map((k) => ({ key: k, url: s.social[k] }));
}
