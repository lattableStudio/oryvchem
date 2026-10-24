import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { isLocale } from "@/i18n/config";
import { getDict } from "@/lib/content";
import { listPublished } from "@/lib/posts";
import { pageMetadata } from "@/lib/seo";

export const revalidate = 300;

type P = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const d = await getDict(locale);
  return pageMetadata({ locale, path: "/insights", title: `${d.insights.title} — Oryvchem`, description: d.insights.intro });
}

export default async function Insights({ params }: P) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const d = await getDict(locale);
  const posts = await listPublished(locale);
  const fmt = new Intl.DateTimeFormat(locale, { dateStyle: "long" });

  return (
    <>
      <section className="page-hero">
        <div className="wrap">
          <nav className="crumbs" aria-label="Breadcrumb">
            <Link href={`/${locale}`}>{d.product.home}</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">{d.nav.insights}</span>
          </nav>
          <div className="section-label">{d.insights.label}</div>
          <h1 className="headline">{d.insights.title}</h1>
          <p className="lede">{d.insights.intro}</p>
        </div>
      </section>
      <section>
        <div className="wrap">
          {posts.length === 0 ? (
            <p className="muted">{d.insights.empty}</p>
          ) : (
            <div className="cat-grid">
              {posts.map((p) => (
                <Link key={p.id} href={`/${locale}/insights/${p.slug}`} className="cat-card">
                  {p.cover_media && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={`/media/${p.cover_media}`} alt="" loading="lazy" style={{ width: "100%", height: 160, objectFit: "cover", borderRadius: 10, marginBottom: 16 }} />
                  )}
                  <span className="cat-tab">{fmt.format(new Date(p.published_at ?? p.updated_at))}</span>
                  <h2 className="card-title">{p.title}</h2>
                  <p>{p.excerpt}</p>
                  <span className="more">{d.insights.read} <b aria-hidden="true">→</b></span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
