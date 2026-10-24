import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { locales, type Locale } from "@/i18n/config";
import { SLUG_RE, getAllCategoriesAdmin, getCategoryRow, type CatText } from "@/lib/categories";
import { categorySlugs } from "@/lib/site";
import { CategoryForm } from "../CategoryForm";
import { ERRORS } from "../errors";

export default async function EditCategory({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ saved?: string; error?: string }> }) {
  await requireAdmin();
  const { slug } = await params;
  const sp = await searchParams;
  if (!SLUG_RE.test(slug)) notFound();
  const builtin = (categorySlugs as readonly string[]).includes(slug);
  const row = await getCategoryRow(slug);
  if (!builtin && !row) notFound();

  const texts = {} as Record<Locale, CatText>;
  let meta = { code: "", position: 0, hidden: false };
  for (const l of locales) {
    const cat = (await getAllCategoriesAdmin(l)).find((c) => c.slug === slug)!;
    meta = { code: cat.code, position: cat.position, hidden: cat.hidden };
    // Custom categories: show only what is stored per language, so empty fields keep falling back to English.
    texts[l] = builtin ? { name: cat.name, short: cat.short, examples: cat.examples, intro: cat.intro, uses: cat.uses, faq: cat.faq } : ({ name: "", short: "", examples: [], intro: "", uses: [], faq: [], ...(row!.data?.[l] ?? {}) } as CatText);
  }
  return (
    <>
      <h1>Edit category: {texts.en.name || slug}</h1>
      {sp.saved && <div className="ok">{sp.saved === "reset" ? "Reset to built-in copy." : "Saved."} <a href={`/en/products/${slug}`} target="_blank">View live ↗</a></div>}
      {sp.error && <div className="notice">{ERRORS[sp.error] ?? ERRORS.db}</div>}
      <CategoryForm slug={slug} builtin={builtin} code={meta.code} position={meta.position} hidden={meta.hidden} texts={texts} hasRow={!!row} />
    </>
  );
}
