import Link from "next/link";
import { ConfirmButton } from "@/app/admin/ConfirmButton";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { STATUSES, type Lead } from "@/lib/leads";
import { addNote, deleteLead, updateLead } from "../../actions";

export default async function LeadPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const sql = await db();
  if (!sql || !/^\d+$/.test(id)) notFound();
  const [lead] = await sql<Lead[]>`select * from leads where id = ${id}`;
  if (!lead) notFound();
  const notes = await sql<{ id: number; created_at: Date | string; body: string }[]>`select id, created_at, body from lead_notes where lead_id = ${id} order by created_at desc`;
  const wa = lead.phone ? `https://wa.me/${lead.phone.replace(/\D/g, "")}` : null;

  return (
    <>
      <p><Link href="/admin">← All leads</Link></p>
      <h1>{lead.name} <span className={`pill ${lead.status}`}>{lead.status}</span></h1>
      <div className="row">
        <div className="card">
          <dl className="kv">
            <dt>Received</dt><dd>{new Date(lead.created_at).toISOString().slice(0, 16).replace("T", " ")} UTC</dd>
            <dt>Type</dt><dd>{lead.type === "callback" ? "Call-back request" : "Quote inquiry"}</dd>
            <dt>Company</dt><dd>{lead.company}</dd>
            <dt>Email</dt><dd>{lead.email && <a href={`mailto:${lead.email}`}>{lead.email}</a>}</dd>
            <dt>Phone / WhatsApp</dt><dd>{lead.phone} {wa && <a href={wa} target="_blank" rel="noopener noreferrer">WhatsApp ↗</a>}</dd>
            <dt>Country</dt><dd>{lead.country}</dd>
            <dt>Product</dt><dd>{lead.product}</dd>
            <dt>Details</dt><dd>{lead.details}</dd>
            <dt>Site language</dt><dd>{lead.locale}</dd>
            <dt>Page</dt><dd>{lead.page}</dd>
            <dt>Email sent</dt><dd>{lead.email_sent ? "yes" : "no"}</dd>
          </dl>
        </div>
        <form action={updateLead} className="card" key={`${lead.status}|${lead.assignee}|${lead.follow_up}`}>
          <input type="hidden" name="id" value={lead.id} />
          <label htmlFor="status">Status</label>
          <select id="status" name="status" defaultValue={lead.status}>{STATUSES.map((s) => <option key={s}>{s}</option>)}</select>
          <label htmlFor="assignee">Assignee</label>
          <input id="assignee" name="assignee" defaultValue={lead.assignee ?? ""} />
          <label htmlFor="follow_up">Follow-up date</label>
          <input id="follow_up" name="follow_up" type="date" defaultValue={lead.follow_up ? String(lead.follow_up).slice(0, 10) : ""} />
          <p><button className="btn">Save</button></p>
        </form>
      </div>
      <h2>Notes</h2>
      <form action={addNote} className="card">
        <input type="hidden" name="id" value={lead.id} />
        <textarea name="body" placeholder="Call summary, quote sent, next step…" required />
        <p><button className="btn">Add note</button></p>
        {notes.map((n) => (
          <div className="note" key={n.id}><span className="muted small">{new Date(n.created_at).toISOString().slice(0, 16).replace("T", " ")}</span><br />{n.body}</div>
        ))}
      </form>
      <form action={deleteLead}>
        <input type="hidden" name="id" value={lead.id} />
        <ConfirmButton message="Delete this lead and its notes permanently?" className="btn danger">Delete lead</ConfirmButton>
      </form>
    </>
  );
}
