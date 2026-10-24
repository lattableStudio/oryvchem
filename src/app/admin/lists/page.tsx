import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { db, dbConfigured } from "@/lib/db";
import { getStaticDict } from "@/i18n/dictionaries";
import { isLocale, locales, localeMeta, type Locale } from "@/i18n/config";
import { LIST_DEFS, builtinList, cleanItems, type ListItem } from "@/lib/lists";
import { ListEditor } from "./ListEditor";

export default async function ListsPage({ searchParams }: { searchParams: Promise<{ locale?: string; saved?: string }> }) {
  await requireAdmin();
  const sp = await searchParams;
  const locale: Locale = sp.locale && isLocale(sp.locale) ? sp.locale : "en";
  if (!dbConfigured()) return <div className="notice"><b>No database yet.</b> Set <code>DATABASE_URL</code> to edit these lists.</div>;

  const sql = await db(); // uncached: show exactly what is stored
  const rows = sql ? await sql<{ key: string; items: ListItem[] }[]>`select key, items from content_lists where locale = ${locale}` : [];
  const saved = new Map(rows.map((r) => [r.key, cleanItems(r.key, r.items)]));
  const base = getStaticDict(locale);
  const dir = localeMeta[locale].dir;

  return (
    <>
      <h1>Process · Sourcing · Markets · Compliance</h1>
      <div className="inline" style={{ marginBottom: 16 }}>
        {locales.map((l) => (
          <Link key={l} href={`/admin/lists?locale=${l}`} className={`btn ${l === locale ? "" : "ghost"}`}>{localeMeta[l].native}</Link>
        ))}
      </div>
      {sp.saved && <div className="ok">Saved — live for {localeMeta[locale].label}. The public site refreshes within a few seconds.</div>}
      <p className="muted small">Add, remove, reorder and edit the items of each section, per language. Section titles and intros are edited under <Link href="/admin/content">Site text</Link>. “Reset to built-in” restores the original list.</p>
      {LIST_DEFS.map((def) => (
        <ListEditor
          key={`${locale}:${def.key}:${rows.find((r) => r.key === def.key) ? "s" : "b"}`}
          def={def}
          locale={locale}
          dir={dir}
          initial={saved.get(def.key)?.length ? saved.get(def.key)! : builtinList(base, def.key)}
          customised={!!saved.get(def.key)?.length}
        />
      ))}
    </>
  );
}
