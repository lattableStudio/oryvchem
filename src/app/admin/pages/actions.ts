"use server";

import { redirect } from "next/navigation";
import { revalidatePath, revalidateTag } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { CONTENT_TAG } from "@/lib/content";
import { isLocale, locales } from "@/i18n/config";
import { RESERVED_SLUGS, slugify } from "@/lib/pages";

const str = (v: FormDataEntryValue | null, max = 20000) => (typeof v === "string" ? v.slice(0, max) : "");

function flush(slug?: string) {
  revalidateTag(CONTENT_TAG, "max");
  revalidatePath("/", "layout"); // header/footer links
  for (const f of ["/sitemap.xml", "/llms.txt", "/llms-full.txt"]) revalidatePath(f);
  if (slug) for (const l of locales) revalidatePath(`/${l}/${slug}`);
}

const isRedirect = (e: unknown) => (e as { digest?: string }).digest?.startsWith("NEXT_REDIRECT");

export async function savePage(fd: FormData) {
  await requireAdmin();
  const id = Number(fd.get("id")) || null;
  const back = id ? `/admin/pages/${id}` : "/admin/pages/new";
  const locale = str(fd.get("locale"), 5);
  const title = str(fd.get("title"), 200).trim();
  const slug = slugify(str(fd.get("slug"), 120) || title);
  const body = str(fd.get("body"), 100_000);
  const seoTitle = str(fd.get("seo_title"), 200).trim();
  const seoDescription = str(fd.get("seo_description"), 400).trim();
  const cover = Number(fd.get("cover_media")) || null;
  const published = fd.get("published") === "on";
  const showInNav = fd.get("show_in_nav") === "on";
  const showInFooter = fd.get("show_in_footer") === "on";
  const position = Math.max(-9999, Math.min(9999, Math.trunc(Number(fd.get("position")) || 0)));
  const sql = await db();
  if (!sql || !isLocale(locale) || !title || !slug) redirect(`${back}?error=1`);
  if (RESERVED_SLUGS.has(slug)) redirect(`${back}?error=reserved`);
  try {
    let prevSlug: string | undefined;
    if (id) {
      [{ slug: prevSlug } = { slug: undefined }] = await sql<{ slug: string }[]>`select slug from pages where id = ${id}`;
      await sql`update pages set locale = ${locale}, slug = ${slug}, title = ${title}, body = ${body}, seo_title = ${seoTitle},
        seo_description = ${seoDescription}, cover_media = ${cover}, published = ${published}, show_in_nav = ${showInNav},
        show_in_footer = ${showInFooter}, position = ${position}, updated_at = now() where id = ${id}`;
    } else {
      const [row] = await sql<{ id: number }[]>`insert into pages (locale, slug, title, body, seo_title, seo_description, cover_media,
        published, show_in_nav, show_in_footer, position) values (${locale}, ${slug}, ${title}, ${body}, ${seoTitle}, ${seoDescription},
        ${cover}, ${published}, ${showInNav}, ${showInFooter}, ${position}) returning id`;
      flush(slug);
      redirect(`/admin/pages/${row.id}?saved=1`);
    }
    flush(slug);
    if (prevSlug && prevSlug !== slug) flush(prevSlug);
  } catch (e) {
    if (isRedirect(e)) throw e;
    console.error("[pages] save failed", e);
    redirect(`${back}?error=slug`);
  }
  redirect(`/admin/pages/${id}?saved=1`);
}

export async function deletePage(fd: FormData) {
  await requireAdmin();
  const id = Number(fd.get("id"));
  const sql = await db();
  if (sql && id) {
    const [row] = await sql<{ slug: string }[]>`delete from pages where id = ${id} returning slug`;
    flush(row?.slug);
  }
  redirect("/admin/pages");
}

export async function togglePublish(fd: FormData) {
  await requireAdmin();
  const id = Number(fd.get("id"));
  const sql = await db();
  if (!sql || !id) return;
  const [row] = await sql<{ slug: string }[]>`update pages set published = not published, updated_at = now() where id = ${id} returning slug`;
  flush(row?.slug);
  redirect("/admin/pages");
}
