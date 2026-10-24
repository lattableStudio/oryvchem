import { requireAdmin } from "@/lib/auth";
import { PageForm } from "../PageForm";

export default async function NewPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  await requireAdmin();
  const { error } = await searchParams;
  return (
    <>
      <h1>New page</h1>
      {error === "reserved" && <div className="notice">That slug is reserved for the site itself. Choose another.</div>}
      {error && error !== "reserved" && <div className="notice">Could not save — check the title, and that the slug is unique for this language.</div>}
      <PageForm />
    </>
  );
}
