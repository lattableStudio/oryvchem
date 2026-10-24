import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { db, dbConfigured } from "@/lib/db";
import { Pager, PAGE_SIZE, pageNum } from "./Pager";
import { STATUSES, isStatus, type Lead } from "@/lib/leads";

const fmt = (d: Date | string) => new Date(d).toISOString().slice(0, 16).replace("T", " ");

export default async function Leads({ searchParams }: { searchParams: Promise<{ status?: string; q?: string; page?: string }> }) {
  await requireAdmin();
  const { status = "", q = "", page: pg } = await searchParams;
  const page = pageNum(pg);
  if (!dbConfigured()) {
    return <div className="notice"><b>No database yet.</b> Set <code>DATABASE_URL</code> (Postgres) to store leads and edit content. Inquiries are still emailed.</div>;
  }
  const sql = (await db())!;
  const term = `%${q.trim().replace(/[\\%_]/g, "\\$&")}%`;
  const rows = await sql<Lead[]>`
    select * from leads
    where (${status === "" || !isStatus(status)} or status = ${status})
      and (${q.trim() === ""} or name ilike ${term} or company ilike ${term} or email ilike ${term} or phone ilike ${term} or product ilike ${term} or country ilike ${term})
    order by created_at desc limit ${PAGE_SIZE} offset ${(page - 1) * PAGE_SIZE}`;
  const counts = await sql<{ status: string; n: number }[]>`select status, count(*)::int n from leads group by status`;
  const byStatus = Object.fromEntries(counts.map((c) => [c.status, c.n]));
  const total = counts.reduce((a, c) => a + c.n, 0);
  const [{ n: matched }] = await sql<{ n: number }[]>`
    select count(*)::int n from leads
    where (${status === "" || !isStatus(status)} or status = ${status})
      and (${q.trim() === ""} or name ilike ${term} or company ilike ${term} or email ilike ${term} or phone ilike ${term} or product ilike ${term} or country ilike ${term})`;
  const href = (p: number) => {
    const u = new URLSearchParams();
    if (status) u.set("status", status);
    if (q.trim()) u.set("q", q.trim());
    if (p > 1) u.set("page", String(p));
    const qs = u.toString();
    return `/admin${qs ? `?${qs}` : ""}`;
  };
  const due = await sql<{ n: number }[]>`select count(*)::int n from leads where follow_up <= current_date and status in ('new','contacted','quoted')`;

  return (
    <>
      <h1>Leads</h1>
      <div className="stats">
        <Link href="/admin" className={`stat${!status ? " on" : ""}`}><b>{total}</b>All</Link>
        {STATUSES.map((s) => (
          <Link key={s} href={`/admin?status=${s}`} className={`stat${status === s ? " on" : ""}`}><b>{byStatus[s] ?? 0}</b>{s}</Link>
        ))}
        <div className="stat"><b>{due[0]?.n ?? 0}</b>follow-ups due</div>
      </div>
      <form className="inline" style={{ marginBottom: 14 }}>
        <input name="q" defaultValue={q} placeholder="Search name, company, email, product…" style={{ width: 340 }} />
        {status && <input type="hidden" name="status" value={status} />}
        <button className="btn">Search</button>
        <a className="btn ghost" href="/admin/leads/export">Export CSV</a>
      </form>
      <table>
        <thead><tr><th>Received</th><th>Name / company</th><th>Contact</th><th>Product · country</th><th>Status</th><th>Assignee</th></tr></thead>
        <tbody>
          {rows.map((l) => (
            <tr key={l.id}>
              <td className="small">{fmt(l.created_at)}<br /><span className="muted">{l.type === "callback" ? "call-back" : "quote"} · {l.locale}</span></td>
              <td><Link href={`/admin/leads/${l.id}`}><b>{l.name}</b></Link><br /><span className="muted">{l.company}</span></td>
              <td className="small">{l.email}<br />{l.phone}</td>
              <td className="small">{l.product}<br /><span className="muted">{l.country}</span></td>
              <td><span className={`pill ${l.status}`}>{l.status}</span></td>
              <td className="small">{l.assignee}{l.follow_up ? <><br /><span className="muted">follow-up {String(l.follow_up).slice(0, 10)}</span></> : null}</td>
            </tr>
          ))}
          {rows.length === 0 && <tr><td colSpan={6} className="muted">No leads yet.</td></tr>}
        </tbody>
      </table>
      <Pager page={page} total={matched} href={href} />
    </>
  );
}
