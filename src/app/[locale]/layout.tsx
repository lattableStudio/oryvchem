import type { Metadata, Viewport } from "next";
import { Space_Grotesk, IBM_Plex_Sans, IBM_Plex_Mono, IBM_Plex_Sans_Arabic } from "next/font/google";
import { notFound } from "next/navigation";
import { locales, localeMeta, isLocale } from "@/i18n/config";
import { getDict } from "@/lib/content";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { JsonLd } from "@/lib/jsonld";
import { organizationSchema } from "@/lib/schema";
import { SITE } from "@/lib/site";
import "../globals.css";

const head = Space_Grotesk({ subsets: ["latin"], variable: "--f-head", display: "swap" });
const sans = IBM_Plex_Sans({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--f-sans", display: "swap" });
const mono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--f-mono", display: "swap" });
const arabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic"],
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
  const d = await getDict(locale);
  const { dir } = localeMeta[locale];

  return (
    <html lang={locale} dir={dir} className={`${head.variable} ${sans.variable} ${mono.variable} ${arabic.variable}`}>
      <body>
        <JsonLd data={organizationSchema(locale, d)} />
        <Header locale={locale} t={d.nav} />
        <main id="main">{children}</main>
        <Footer locale={locale} d={d} />
        <WhatsAppButton label={d.contactInfo.whatsapp} />
      </body>
    </html>
  );
}
