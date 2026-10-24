import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { db, dbConfigured } from "@/lib/db";
import { STATUSES, type Lead } from "@/lib/leads";

const fmt = (d: Date | string) => new Date(d).toISOString().slice(0, 16).replace("T", " ");

/** Count helper that tolerates a table not existing yet. */
async function safe<T>(fn: () => PromiseLike<T[]>, _fallback?: never[]): Promise<T[]> {
  try {
    return Array.from(await fn());
  } catch (e) {
    console.error("[dashboard]", e);
    return [];
  }
}

export default async function Dashboard() {
  await requireAdmin();
  if (!dbConfigured()) {
    return (
      <>
        <h1>Dashboard</h1>
        <div className="notice"><b>Database not configured.</b> Set <code>DATABASE_URL</code> (Postgres) to see leads and content statistics. Inquiries are still emailed.</div>
      </>
    );
  }
  const sql = (await db())!;
  const [byStatus, windows, due, recent, posts, pages, cats, media] = await Promise.all([
    safe(() => sql<{ status: string; n: number }[]>`select status, count(*)::int n from leads group by status`, []),
    safe(() => sql<{ d7: number; d30: number; total: number }[]>`
      select count(*) filter (where created_at > now() - interval '7 days')::int d7,
             count(*) filter (where created_at > now() - interval '30 days')::int d30,
             count(*)::int total from leads`, []),
    safe(() => sql<{ n: number }[]>`select count(*)::int n from leads where follow_up <= current_date and status in ('new','contacted','quoted')`, []),
    safe(() => sql<Lead[]>`select * from leads order by created_at desc limit 5`, []),
    safe(() => sql<{ published: number; draft: number }[]>`select count(*) filter (where published)::int published, count(*) filter (where not published)::int draft from posts`, []),
    safe(() => sql<{ published: number; draft: number }[]>`select count(*) filter (where published)::int published, count(*) filter (where not published)::int draft from pages`, []),
    safe(() => sql<{ n: number }[]>`select count(*)::int n from categories`, []),
    safe(() => sql<{ n: number }[]>`select count(*)::int n from media`, []),
  ]);
  const counts = Object.fromEntries(byStatus.map((c) => [c.status, c.n]));
  const w = windows[0] ?? { d7: 0, d30: 0, total: 0 };

  return (
    <>
      <h1>Dashboard</h1>

      <h2>Leads</h2>
      <div className="stats">
        <Link href="/admin" className="stat"><b>{w.total}</b>all leads</Link>
        <div className="stat"><b>{w.d7}</b>last 7 days</div>
        <div className="stat"><b>{w.d30}</b>last 30 days</div>
        <div className="stat"><b>{due[0]?.n ?? 0}</b>follow-ups due</div>
      </div>
      <div className="stats">
        {STATUSES.map((s) => (
          <Link key={s} href={`/admin?status=${s}`} className="stat"><b>{counts[s] ?? 0}</b>{s}</Link>
        ))}
      </div>

      <h2>Recent leads</h2>
      {recent.length ? (
        <table>
          <thead><tr><th>Received</th><th>Name / company</th><th>Product · country</th><th>Status</th></tr></thead>
          <tbody>
            {recent.map((l) => (
              <tr key={l.id}>
                <td className="small">{fmt(l.created_at)}</td>
                <td><Link href={`/admin/leads/${l.id}`}><b>{l.name}</b></Link><br /><span className="muted">{l.company}</span></td>
                <td className="small">{l.product}<br /><span className="muted">{l.country}</span></td>
                <td><span className={`pill ${l.status}`}>{l.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="muted">No leads yet.</p>
      )}

      <h2>Content</h2>
      <div className="stats">
        <Link href="/admin/posts" className="stat"><b>{posts[0]?.published ?? 0}</b>posts published · {posts[0]?.draft ?? 0} draft</Link>
        <Link href="/admin/pages" className="stat"><b>{pages[0]?.published ?? 0}</b>pages published · {pages[0]?.draft ?? 0} draft</Link>
        <Link href="/admin/categories" className="stat"><b>{cats[0]?.n ?? 0}</b>categories customised</Link>
        <Link href="/admin/media" className="stat"><b>{media[0]?.n ?? 0}</b>media files</Link>
      </div>

      <h2>Quick actions</h2>
      <p className="inline">
        <Link className="btn" href="/admin/posts/new">New post</Link>
        <Link className="btn" href="/admin/pages/new">New page</Link>
        <Link className="btn" href="/admin/categories/new">New category</Link>
        <Link className="btn ghost" href="/admin/home">Home layout</Link>
        <Link className="btn ghost" href="/admin/content">Edit site text</Link>
      </p>
    </>
  );
}
