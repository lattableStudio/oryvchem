"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { revalidatePath, revalidateTag } from "next/cache";
import { adminEnabled, checkPassword, endSession, requireAdmin, startSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { clientIp, hits, record } from "@/lib/ratelimit";
import { CONTENT_TAG, flatten } from "@/lib/content";
import { getStaticDict } from "@/i18n/dictionaries";
import { isLocale } from "@/i18n/config";
import { isStatus } from "@/lib/leads";

const str = (v: FormDataEntryValue | null, max = 20000) => (typeof v === "string" ? v.slice(0, max) : "");

function flush() {
  revalidateTag(CONTENT_TAG, "max");
  revalidatePath("/", "layout");
  for (const f of ["/sitemap.xml", "/llms.txt", "/llms-full.txt"]) revalidatePath(f);
}

// ---------- auth ----------
const LOGIN_MAX = 6;
const LOGIN_WINDOW = 15 * 60;

export async function login(_: unknown, fd: FormData): Promise<{ error?: string }> {
  if (!adminEnabled()) return { error: "ADMIN_PASSWORD is not set on the server." };
  const key = `login:${clientIp(await headers())}`;
  // Only failed attempts count, so a correct login is never blocked by earlier success.
  if ((await hits(key, LOGIN_WINDOW)) >= LOGIN_MAX) return { error: "Too many failed attempts. Try again in 15 minutes." };
  if (!checkPassword(str(fd.get("password"), 200))) {
    await record(key);
    return { error: "Wrong password." };
  }
  await startSession();
  redirect("/admin/dashboard");
}

export async function logout() {
  await endSession();
  redirect("/admin/login");
}

// ---------- CRM ----------
export async function updateLead(fd: FormData) {
  await requireAdmin();
  const id = Number(fd.get("id"));
  const status = str(fd.get("status"), 20);
  const assignee = str(fd.get("assignee"), 120).trim() || null;
  const fu = str(fd.get("follow_up"), 10);
  const followUp = /^\d{4}-\d{2}-\d{2}$/.test(fu) ? fu : null;
  const sql = await db();
  if (!sql || !id || !isStatus(status)) return;
  await sql`update leads set status = ${status}, assignee = ${assignee}, follow_up = ${followUp} where id = ${id}`;
  revalidatePath("/admin", "layout");
}

export async function addNote(fd: FormData) {
  await requireAdmin();
  const id = Number(fd.get("id"));
  const body = str(fd.get("body"), 5000).trim();
  const sql = await db();
  if (!sql || !id || !body) return;
  await sql`insert into lead_notes (lead_id, body) values (${id}, ${body})`;
  revalidatePath(`/admin/leads/${id}`);
}

export async function deleteLead(fd: FormData) {
  await requireAdmin();
  const id = Number(fd.get("id"));
  const sql = await db();
  if (sql && id) await sql`delete from leads where id = ${id}`;
  redirect("/admin");
}

// ---------- content ----------
export async function saveContent(fd: FormData) {
  await requireAdmin();
  const locale = str(fd.get("locale"), 5);
  if (!isLocale(locale)) return;
  const sql = await db();
  if (!sql) return;
  const defaults = new Map(flatten(getStaticDict(locale)));
  const rows: { locale: string; path: string; value: string }[] = [];
  for (const [path, def] of defaults) {
    const raw = fd.get(`f:${path}`);
    if (typeof raw !== "string") continue;
    const v = raw.replace(/\r\n/g, "\n").slice(0, 5000);
    if (v.trim() !== "" && v !== def) rows.push({ locale, path, value: v });
  }
  await sql.begin(async (tx) => {
    await tx`delete from content_overrides where locale = ${locale}`;
    if (rows.length) await tx`insert into content_overrides ${tx(rows, "locale", "path", "value")}`;
  });
  flush();
  redirect(`/admin/content?locale=${locale}&saved=${rows.length}`);
}

export async function resetContent(fd: FormData) {
  await requireAdmin();
  const locale = str(fd.get("locale"), 5);
  if (!isLocale(locale)) return;
  const sql = await db();
  if (sql) await sql`delete from content_overrides where locale = ${locale}`;
  flush();
  redirect(`/admin/content?locale=${locale}&saved=0`);
}

// ---------- posts ----------
const slugify = (s: string) =>
  s.normalize("NFKD").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-+|-+$/g, "").slice(0, 80);

export async function savePost(fd: FormData) {
  await requireAdmin();
  const id = Number(fd.get("id")) || null;
  const locale = str(fd.get("locale"), 5);
  const title = str(fd.get("title"), 200).trim();
  const slug = slugify(str(fd.get("slug"), 120) || title);
  const excerpt = str(fd.get("excerpt"), 400).trim();
  const body = str(fd.get("body"), 100_000);
  const published = fd.get("published") === "on";
  const cover = Number(fd.get("cover_media")) || null;
  const sql = await db();
  if (!sql || !isLocale(locale) || !title || !slug) redirect(`/admin/posts${id ? `/${id}` : "/new"}?error=1`);
  try {
    if (id) {
      await sql`update posts set locale = ${locale}, slug = ${slug}, title = ${title}, excerpt = ${excerpt}, body = ${body}, cover_media = ${cover},
        published = ${published}, updated_at = now(),
        published_at = case when ${published} then coalesce(published_at, now()) else published_at end where id = ${id}`;
    } else {
      const [row] = await sql<{ id: number }[]>`insert into posts (locale, slug, title, excerpt, body, cover_media, published, published_at)
        values (${locale}, ${slug}, ${title}, ${excerpt}, ${body}, ${cover}, ${published}, ${published ? new Date() : null}) returning id`;
      flush();
      redirect(`/admin/posts/${row.id}?saved=1`);
    }
  } catch (e) {
    if ((e as { digest?: string }).digest?.startsWith("NEXT_REDIRECT")) throw e;
    console.error("[posts] save failed", e);
    redirect(`/admin/posts${id ? `/${id}` : "/new"}?error=slug`);
  }
  flush();
  redirect(`/admin/posts/${id}?saved=1`);
}

export async function deletePost(fd: FormData) {
  await requireAdmin();
  const id = Number(fd.get("id"));
  const sql = await db();
  if (sql && id) await sql`delete from posts where id = ${id}`;
  flush();
  redirect("/admin/posts");
}

