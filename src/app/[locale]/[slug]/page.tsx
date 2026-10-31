import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { defaultLocale, isLocale, localeMeta, locales } from "@/i18n/config";
import { getDict } from "@/lib/content";
import { allPublishedPages, getPublishedPage, RESERVED_SLUGS } from "@/lib/pages";
import { pageMetadata, plainText, snippet, url } from "@/lib/seo";
import { JsonLd } from "@/lib/jsonld";
import { breadcrumbSchema } from "@/lib/schema";
import { Markdown } from "@/lib/markdown";
import { SITE } from "@/lib/site";

export const revalidate = 300;
export const dynamicParams = true; // new pages appear without a rebuild

export function generateStaticParams() {
  return [];
}

const decode = (s: string) => {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
};

/** First ~155 characters of the body as plain text, for pages without an SEO description. */
const plain = (md: string) => snippet(plainText(md));

type P = { params: Promise<{ locale: string; slug: string }> };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { locale, slug: rawSlug } = await params;
  const slug = decode(rawSlug);
  if (!isLocale(locale) || RESERVED_SLUGS.has(slug)) return {};
  const page = await getPublishedPage(locale, slug);
  if (!page) return {};
  const meta = pageMetadata({
    locale,
    path: `/${slug}`,
    title: page.seo_title || `${page.title} — ${SITE.name}`,
    description: page.seo_description || plain(page.body) || page.title,
    selfOnly: true,
  });
  // hreflang only for languages in which this slug really exists
  const have = new Set((await allPublishedPages()).filter((p) => p.slug === slug).map((p) => p.locale));
  have.add(locale);
  if (have.size > 1) {
    const languages: Record<string, string> = {};
    for (const l of locales) if (have.has(l)) languages[localeMeta[l].hreflang] = url(l, `/${slug}`);
    languages["x-default"] = url(have.has(defaultLocale) ? defaultLocale : locale, `/${slug}`);
    meta.alternates = { canonical: url(locale, `/${slug}`), languages };
  }
  return meta;
}

export default async function CustomPage({ params }: P) {
  const { locale, slug: rawSlug } = await params;
  const slug = decode(rawSlug);
  if (!isLocale(locale) || RESERVED_SLUGS.has(slug)) notFound();
  const page = await getPublishedPage(locale, slug);
  if (!page) notFound();
  const d = await getDict(locale);
  const pageUrl = url(locale, `/${slug}`);
  const schema = [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "@id": `${pageUrl}#webpage`,
      url: pageUrl,
      name: page.title,
      description: page.seo_description || plain(page.body) || page.title,
      inLanguage: locale,
      dateModified: new Date(page.updated_at).toISOString(),
      isPartOf: { "@id": `${SITE.url}/#website` },
    },
    breadcrumbSchema([
      [d.product.home, url(locale)],
      [page.title, pageUrl],
    ]),
  ];

  return (
    <>
      {schema.map((s, i) => (
        <JsonLd key={i} data={s} />
      ))}
      <article>
        <section className="page-hero">
          <div className="wrap narrow">
            <nav className="crumbs" aria-label="Breadcrumb">
              <Link href={`/${locale}`}>{d.product.home}</Link>
              <span aria-hidden="true">/</span>
              <span aria-current="page">{page.title}</span>
            </nav>
            <h1 className="headline">{page.title}</h1>
          </div>
        </section>
        <section>
          <div className="wrap narrow prose">
            {page.cover_media && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={`/media/${page.cover_media}`} alt="" style={{ width: "100%", height: "auto", borderRadius: 14, marginBottom: 28 }} />
            )}
            <Markdown source={page.body} />
          </div>
        </section>
      </article>
      <section className="cta-band">
        <div className="wrap narrow">
          <h2 className="section-title">{d.insights.ctaTitle}</h2>
          <p>{d.insights.ctaText}</p>
          <p><Link className="btn-primary" href={`/${locale}#contact`}>{d.nav.quote}</Link></p>
        </div>
      </section>
    </>
  );
}
