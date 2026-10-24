import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import type { Post } from "@/lib/posts";
import { PostForm } from "../PostForm";

export default async function EditPost({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string; error?: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const sp = await searchParams;
  const sql = await db();
  if (!sql || !/^\d+$/.test(id)) notFound();
  const [post] = await sql<Post[]>`select * from posts where id = ${id}`;
  if (!post) notFound();
  return (
    <>
      <h1>Edit post</h1>
      {sp.saved && <div className="ok">Saved. {post.published ? <a href={`/${post.locale}/insights/${post.slug}`} target="_blank">View live ↗</a> : "Draft — not visible on the site."}</div>}
      {sp.error && <div className="notice">Could not save — check the slug is unique for this language.</div>}
      <PostForm post={post} />
    </>
  );
}
