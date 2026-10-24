import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { db, dbConfigured } from "@/lib/db";
import { locales, localeMeta, isLocale } from "@/i18n/config";
import type { CmsPage } from "@/lib/pages";
import { togglePublish } from "./actions";

export default async function Pages({ searchParams }: { searchParams: Promise<{ locale?: string; status?: string }> }) {
  await requireAdmin();
  if (!dbConfigured()) return <div className="notice"><b>No database yet.</b> Set <code>DATABASE_URL</code> to create pages.</div>;
  const sp = await searchParams;
  const locale = sp.locale && isLocale(sp.locale) ? sp.locale : null;
  const status = sp.status === "published" || sp.status === "draft" ? sp.status : null;
  const sql = (await db())!;
  const rows = await sql<CmsPage[]>`select * from pages
    where (${locale}::text is null or locale = ${locale})
      and (${status}::text is null or published = (${status} = 'published'))
    order by locale, position, updated_at desc`;
  const q = (o: { locale?: string | null; status?: string | null }) => {
    const p = new URLSearchParams();
    const l = o.locale === undefined ? locale : o.locale;
    const s = o.status === undefined ? status : o.status;
    if (l) p.set("locale", l);
    if (s) p.set("status", s);
    const qs = p.toString();
    return `/admin/pages${qs ? `?${qs}` : ""}`;
  };
  return (
    <>
      <h1>Pages</h1>
      <p className="muted small">Custom pages (About, Terms, landing pages…) at <code>/language/slug</code>. Tick “header menu” or “footer” to link them site-wide.</p>
      <p><Link className="btn" href="/admin/pages/new">New page</Link></p>
      <div className="stats">
        <Link className={`stat ${!locale ? "on" : ""}`} href={q({ locale: null })}>All languages</Link>
        {locales.map((l) => <Link key={l} className={`stat ${locale === l ? "on" : ""}`} href={q({ locale: l })}>{localeMeta[l].native}</Link>)}
        <Link className={`stat ${!status ? "on" : ""}`} href={q({ status: null })}>Any status</Link>
        <Link className={`stat ${status === "published" ? "on" : ""}`} href={q({ status: "published" })}>Published</Link>
        <Link className={`stat ${status === "draft" ? "on" : ""}`} href={q({ status: "draft" })}>Drafts</Link>
      </div>
      <table>
        <thead><tr><th>Title</th><th>Language</th><th>Status</th><th>Menus</th><th>Updated</th><th></th></tr></thead>
        <tbody>
          {rows.map((p) => (
            <tr key={p.id}>
              <td><Link href={`/admin/pages/${p.id}`}><b>{p.title}</b></Link><br /><span className="muted small">/{p.locale}/{p.slug}</span></td>
              <td>{p.locale}</td>
              <td><span className={`pill ${p.published ? "won" : ""}`}>{p.published ? "published" : "draft"}</span></td>
              <td className="small">{[p.show_in_nav && "header", p.show_in_footer && "footer"].filter(Boolean).join(", ") || "—"}</td>
              <td className="small">{new Date(p.updated_at).toISOString().slice(0, 16).replace("T", " ")}</td>
              <td>
                <form action={togglePublish}>
                  <input type="hidden" name="id" value={p.id} />
                  <button className="btn ghost">{p.published ? "Unpublish" : "Publish"}</button>
                </form>
              </td>
            </tr>
          ))}
          {rows.length === 0 && <tr><td colSpan={6} className="muted">No pages yet.</td></tr>}
        </tbody>
      </table>
    </>
  );
}
