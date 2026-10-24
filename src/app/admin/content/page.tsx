import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { dbConfigured } from "@/lib/db";
import { flatten, applyOverrides, loadOverrides } from "@/lib/content";
import { getStaticDict } from "@/i18n/dictionaries";
import { isLocale, locales, localeMeta, type Locale } from "@/i18n/config";
import { resetContent, saveContent } from "../actions";

function group(path: string): string {
  const p = path.split(".");
  return p[0] === "categories" && p[1] === "items" ? `categories › ${p[2]}` : p[0];
}

export default async function ContentPage({ searchParams }: { searchParams: Promise<{ locale?: string; saved?: string }> }) {
  await requireAdmin();
  const sp = await searchParams;
  const locale: Locale = sp.locale && isLocale(sp.locale) ? sp.locale : "en";
  if (!dbConfigured()) return <div className="notice"><b>No database yet.</b> Set <code>DATABASE_URL</code> to edit content from here.</div>;

  const rows = await loadOverrides(locale); // uncached: the editor must always show what is really stored
  const current = new Map(flatten(applyOverrides(getStaticDict(locale), rows)));
  const defaults = new Map(flatten(getStaticDict(locale)));
  const overridden = new Set(rows.map((r) => r.path));
  const groups = new Map<string, string[]>();
  for (const path of defaults.keys()) {
    const g = group(path);
    groups.set(g, [...(groups.get(g) ?? []), path]);
  }
  const dir = localeMeta[locale].dir;

  return (
    <>
      <h1>Site content</h1>
      <div className="inline" style={{ marginBottom: 16 }}>
        {locales.map((l) => (
          <Link key={l} href={`/admin/content?locale=${l}`} className={`btn ${l === locale ? "" : "ghost"}`}>{localeMeta[l].native}</Link>
        ))}
      </div>
      {sp.saved !== undefined && <div className="ok">Saved — {sp.saved} edited field(s) live for {localeMeta[locale].label}. The public site refreshes within a few seconds.</div>}
      <p className="muted small">Edit any text below. Fields that differ from the built-in copy are highlighted; clear a field to restore its default. Page SEO titles/descriptions live under <b>meta</b>.</p>
      <form action={saveContent}>
        <input type="hidden" name="locale" value={locale} />
        {[...groups].map(([g, paths]) => (
          <details className="grp" key={g}>
            <summary>{g} <span className="muted small">({paths.length} fields{paths.some((p) => overridden.has(p)) ? " · edited" : ""})</span></summary>
            <div className="in">
              {paths.map((p) => {
                const v = current.get(p) ?? "";
                const long = v.length > 70 || v.includes("\n");
                return (
                  <div key={p}>
                    <label htmlFor={`f:${p}`}>{p}</label>
                    {long ? (
                      <textarea id={`f:${p}`} name={`f:${p}`} dir={dir} defaultValue={v} className={overridden.has(p) ? "changed" : ""} />
                    ) : (
                      <input id={`f:${p}`} name={`f:${p}`} dir={dir} defaultValue={v} className={overridden.has(p) ? "changed" : ""} />
                    )}
                  </div>
                );
              })}
            </div>
          </details>
        ))}
        <div className="sticky inline">
          <button className="btn">Save {localeMeta[locale].label} content</button>
          <button className="btn ghost" formAction={resetContent} type="submit">Reset this language to defaults</button>
        </div>
      </form>
    </>
  );
}
