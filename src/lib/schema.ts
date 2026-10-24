import type { Locale } from "@/i18n/config";
import { getStaticDict, type Dict } from "@/i18n/dictionaries";
import { categorySlugs, type CategorySlug, SITE } from "./site";
import { url } from "./seo";

const orgId = `${SITE.url}/#organization`;

export function organizationSchema(locale: Locale, d: Dict) {
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
        email: SITE.email,
        telephone: SITE.phone,
        address: {
          "@type": "PostalAddress",
          streetAddress: SITE.address.street,
          addressLocality: SITE.address.locality,
          addressRegion: SITE.address.region,
          addressCountry: SITE.address.country,
        },
        geo: { "@type": "GeoCoordinates", latitude: SITE.geo.lat, longitude: SITE.geo.lng },
        areaServed: "Worldwide",
        knowsLanguage: ["en", "ar", "fr", "zh"],
        contactPoint: [
          {
            "@type": "ContactPoint",
            telephone: SITE.phone,
            email: SITE.email,
            contactType: "sales",
            areaServed: ["SA", "AE", "QA", "KW", "OM", "EG", "MA", "DZ", "TN", "FR", "BE", "SN", "CI", "Worldwide"],
            availableLanguage: ["English", "Arabic", "French", "Chinese"],
          },
        ],
        knowsAbout: categorySlugs.map((s) => getStaticDict("en").categories.items[s].name),
        makesOffer: categorySlugs.map((s) => ({
          "@type": "Offer",
          itemOffered: { "@type": "Service", name: d.categories.items[s].name, url: url(locale, `/products/${s}`) },
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

export function homeSchema(locale: Locale, d: Dict) {
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
      itemListElement: categorySlugs.map((s, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: d.categories.items[s].name,
        url: url(locale, `/products/${s}`),
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

export function productPageSchema(locale: Locale, slug: CategorySlug, d: Dict) {
  const c = d.categories.items[slug];
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
  p: { slug: string; title: string; excerpt: string; published_at: Date | string | null; updated_at: Date | string },
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
      image: `${SITE.url}/og`,
      datePublished: new Date(p.published_at ?? p.updated_at).toISOString(),
      dateModified: new Date(p.updated_at).toISOString(),
      author: { "@id": orgId },
      publisher: { "@id": orgId },
    },
  ];
}
