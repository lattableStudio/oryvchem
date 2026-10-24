import type { Locale } from "@/i18n/config";
import type { Dict } from "@/i18n/dictionaries";
import type { Category } from "./categories";
import { SITE } from "./site";
import { socialLinks, type SiteSettings } from "./settings";
import { url } from "./seo";

const orgId = `${SITE.url}/#organization`;

export function organizationSchema(locale: Locale, d: Dict, cats: Category[], site: SiteSettings) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": ["Organization", "LocalBusiness"],
        "@id": orgId,
        name: SITE.name,
        alternateName: ["Oryvchem Sourcing", "أوريف كيم"],
        url: SITE.url,
        logo: `${SITE.url}/icon.svg`,
        image: `${SITE.url}/og`,
        description: d.answer.body,
        email: site.email,
        telephone: site.phone,
        ...(socialLinks(site).length ? { sameAs: socialLinks(site).map((s) => s.url) } : {}),
        address: {
          "@type": "PostalAddress",
          streetAddress: site.address.street,
          addressLocality: site.address.locality,
          addressRegion: site.address.region,
          addressCountry: site.address.country,
        },
        geo: { "@type": "GeoCoordinates", latitude: SITE.geo.lat, longitude: SITE.geo.lng },
        areaServed: "Worldwide",
        knowsLanguage: ["en", "ar", "fr", "zh"],
        contactPoint: [
          {
            "@type": "ContactPoint",
            telephone: site.phone,
            email: site.email,
            contactType: "sales",
            areaServed: ["SA", "AE", "QA", "KW", "OM", "EG", "MA", "DZ", "TN", "FR", "BE", "SN", "CI", "Worldwide"],
            availableLanguage: ["English", "Arabic", "French", "Chinese"],
          },
        ],
        knowsAbout: cats.map((c) => c.name),
        makesOffer: cats.map((c) => ({
          "@type": "Offer",
          itemOffered: { "@type": "Service", name: c.name, url: url(locale, `/products/${c.slug}`) },
        })),
      },
      {
        "@type": "WebSite",
        "@id": `${SITE.url}/#website`,
        url: SITE.url,
        name: SITE.name,
        publisher: { "@id": orgId },
        inLanguage: ["en", "ar", "fr"],
      },
    ],
  };
}

export function homeSchema(locale: Locale, d: Dict, cats: Category[]) {
  return [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "@id": `${url(locale)}#webpage`,
      url: url(locale),
      name: d.meta.title,
      description: d.meta.description,
      inLanguage: locale,
      isPartOf: { "@id": `${SITE.url}/#website` },
      about: { "@id": orgId },
      dateModified: SITE.updated,
    },
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: d.categories.title,
      itemListElement: cats.map((c, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: c.name,
        url: url(locale, `/products/${c.slug}`),
      })),
    },
    faqSchema(d.faq.items),
    {
      "@context": "https://schema.org",
      "@type": "HowTo",
      name: d.process.title,
      step: d.process.steps.map((s, i) => ({ "@type": "HowToStep", position: i + 1, name: s.t, text: s.d })),
    },
  ];
}

export function faqSchema(items: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((i) => ({
      "@type": "Question",
      name: i.q,
      acceptedAnswer: { "@type": "Answer", text: i.a },
    })),
  };
}

export function productPageSchema(locale: Locale, c: Category, d: Dict) {
  const slug = c.slug;
  return [
    {
      "@context": "https://schema.org",
      "@type": "Service",
      "@id": `${url(locale, `/products/${slug}`)}#service`,
      name: c.name,
      description: c.intro,
      serviceType: c.name,
      provider: { "@id": orgId },
      areaServed: "Worldwide",
      inLanguage: locale,
      url: url(locale, `/products/${slug}`),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: d.product.home, item: url(locale) },
        { "@type": "ListItem", position: 2, name: d.product.products, item: `${url(locale)}#categories` },
        { "@type": "ListItem", position: 3, name: c.name, item: url(locale, `/products/${slug}`) },
      ],
    },
    faqSchema(c.faq),
  ];
}

export function articleSchema(
  locale: Locale,
  p: { slug: string; title: string; excerpt: string; published_at: Date | string | null; updated_at: Date | string; cover_media?: number | string | null },
) {
  const pageUrl = url(locale, `/insights/${p.slug}`);
  return [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      "@id": `${pageUrl}#article`,
      headline: p.title,
      description: p.excerpt,
      inLanguage: locale,
      url: pageUrl,
      mainEntityOfPage: pageUrl,
      image: p.cover_media ? `${SITE.url}/media/${p.cover_media}` : `${SITE.url}/og`,
      datePublished: new Date(p.published_at ?? p.updated_at).toISOString(),
      dateModified: new Date(p.updated_at).toISOString(),
      author: { "@id": orgId },
      publisher: { "@id": orgId },
    },
  ];
}
