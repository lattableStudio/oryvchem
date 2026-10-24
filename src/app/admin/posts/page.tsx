import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { db, dbConfigured } from "@/lib/db";
import type { Post } from "@/lib/posts";

export default async function Posts() {
  await requireAdmin();
  if (!dbConfigured()) return <div className="notice"><b>No database yet.</b> Set <code>DATABASE_URL</code> to publish articles.</div>;
  const sql = (await db())!;
  const rows = await sql<Post[]>`select * from posts order by updated_at desc`;
  return (
    <>
      <h1>Insights posts</h1>
      <p><Link className="btn" href="/admin/posts/new">New post</Link></p>
      <table>
        <thead><tr><th>Title</th><th>Language</th><th>Status</th><th>Updated</th></tr></thead>
        <tbody>
          {rows.map((p) => (
            <tr key={p.id}>
              <td><Link href={`/admin/posts/${p.id}`}><b>{p.title}</b></Link><br /><span className="muted small">/{p.locale}/insights/{p.slug}</span></td>
              <td>{p.locale}</td>
              <td><span className={`pill ${p.published ? "won" : ""}`}>{p.published ? "published" : "draft"}</span></td>
              <td className="small">{new Date(p.updated_at).toISOString().slice(0, 16).replace("T", " ")}</td>
            </tr>
          ))}
          {rows.length === 0 && <tr><td colSpan={4} className="muted">No posts yet.</td></tr>}
        </tbody>
      </table>
    </>
  );
}
