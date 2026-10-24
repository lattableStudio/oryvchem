export const SITE = {
  name: "Oryvchem",
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.oryvchem.com").replace(/\/$/, ""),
  phone: "+86 159 0034 0902",
  phoneHref: "tel:+8615900340902",
  whatsapp: "https://wa.me/8615900340902",
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "inquiries@oryvchem.com",
  updated: "2026-10-24",
  address: { locality: "Foshan", region: "Guangdong", country: "CN", street: "Nanhai District" },
  geo: { lat: 23.0289, lng: 113.1219 },
} as const;

export const categorySlugs = [
  "ceramic-raw-materials",
  "water-treatment",
  "surfactants-detergents",
  "plastics-rubber",
  "paints-coatings",
  "textile-auxiliaries",
  "custom-sourcing",
] as const;
export type CategorySlug = (typeof categorySlugs)[number];

export const categoryCodes: Record<CategorySlug, string> = {
  "ceramic-raw-materials": "CER",
  "water-treatment": "WTR",
  "surfactants-detergents": "SUR",
  "plastics-rubber": "PLA",
  "paints-coatings": "PNT",
  "textile-auxiliaries": "TEX",
  "custom-sourcing": "CST",
};

export function isCategory(v: string): v is CategorySlug {
  return (categorySlugs as readonly string[]).includes(v);
}
