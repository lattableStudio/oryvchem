"use server";

import { redirect } from "next/navigation";
import { revalidatePath, revalidateTag } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { CONTENT_TAG } from "@/lib/content";
import { locales } from "@/i18n/config";
import { BANNER_KEY, SITE_KEY, SOCIAL_KEYS, type Banner, type StoredSite } from "@/lib/settings";

const str = (v: FormDataEntryValue | null, max = 300) => (typeof v === "string" ? v.trim().slice(0, max) : "");

function flush() {
  revalidateTag(CONTENT_TAG, "max");
  revalidatePath("/", "layout");
  for (const f of ["/llms.txt", "/llms-full.txt"]) revalidatePath(f);
}

const back = (q: string): never => redirect(`/admin/settings?${q}`);

const httpsUrl = (v: string) => {
  try {
    return new URL(v).protocol === "https:";
  } catch {
    return false;
  }
};

export async function saveSite(fd: FormData) {
  await requireAdmin();
  const phone = str(fd.get("phone"), 30);
  const wa = str(fd.get("whatsappNumber"), 30);
  const email = str(fd.get("email"), 120);
  if (phone && !/^\+?[\d\s()-]{6,25}$/.test(phone)) back("error=" + encodeURIComponent("Phone may only contain digits, +, spaces, brackets and dashes."));
  const waDigits = wa.replace(/[\s+()-]/g, "");
  if (wa && !/^\d{7,15}$/.test(waDigits)) back("error=" + encodeURIComponent("WhatsApp number must be 7–15 digits with country code, e.g. +86 159 0034 0902."));
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) back("error=" + encodeURIComponent("Email address is not valid."));

  const social: Record<string, string> = {};
  for (const k of SOCIAL_KEYS) {
    const v = str(fd.get(`social_${k}`), 300);
    if (!v) continue;
    if (!httpsUrl(v)) back("error=" + encodeURIComponent(`${k}: links must start with https://`));
    social[k] = v;
  }

  const value: StoredSite = {};
  if (phone) value.phone = phone;
  if (waDigits) value.whatsappNumber = waDigits;
  if (email) value.email = email;
  for (const k of ["street", "locality", "region", "country"] as const) {
    const v = str(fd.get(k), 120);
    if (v) value[k] = v;
  }
  if (Object.keys(social).length) value.social = social;

  const sql = await db();
  if (!sql) back("error=" + encodeURIComponent("No database configured."));
  await sql!`insert into settings (key, value, updated_at) values (${SITE_KEY}, ${sql!.json(value as never)}, now())
    on conflict (key) do update set value = excluded.value, updated_at = now()`;
  flush();
  back("saved=site");
}

export async function saveBanner(fd: FormData) {
  await requireAdmin();
  const link = str(fd.get("link"), 300);
  if (link && !httpsUrl(link) && !/^\/(?![/\\])\S*$/.test(link)) back("error=" + encodeURIComponent("Banner link must start with https:// or /."));
  const text = Object.fromEntries(locales.map((l) => [l, str(fd.get(`text_${l}`), 300)])) as Banner["text"];
  const value: Banner = { enabled: fd.get("enabled") === "on", text, link };
  const sql = await db();
  if (!sql) back("error=" + encodeURIComponent("No database configured."));
  await sql!`insert into settings (key, value, updated_at) values (${BANNER_KEY}, ${sql!.json(value as never)}, now())
    on conflict (key) do update set value = excluded.value, updated_at = now()`;
  flush();
  back("saved=banner");
}

/** Delete the stored rows so the static defaults apply again. */
export async function resetSettings(which: "site" | "banner" | "all") {
  await requireAdmin();
  if (which !== "site" && which !== "banner" && which !== "all") return;
  const keys = which === "site" ? [SITE_KEY] : which === "banner" ? [BANNER_KEY] : [SITE_KEY, BANNER_KEY];
  const sql = await db();
  if (sql) await sql`delete from settings where key in ${sql(keys)}`;
  flush();
  back("saved=reset");
}
