import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { isLocale } from "@/i18n/config";
import { getDict } from "@/lib/content";
import { categoryCodes, categorySlugs, SITE } from "@/lib/site";
import { pageMetadata } from "@/lib/seo";
import { JsonLd } from "@/lib/jsonld";
import { homeSchema } from "@/lib/schema";
import { InquiryForm } from "@/components/InquiryForm";

export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const d = await getDict(locale);
  return pageMetadata({ locale, title: d.meta.title, description: d.meta.description, keywords: d.meta.keywords });
}

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const d = await getDict(locale);
  const ticker = [...d.ticker, ...d.ticker];

  return (
    <>
      {homeSchema(locale, d).map((s, i) => (
        <JsonLd key={i} data={s} />
      ))}

      {/* HERO */}
      <section className="hero">
        <div className="hero-bg" aria-hidden="true">
          <svg viewBox="0 0 600 600" className="molecule">
            <g fill="none" stroke="currentColor" strokeWidth="1.2">
              <polygon points="300,120 410,183 410,309 300,372 190,309 190,183" />
              <polygon points="410,183 520,120 600,183 600,309 520,372 410,309" opacity=".6" />
              <polygon points="190,309 80,372 0,309 0,183 80,120 190,183" opacity=".6" />
              <polygon points="300,372 410,435 410,561 300,600 190,561 190,435" opacity=".4" />
              <line x1="300" y1="120" x2="300" y2="20" opacity=".5" />
            </g>
            <g fill="currentColor">
              <circle cx="300" cy="120" r="7" /><circle cx="410" cy="183" r="7" /><circle cx="410" cy="309" r="7" />
              <circle cx="300" cy="372" r="7" /><circle cx="190" cy="309" r="7" /><circle cx="190" cy="183" r="7" />
              <circle cx="520" cy="120" r="5" /><circle cx="80" cy="372" r="5" /><circle cx="300" cy="20" r="5" />
            </g>
          </svg>
        </div>
        <div className="wrap hero-grid">
          <div>
            <div className="eyebrow"><span className="dot" />{d.hero.eyebrow}</div>
            <h1 className="headline">{d.hero.title}</h1>
            <p className="lede">{d.hero.lede}</p>
            <div className="hero-ctas">
              <a className="btn-primary" href="#contact">{d.hero.ctaQuote}</a>
              <a className="btn-ghost" href="#categories">{d.hero.ctaProducts}</a>
              <a className="btn-ghost" href={SITE.whatsapp} target="_blank" rel="noopener noreferrer">{d.hero.ctaCall}</a>
            </div>
            <ul className="badges">
              {d.hero.badges.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
          </div>
          <div className="coa-card" role="img" aria-label={`${d.hero.coa.title} — ${d.hero.coa.sample}`}>
            <div className="coa-head">{d.hero.coa.title} <span className="tag">{d.hero.coa.verified}</span></div>
            <div className="coa-body">
              {d.hero.coa.rows.map(([k, v]) => (
                <div className="coa-row" key={k}><span className="k">{k}</span><span className="v">{v}</span></div>
              ))}
              <div className="coa-stamp"><span className="check">✓</span> {d.hero.coa.stamp}</div>
              <div className="coa-sample">{d.hero.coa.sample}</div>
            </div>
          </div>
        </div>
      </section>

      <div className="ticker" aria-hidden="true">
        <div className="ticker-track" dir="ltr">
          {ticker.map((t, i) => (
            <span key={i}><em>{t.split(/(\d[\d-]*\d)/).map((part, j) => (j % 2 ? <bdi key={j} dir="ltr">{part}</bdi> : part))}</em><i /></span>
          ))}
        </div>
      </div>

      {/* ANSWER-FIRST BLOCK (GEO) */}
      <section className="answer" id="about">
        <div className="wrap answer-grid">
          <div>
            <div className="section-label">{d.answer.label}</div>
            <h2 className="section-title">{d.answer.title}</h2>
            <p className="answer-body">{d.answer.body}</p>
          </div>
          <dl className="facts">
            {d.answer.facts.map(([k, v]) => (
              <div key={k}><dt>{k}</dt><dd>{v}</dd></div>
            ))}
          </dl>
        </div>
      </section>

      {/* CATEGORIES */}
      <section id="categories">
        <div className="wrap">
          <div className="section-head">
            <div className="section-label">{d.categories.label}</div>
            <h2 className="section-title">{d.categories.title}</h2>
            <p>{d.categories.intro}</p>
          </div>
          <div className="cat-grid">
            {categorySlugs.map((s) => {
              const c = d.categories.items[s];
              return (
                <Link key={s} href={`/${locale}/products/${s}`} className="cat-card">
                  <span className="cat-tab">{categoryCodes[s]}</span>
                  <h3>{c.name}</h3>
                  <p>{c.short}</p>
                  <div className="cat-examples">{c.examples.join(" · ")}</div>
                  <span className="more">{d.categories.more} <b aria-hidden="true">→</b></span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* CAPABILITY */}
      <section id="capability" className="alt">
        <div className="wrap">
          <div className="section-head">
            <div className="section-label">{d.capability.label}</div>
            <h2 className="section-title">{d.capability.title}</h2>
            <p>{d.capability.intro}</p>
          </div>
          <div className="cat-grid">
            {d.capability.items.map((it, i) => (
              <div className="cat-card" key={it.t}>
                <span className="cat-tab">{String(i + 1).padStart(2, "0")}</span>
                <h3>{it.t}</h3>
                <p>{it.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PROCESS */}
      <section id="process" className="process">
        <div className="wrap">
          <div className="section-head">
            <div className="section-label">{d.process.label}</div>
            <h2 className="section-title">{d.process.title}</h2>
          </div>
          <ol className="steps">
            {d.process.steps.map((s, i) => (
              <li className="step" key={s.t}>
                <div className="num">{String(i + 1).padStart(2, "0")}</div>
                <h3>{s.t}</h3>
                <p>{s.d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* MARKETS (GEO) */}
      <section id="markets">
        <div className="wrap">
          <div className="section-head">
            <div className="section-label">{d.markets.label}</div>
            <h2 className="section-title">{d.markets.title}</h2>
            <p>{d.markets.intro}</p>
          </div>
          <div className="markets">
            {d.markets.regions.map((r) => (
              <div className="market" key={r.name}>
                <h3>{r.name}</h3>
                <p>{r.countries}</p>
              </div>
            ))}
          </div>
          <p className="muted small">{d.markets.note}</p>
        </div>
      </section>

      {/* CALLBACK CTA */}
      <section className="cta-band">
        <div className="wrap cta-grid">
          <div>
            <h2 className="section-title">{d.cta.title}</h2>
            <p>{d.cta.text}</p>
          </div>
          <InquiryForm t={d.form} locale={locale} variant="callback" idPrefix="cb" />
        </div>
      </section>

      {/* COMPLIANCE */}
      <section id="compliance">
        <div className="wrap compliance-grid">
          <div>
            <div className="section-label">{d.compliance.label}</div>
            <h2 className="section-title">{d.compliance.title}</h2>
            <p className="muted">{d.compliance.intro}</p>
            <div className="compliance-note">
              <div className="label">{d.compliance.noteLabel}</div>
              {d.compliance.note}
            </div>
          </div>
          <ul className="compliance-list">
            {d.compliance.items.map((it) => (
              <li key={it.t}>
                <span className="icon" />
                <div><strong>{it.t}</strong><span>{it.d}</span></div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="alt">
        <div className="wrap faq-wrap">
          <div className="section-head">
            <div className="section-label">{d.faq.label}</div>
            <h2 className="section-title">{d.faq.title}</h2>
          </div>
          <div className="faq">
            {d.faq.items.map((f) => (
              <details key={f.q}>
                <summary>{f.q}</summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact">
        <div className="wrap contact-grid">
          <div>
            <div className="section-label">{d.nav.contact.toUpperCase()}</div>
            <h2 className="section-title">{d.form.title}</h2>
            <p className="muted">{d.form.intro}</p>
            <InquiryForm t={d.form} locale={locale} idPrefix="q" />
          </div>
          <div className="contact-info">
            <dl>
              <dt>{d.contactInfo.office}</dt>
              <dd>{d.contactInfo.officeV}</dd>
              <dt>{d.contactInfo.phone}</dt>
              <dd><a href={SITE.phoneHref} dir="ltr">{SITE.phone}</a></dd>
              <dt>{d.contactInfo.email}</dt>
              <dd><a href={`mailto:${SITE.email}`}>{SITE.email}</a></dd>
              <dt>{d.contactInfo.response}</dt>
              <dd>{d.contactInfo.responseV}</dd>
              <dt>{d.contactInfo.scope}</dt>
              <dd>{d.contactInfo.scopeV}</dd>
              <dt>{d.contactInfo.what}</dt>
              <dd>{d.contactInfo.whatV}</dd>
            </dl>
            <a className="btn-wa" href={SITE.whatsapp} target="_blank" rel="noopener noreferrer">{d.contactInfo.whatsapp}</a>
          </div>
        </div>
      </section>
    </>
  );
}
