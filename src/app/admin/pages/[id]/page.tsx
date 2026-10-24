import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import type { CmsPage } from "@/lib/pages";
import { PageForm } from "../PageForm";

export default async function EditPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string; error?: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const sp = await searchParams;
  const sql = await db();
  if (!sql || !/^\d+$/.test(id)) notFound();
  const [page] = await sql<CmsPage[]>`select * from pages where id = ${id}`;
  if (!page) notFound();
  return (
    <>
      <h1>Edit page</h1>
      {sp.saved && <div className="ok">Saved. {page.published ? <a href={`/${page.locale}/${encodeURIComponent(page.slug)}`} target="_blank">View live ↗</a> : "Draft — not visible on the site."}</div>}
      {sp.error === "reserved" && <div className="notice">That slug is reserved for the site itself. Choose another.</div>}
      {sp.error && sp.error !== "reserved" && <div className="notice">Could not save — check the slug is unique for this language.</div>}
      <PageForm page={page} />
    </>
  );
}
