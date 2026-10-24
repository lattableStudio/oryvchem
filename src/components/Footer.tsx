import Link from "next/link";
import type { Locale } from "@/i18n/config";
import type { Dict } from "@/i18n/dictionaries";
import type { Category } from "@/lib/categories";
import { FooterPageLinks } from "./PageLinks";
import { socialLinks, type SiteSettings } from "@/lib/settings";

const SOCIAL_LABEL = { linkedin: "LinkedIn", facebook: "Facebook", instagram: "Instagram", x: "X", youtube: "YouTube" } as const;

export function Footer({ locale, d, cats, site }: { locale: Locale; d: Dict; cats: Category[]; site: SiteSettings }) {
  return (
    <footer>
      <div className="wrap footer-grid">
        <div>
          <div className="brand"><span className="mark" />Oryvchem</div>
          <p className="muted">{d.footer.tagline}</p>
        </div>
        <nav aria-label={d.product.products}>
          <h3 className="foot-h">{d.product.products}</h3>
          <ul>
            {cats.map((c) => (
              <li key={c.slug}><Link href={`/${locale}/products/${c.slug}`}>{c.name}</Link></li>
            ))}
            <li><Link href={`/${locale}/insights`}>{d.nav.insights}</Link></li>
            <FooterPageLinks locale={locale} />
          </ul>
        </nav>
        <div>
          <h3 className="foot-h">{d.nav.contact}</h3>
          <ul>
            <li><a href={site.phoneHref} dir="ltr">{site.phone}</a></li>
            <li><a href={`mailto:${site.email}`}>{site.email}</a></li>
            <li>{d.contactInfo.officeV}</li>
            {socialLinks(site).map((s) => (
              <li key={s.key}><a href={s.url} target="_blank" rel="noopener noreferrer me">{SOCIAL_LABEL[s.key]}</a></li>
            ))}
          </ul>
        </div>
      </div>
      <div className="wrap footer-bottom">
        <p className="muted">{d.footer.rights}</p>
      </div>
    </footer>
  );
}
