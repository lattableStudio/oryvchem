"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { CONTENT_TAG } from "@/lib/content";

export async function updateAlt(fd: FormData) {
  await requireAdmin();
  const id = Number(fd.get("id"));
  const alt = String(fd.get("alt") ?? "").trim().slice(0, 300);
  const sql = await db();
  if (!sql || !id) return;
  await sql`update media set alt = ${alt} where id = ${id}`;
  revalidatePath("/admin/media");
}

export async function deleteMedia(fd: FormData) {
  await requireAdmin();
  const id = Number(fd.get("id"));
  const sql = await db();
  if (!sql || !id) return;
  await sql`update posts set cover_media = null where cover_media = ${id}`;
  await sql`update pages set cover_media = null where cover_media = ${id}`.catch(() => undefined);
  await sql`delete from media where id = ${id}`;
  revalidateTag(CONTENT_TAG, "max");
  revalidatePath("/admin/media");
}
