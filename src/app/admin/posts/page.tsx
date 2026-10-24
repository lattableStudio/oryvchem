import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { db, dbConfigured } from "@/lib/db";
import { Pager, PAGE_SIZE, pageNum } from "../Pager";
import type { Post } from "@/lib/posts";

export default async function Posts({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  await requireAdmin();
  if (!dbConfigured()) return <div className="notice"><b>No database yet.</b> Set <code>DATABASE_URL</code> to publish articles.</div>;
  const page = pageNum((await searchParams).page);
  const sql = (await db())!;
  const rows = await sql<Post[]>`select * from posts order by updated_at desc limit ${PAGE_SIZE} offset ${(page - 1) * PAGE_SIZE}`;
  const [{ n }] = await sql<{ n: number }[]>`select count(*)::int n from posts`;
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
      <Pager page={page} total={n} href={(p) => `/admin/posts${p > 1 ? `?page=${p}` : ""}`} />
    </>
  );
}
