import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { SITE } from "@/lib/site";
import { saveLead, markEmailSent } from "@/lib/leads";

export const runtime = "nodejs";

const TO = process.env.CONTACT_TO_EMAIL ?? "Chorfihouda55@gmail.com";

type Payload = {
  type?: "quote" | "callback";
  locale?: string;
  name?: string;
  company?: string;
  email?: string;
  phone?: string;
  country?: string;
  product?: string;
  details?: string;
  page?: string;
  website?: string; // honeypot
};

// Small in-memory limiter (per server instance): 5 submissions / 10 min / IP.
const hits = new Map<string, number[]>();
function limited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 10 * 60_000);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > 5;
}

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
const clean = (v: unknown, max: number) => (typeof v === "string" ? v.replace(/\0/g, "").trim().slice(0, max) : "");
const oneLine = (s: string) => s.replace(/[\r\n]+/g, " ");

export async function POST(req: Request) {
  let body: Payload;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }

  // Bots fill the hidden field; pretend success.
  if (body.website) return NextResponse.json({ ok: true });

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (limited(ip)) return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });

  const type = body.type === "callback" ? "callback" : "quote";
  const d = {
    name: clean(body.name, 120),
    company: clean(body.company, 160),
    email: clean(body.email, 200),
    phone: clean(body.phone, 60),
    country: clean(body.country, 100),
    product: clean(body.product, 300),
    details: clean(body.details, 5000),
    locale: clean(body.locale, 5),
    page: clean(body.page, 300),
  };

  const errors: string[] = [];
  if (d.name.length < 2) errors.push("name");
  if (type === "quote") {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email)) errors.push("email");
    if (d.details.length < 3 && d.product.length < 2) errors.push("details");
  } else if (d.phone.replace(/\D/g, "").length < 6) {
    errors.push("phone");
  }
  if (errors.length) return NextResponse.json({ ok: false, error: "invalid", fields: errors }, { status: 422 });

  const rows: [string, string][] = [
    ["Type", type === "callback" ? "Call-back request" : "Quote inquiry"],
    ["Name", d.name],
    ["Company", d.company],
    ["Email", d.email],
    ["Phone / WhatsApp", d.phone],
    ["Destination country", d.country],
    ["Product / category", d.product],
    ["Details", d.details],
    ["Site language", d.locale],
    ["Page", d.page],
    ["Received", new Date().toISOString()],
  ];
  const filled = rows.filter(([, v]) => v);
  const text = filled.map(([k, v]) => `${k}: ${v}`).join("\n");
  const html = `<table style="font-family:Arial,sans-serif;font-size:14px;border-collapse:collapse">${filled
    .map(
      ([k, v]) =>
        `<tr><td style="padding:6px 14px 6px 0;color:#5E6C68;vertical-align:top;white-space:nowrap">${esc(k)}</td><td style="padding:6px 0;white-space:pre-wrap">${esc(v)}</td></tr>`,
    )
    .join("")}</table>`;

  const subject = oneLine(
    `[Oryvchem] ${type === "callback" ? "Call-back" : "Quote"} — ${d.product || d.company || d.name}`,
  ).slice(0, 180);

  // 1) Store in the CRM first, so a lead is never lost if email fails.
  const leadId = await saveLead({ type, ...d });
  const withLink = leadId
    ? { text: `${text}\n\nOpen in CRM: ${SITE.url}/admin/leads/${leadId}`, html: `${html}<p><a href="${SITE.url}/admin/leads/${leadId}">Open in CRM</a></p>` }
    : { text, html };

  // 2) Email notification.
  const host = process.env.SMTP_HOST;
  if (!host) {
    if (leadId) return NextResponse.json({ ok: true, stored: true });
    if (process.env.NODE_ENV === "production") {
      console.error("[inquiry] neither DATABASE_URL nor SMTP_HOST is configured; inquiry could not be delivered");
      return NextResponse.json({ ok: false, error: "not_configured" }, { status: 503 });
    }
    console.log(`[inquiry:dev] would send to ${TO}\n${subject}\n${text}`);
    return NextResponse.json({ ok: true, dev: true });
  }

  try {
    const port = Number(process.env.SMTP_PORT ?? 465);
    const transport = nodemailer.createTransport({
      host,
      port,
      secure: process.env.SMTP_SECURE ? process.env.SMTP_SECURE === "true" : port === 465,
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
    });
    await transport.sendMail({
      from: process.env.MAIL_FROM ?? process.env.SMTP_USER ?? `no-reply@${new URL(SITE.url).hostname}`,
      to: TO,
      replyTo: d.email || undefined,
      subject,
      text: withLink.text,
      html: withLink.html,
    });
    if (leadId) await markEmailSent(leadId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[inquiry] send failed", err);
    // The lead is safe in the CRM, so the visitor still gets a success message.
    if (leadId) return NextResponse.json({ ok: true, stored: true });
    return NextResponse.json({ ok: false, error: "send_failed" }, { status: 502 });
  }
}
