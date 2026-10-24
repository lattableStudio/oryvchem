import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { dbConfigured } from "@/lib/db";
import { getAllCategoriesAdmin } from "@/lib/categories";
import { moveCategory, toggleHidden } from "./actions";

export default async function Categories({ searchParams }: { searchParams: Promise<{ deleted?: string }> }) {
  await requireAdmin();
  const sp = await searchParams;
  const rows = await getAllCategoriesAdmin("en");
  return (
    <>
      <h1>Categories &amp; products</h1>
      {!dbConfigured() && <div className="notice"><b>No database yet.</b> Set <code>DATABASE_URL</code> to add or edit categories.</div>}
      {sp.deleted && <div className="ok">Category deleted.</div>}
      <p><Link className="btn" href="/admin/categories/new">New category</Link></p>
      <table>
        <thead><tr><th>Category</th><th>Code</th><th>Products</th><th>Pos.</th><th>Order</th><th>Visibility</th></tr></thead>
        <tbody>
          {rows.map((c, i) => (
            <tr key={c.slug} style={c.hidden ? { opacity: 0.6 } : undefined}>
              <td>
                <Link href={`/admin/categories/${c.slug}`}><b>{c.name}</b></Link>{" "}
                {c.hidden && <span className="pill">hidden</span>} {c.builtin && <span className="pill">built-in</span>}
                <br /><span className="muted small">/products/{c.slug}</span>
              </td>
              <td dir="ltr">{c.code}</td>
              <td className="small">{c.examples.length}</td>
              <td dir="ltr">{c.position}</td>
              <td>
                <form action={moveCategory} className="inline">
                  <input type="hidden" name="slug" value={c.slug} />
                  <button className="btn ghost" name="dir" value="up" disabled={i === 0} aria-label="Move up">↑</button>
                  <button className="btn ghost" name="dir" value="down" disabled={i === rows.length - 1} aria-label="Move down">↓</button>
                </form>
              </td>
              <td>
                <form action={toggleHidden}>
                  <input type="hidden" name="slug" value={c.slug} />
                  <button className="btn ghost" name="hide" value={c.hidden ? "0" : "1"}>{c.hidden ? "Show" : "Hide"}</button>
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
