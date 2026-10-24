"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { CONTENT_TAG } from "@/lib/content";
import { HOME_KEY, normalizeLayout } from "@/lib/homeLayout";

function flush() {
  revalidateTag(CONTENT_TAG, "max");
  for (const l of ["en", "ar", "fr"]) revalidatePath(`/${l}`);
}

export async function saveHomeLayout(json: string): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin();
  const sql = await db();
  if (!sql) return { ok: false, error: "Database not configured." };
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    return { ok: false, error: "Invalid data." };
  }
  const layout = normalizeLayout(raw);
  await sql`
    insert into settings (key, value) values (${HOME_KEY}, ${sql.json(layout)})
    on conflict (key) do update set value = excluded.value, updated_at = now()`;
  flush();
  return { ok: true };
}

export async function resetHomeLayout(): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin();
  const sql = await db();
  if (!sql) return { ok: false, error: "Database not configured." };
  await sql`delete from settings where key = ${HOME_KEY}`;
  flush();
  return { ok: true };
}
