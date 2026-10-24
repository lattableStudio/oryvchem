import { requireAdmin } from "@/lib/auth";
import { getAllCategoriesAdmin } from "@/lib/categories";
import { CategoryForm } from "../CategoryForm";
import { ERRORS } from "../errors";

export default async function NewCategory({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  await requireAdmin();
  const { error } = await searchParams;
  const all = await getAllCategoriesAdmin("en");
  const position = Math.max(0, ...all.map((c) => c.position)) + 10;
  const empty = { name: "", short: "", examples: [], intro: "", uses: [], faq: [] };
  return (
    <>
      <h1>New category</h1>
      {error && <div className="notice">{ERRORS[error] ?? ERRORS.db}</div>}
      <CategoryForm code="" position={position} hidden={false} texts={{ en: empty, ar: empty, fr: empty }} />
    </>
  );
}
