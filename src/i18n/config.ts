export const locales = ["en", "ar", "fr"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

export const localeMeta: Record<
  Locale,
  { dir: "ltr" | "rtl"; label: string; native: string; ogLocale: string; hreflang: string }
> = {
  en: { dir: "ltr", label: "English", native: "English", ogLocale: "en_US", hreflang: "en" },
  ar: { dir: "rtl", label: "Arabic", native: "العربية", ogLocale: "ar_AR", hreflang: "ar" },
  fr: { dir: "ltr", label: "French", native: "Français", ogLocale: "fr_FR", hreflang: "fr" },
};

export function isLocale(v: string): v is Locale {
  return (locales as readonly string[]).includes(v);
}
