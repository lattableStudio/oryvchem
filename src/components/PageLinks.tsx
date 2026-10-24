import Link from "next/link";
import type { Locale } from "@/i18n/config";
import { listPageLinks } from "@/lib/pages";

/** <li> links to admin-created pages flagged "show in footer". */
export async function FooterPageLinks({ locale }: { locale: Locale }) {
  const pages = (await listPageLinks(locale)).filter((p) => p.show_in_footer);
  return (
    <>
      {pages.map((p) => (
        <li key={p.slug}><Link href={`/${locale}/${encodeURIComponent(p.slug)}`}>{p.title}</Link></li>
      ))}
    </>
  );
}
