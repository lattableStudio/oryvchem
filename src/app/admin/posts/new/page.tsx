import { requireAdmin } from "@/lib/auth";
import { PostForm } from "../PostForm";

export default async function NewPost({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  await requireAdmin();
  const { error } = await searchParams;
  return (
    <>
      <h1>New post</h1>
      {error && <div className="notice">Could not save — check the title, and that the slug is unique for this language.</div>}
      <PostForm />
    </>
  );
}
