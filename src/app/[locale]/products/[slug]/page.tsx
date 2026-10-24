import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { locales, isLocale } from "@/i18n/config";
import { getDict } from "@/lib/content";
import { getCategories, getCategory, getCategorySlugs } from "@/lib/categories";
import { SITE } from "@/lib/site";
import { getSite } from "@/lib/settings";
import { pageMetadata } from "@/lib/seo";
import { JsonLd } from "@/lib/jsonld";
import { productPageSchema } from "@/lib/schema";
import { InquiryForm } from "@/components/InquiryForm";

export const revalidate = 300;

export async function generateStaticParams() {
  const slugs = await getCategorySlugs();
  return locales.flatMap((locale) => slugs.map((slug) => ({ locale, slug })));
}

type P = { params: Promise<{ locale: string; slug: string }> };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const c = await getCategory(locale, slug);
  if (!c) return {};
  return pageMetadata({
    locale,
    path: `/products/${slug}`,
    title: `${c.name} — Oryvchem`,
    description: `${c.intro.slice(0, 155).replace(/\s+\S*$/, "")}…`,
    keywords: [...c.examples, c.name],
  });
}

export default async function ProductPage({ params }: P) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const [d, cats, site] = await Promise.all([getDict(locale), getCategories(locale), getSite()]);
  const c = cats.find((x) => x.slug === slug);
  if (!c) notFound();

  return (
    <>
      {productPageSchema(locale, c, d).map((s, i) => (
        <JsonLd key={i} data={s} />
      ))}
      <section className="page-hero">
        <div className="wrap">
          <nav className="crumbs" aria-label="Breadcrumb">
            <Link href={`/${locale}`}>{d.product.home}</Link>
            <span aria-hidden="true">/</span>
            <Link href={`/${locale}#categories`}>{d.product.products}</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">{c.name}</span>
          </nav>
          {c.code && <span className="cat-tab">{c.code}</span>}
          <h1 className="headline">{c.name}</h1>
          <p className="lede">{c.intro}</p>
          <div className="hero-ctas">
            <a className="btn-primary" href="#quote">{d.product.quoteFor}</a>
            <a className="btn-ghost" href={site.whatsapp} target="_blank" rel="noopener noreferrer">{d.hero.ctaCall}</a>
          </div>
        </div>
      </section>

      <section>
        <div className="wrap two-col">
          <div>
            <h2 className="section-title sm">{d.product.examples}</h2>
            <ul className="chips">
              {c.examples.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="section-title sm">{d.product.uses}</h2>
            <ul className="uses">
              {c.uses.map((u) => (
                <li key={u}>{u}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="alt">
        <div className="wrap faq-wrap">
          <h2 className="section-title">{d.product.faq}</h2>
          <div className="faq">
            {c.faq.map((f) => (
              <details key={f.q} open>
                <summary>{f.q}</summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section id="quote">
        <div className="wrap contact-grid">
          <div>
            <h2 className="section-title">{d.product.ctaTitle}</h2>
            <p className="muted">{d.product.ctaText}</p>
            <InquiryForm t={d.form} locale={locale} defaultProduct={c.name} idPrefix="pq" />
          </div>
          <div>
            <h2 className="section-title sm">{d.product.related}</h2>
            <ul className="related">
              {cats.filter((x) => x.slug !== slug).map((x) => (
                <li key={x.slug}>
                  <Link href={`/${locale}/products/${x.slug}`}>
                    {x.code && <span className="cat-tab">{x.code}</span>} {x.name}
                  </Link>
                </li>
              ))}
            </ul>
            <p className="muted small">{d.product.updated}: {SITE.updated}</p>
          </div>
        </div>
      </section>
    </>
  );
}
