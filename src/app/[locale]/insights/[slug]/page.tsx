import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { isLocale } from "@/i18n/config";
import { getDict } from "@/lib/content";
import { getPublished } from "@/lib/posts";
import { pageMetadata } from "@/lib/seo";
import { JsonLd } from "@/lib/jsonld";
import { articleSchema } from "@/lib/schema";
import { Markdown } from "@/lib/markdown";
import { SITE } from "@/lib/site";

export const revalidate = 300;
export const dynamicParams = true; // new articles appear without a rebuild

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

type P = { params: Promise<{ locale: string; slug: string }> };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { locale, slug: rawSlug } = await params;
  const slug = decode(rawSlug);
  if (!isLocale(locale)) return {};
  const post = await getPublished(locale, slug);
  if (!post) return {};
  return pageMetadata({
    locale,
    path: `/insights/${slug}`,
    title: `${post.title} — Oryvchem`,
    description: post.excerpt,
    selfOnly: true,
    type: "article",
    image: post.cover_media ? `${SITE.url}/media/${post.cover_media}` : undefined,
  });
}

export default async function Article({ params }: P) {
  const { locale, slug: rawSlug } = await params;
  const slug = decode(rawSlug);
  if (!isLocale(locale)) notFound();
  const post = await getPublished(locale, slug);
  if (!post) notFound();
  const d = await getDict(locale);
  const fmt = new Intl.DateTimeFormat(locale, { dateStyle: "long" });
  const published = new Date(post.published_at ?? post.updated_at);
  const updated = new Date(post.updated_at);

  return (
    <>
      {articleSchema(locale, post).map((s, i) => (
        <JsonLd key={i} data={s} />
      ))}
      <article>
        <section className="page-hero">
          <div className="wrap narrow">
            <nav className="crumbs" aria-label="Breadcrumb">
              <Link href={`/${locale}`}>{d.product.home}</Link>
              <span aria-hidden="true">/</span>
              <Link href={`/${locale}/insights`}>{d.nav.insights}</Link>
            </nav>
            <h1 className="headline">{post.title}</h1>
            <p className="lede">{post.excerpt}</p>
            <p className="muted small">
              {d.insights.published} <time dateTime={published.toISOString()}>{fmt.format(published)}</time>
              {updated.getTime() - published.getTime() > 86_400_000 && (
                <> · {d.insights.updated} <time dateTime={updated.toISOString()}>{fmt.format(updated)}</time></>
              )}
            </p>
          </div>
        </section>
        <section>
          <div className="wrap narrow prose">
            {post.cover_media && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={`/media/${post.cover_media}`} alt={post.title} style={{ width: "100%", height: "auto", borderRadius: 14, marginBottom: 24 }} />
            )}
            <Markdown source={post.body} />
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
