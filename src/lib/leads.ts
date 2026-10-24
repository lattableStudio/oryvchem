import { db } from "./db";

export const STATUSES = ["new", "contacted", "quoted", "won", "lost", "spam"] as const;
export type Status = (typeof STATUSES)[number];
export const isStatus = (v: string): v is Status => (STATUSES as readonly string[]).includes(v);

export type Lead = {
  id: number;
  created_at: Date | string;
  type: string;
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  country: string | null;
  product: string | null;
  details: string | null;
  locale: string | null;
  page: string | null;
  status: Status;
  assignee: string | null;
  follow_up: Date | string | null;
  email_sent: boolean;
};

export type NewLead = Pick<Lead, "type" | "name"> &
  Partial<Pick<Lead, "company" | "email" | "phone" | "country" | "product" | "details" | "locale" | "page">>;

/** Stores a lead. Returns its id, or null when no database is configured / it is unreachable. */
export async function saveLead(l: NewLead): Promise<number | null> {
  try {
    const sql = await db();
    if (!sql) return null;
    const [row] = await sql<{ id: number }[]>`
      insert into leads (type, name, company, email, phone, country, product, details, locale, page)
      values (${l.type}, ${l.name}, ${l.company ?? null}, ${l.email ?? null}, ${l.phone ?? null}, ${l.country ?? null},
              ${l.product ?? null}, ${l.details ?? null}, ${l.locale ?? null}, ${l.page ?? null})
      returning id`;
    return Number(row.id);
  } catch (e) {
    console.error("[leads] save failed", e);
    return null;
  }
}

export async function markEmailSent(id: number) {
  try {
    const sql = await db();
    if (sql) await sql`update leads set email_sent = true where id = ${id}`;
  } catch (e) {
    console.error("[leads] markEmailSent failed", e);
  }
}
