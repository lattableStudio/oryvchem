import { isAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import type { Lead } from "@/lib/leads";

export const dynamic = "force-dynamic";

// Neutralise spreadsheet formula injection and quote every cell.
const cell = (v: unknown) => {
  let s = v == null ? "" : v instanceof Date ? v.toISOString() : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
};

export async function GET() {
  if (!(await isAdmin())) return new Response("Unauthorized", { status: 401 });
  const sql = await db();
  if (!sql) return new Response("No database", { status: 503 });
  const rows = await sql<Lead[]>`select * from leads order by created_at desc`;
  const cols = ["id", "created_at", "type", "status", "name", "company", "email", "phone", "country", "product", "details", "assignee", "follow_up", "locale", "page"] as const;
  const csv = [cols.join(","), ...rows.map((r) => cols.map((c) => cell(r[c])).join(","))].join("\r\n");
  return new Response("﻿" + csv, {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="oryvchem-leads.csv"' },
  });
}
