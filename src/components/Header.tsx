"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { locales, localeMeta, type Locale } from "@/i18n/config";
import type { Dict } from "@/i18n/dictionaries";
import { SITE } from "@/lib/site";

export function Header({ locale, t }: { locale: Locale; t: Dict["nav"] }) {
  const pathname = usePathname() || `/${locale}`;
  const rest = pathname.replace(/^\/(en|ar|fr)/, "");
  const home = `/${locale}`;
  const links: [string, string][] = [
    [`${home}#categories`, t.categories],
    [`${home}#capability`, t.capability],
    [`${home}#process`, t.process],
    [`${home}#markets`, t.markets],
    [`${home}#compliance`, t.compliance],
    [`${home}/insights`, t.insights],
    [`${home}#faq`, t.faq],
  ];

  return (
    <header className="nav">
      <a className="skip" href="#main">{t.skip}</a>
      <div className="wrap nav-inner">
        <Link href={home} className="brand" aria-label="Oryvchem">
          <span className="mark" />
          Oryvchem
        </Link>
        <nav className="links" aria-label="Primary">
          {links.map(([href, label]) => (
            <Link key={href} href={href}>{label}</Link>
          ))}
        </nav>
        <div className="nav-right">
          <div className="lang" role="group" aria-label={t.language}>
            {locales.map((l) => (
              <Link
                key={l}
                href={`/${l}${rest}`}
                hrefLang={localeMeta[l].hreflang}
                lang={l}
                aria-current={l === locale ? "true" : undefined}
                className={l === locale ? "on" : undefined}
              >
                {l === "en" ? "EN" : l === "ar" ? "ع" : "FR"}
              </Link>
            ))}
          </div>
          <a className="nav-phone" href={SITE.phoneHref} dir="ltr">☎ {SITE.phone}</a>
          <Link className="nav-cta" href={`${home}#contact`}>{t.quote}</Link>
          <details className="burger">
            <summary aria-label={t.menu}><span /><span /><span /></summary>
            <div className="burger-panel">
              {links.map(([href, label]) => (
                <Link key={href} href={href}>{label}</Link>
              ))}
              <Link href={`${home}#contact`}>{t.contact}</Link>
              <a href={SITE.phoneHref} dir="ltr">☎ {SITE.phone}</a>
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}
