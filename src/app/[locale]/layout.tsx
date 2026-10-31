import type { Metadata, Viewport } from "next";
import { Space_Grotesk, IBM_Plex_Sans, IBM_Plex_Mono, IBM_Plex_Sans_Arabic } from "next/font/google";
import { notFound } from "next/navigation";
import { locales, localeMeta, isLocale } from "@/i18n/config";
import { getDict } from "@/lib/content";
import { getCategories } from "@/lib/categories";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { listPageLinks } from "@/lib/pages";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { Enhance } from "@/components/Enhance";
import { JsonLd } from "@/lib/jsonld";
import { organizationSchema } from "@/lib/schema";
import { bannerFor, getBanner, getSite } from "@/lib/settings";
import { SITE } from "@/lib/site";
import "../globals.css";

const head = Space_Grotesk({ subsets: ["latin"], variable: "--f-head", display: "swap" });
const sans = IBM_Plex_Sans({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--f-sans", display: "swap" });
// Not preloaded: mono is only used for small labels, and Arabic would otherwise be preloaded on en/fr pages too
// (preloads are per layout, not per locale). Both still load via @font-face with display: swap.
const mono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--f-mono", display: "swap", preload: false });
const arabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic"],
  preload: false,
  weight: ["400", "500", "600", "700"],
  variable: "--f-ar",
  display: "swap",
});

export const viewport: Viewport = { themeColor: "#0A161D", width: "device-width", initialScale: 1 };

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}


export function generateMetadata(): Metadata {
  return {
    metadataBase: new URL(SITE.url),
    applicationName: SITE.name,
    authors: [{ name: "Oryvchem Sourcing", url: SITE.url }],
    creator: SITE.name,
    publisher: SITE.name,
    formatDetection: { telephone: false },
    robots: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
    other: { "geo.region": "CN-GD", "geo.placename": "Foshan", "geo.position": `${SITE.geo.lat};${SITE.geo.lng}`, ICBM: `${SITE.geo.lat}, ${SITE.geo.lng}` },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const [d, cats, site, bannerRaw, pageLinks] = await Promise.all([getDict(locale), getCategories(locale), getSite(), getBanner(), listPageLinks(locale)]);
  const banner = bannerFor(bannerRaw, locale);
  const { dir } = localeMeta[locale];

  return (
    <html lang={locale} dir={dir} className={`${head.variable} ${sans.variable} ${mono.variable} ${arabic.variable}`}>
      <body>
        <JsonLd data={organizationSchema(locale, d, cats, site)} />
        {banner && (
          <div className="banner" role="note">
            {banner.text}
            {banner.link && <a href={banner.link} {...(banner.link.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}>→</a>}
          </div>
        )}
        <Header locale={locale} t={d.nav} phone={site.phone} phoneHref={site.phoneHref} pages={pageLinks.filter((p) => p.show_in_nav)} />
        <main id="main">{children}</main>
        <Footer locale={locale} d={d} cats={cats} site={site} />
        <WhatsAppButton label={d.contactInfo.whatsapp} href={site.whatsapp} />
        <Enhance />
      </body>
    </html>
  );
}
