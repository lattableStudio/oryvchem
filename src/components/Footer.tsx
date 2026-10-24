import Link from "next/link";
import type { Locale } from "@/i18n/config";
import type { Dict } from "@/i18n/dictionaries";
import { categorySlugs, SITE } from "@/lib/site";

export function Footer({ locale, d }: { locale: Locale; d: Dict }) {
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
            {categorySlugs.map((s) => (
              <li key={s}><Link href={`/${locale}/products/${s}`}>{d.categories.items[s].name}</Link></li>
            ))}
            <li><Link href={`/${locale}/insights`}>{d.nav.insights}</Link></li>
          </ul>
        </nav>
        <div>
          <h3 className="foot-h">{d.nav.contact}</h3>
          <ul>
            <li><a href={SITE.phoneHref} dir="ltr">{SITE.phone}</a></li>
            <li><a href={`mailto:${SITE.email}`}>{SITE.email}</a></li>
            <li>{d.contactInfo.officeV}</li>
          </ul>
        </div>
      </div>
      <div className="wrap footer-bottom">
        <p className="muted">{d.footer.rights}</p>
      </div>
    </footer>
  );
}
