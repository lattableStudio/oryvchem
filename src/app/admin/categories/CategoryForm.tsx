import { locales, localeMeta, type Locale } from "@/i18n/config";
import type { CatText } from "@/lib/categories";
import { saveCategory, deleteCategory } from "./actions";
import { FaqRows } from "./FaqRows";
import { ConfirmButton } from "@/app/admin/ConfirmButton";

type Props = {
  slug?: string;
  builtin?: boolean;
  code: string;
  position: number;
  hidden: boolean;
  texts: Record<Locale, CatText>;
  hasRow?: boolean;
};

const blank: CatText = { name: "", short: "", examples: [], intro: "", uses: [], faq: [] };

export function CategoryForm({ slug, builtin, code, position, hidden, texts, hasRow }: Props) {
  return (
    <>
      <form action={saveCategory} className="card">
        {slug && <input type="hidden" name="existing" value={slug} />}
        <div className="row">
          <div>
            <label htmlFor="slug">URL slug {slug ? "(fixed)" : "(lowercase letters, numbers, dashes)"}</label>
            <input id="slug" name="slug" defaultValue={slug ?? ""} readOnly={!!slug} required={!slug} dir="ltr" pattern="[a-z0-9]+(-[a-z0-9]+)*" />
          </div>
          <div>
            <label htmlFor="code">Tab code (2–4 letters)</label>
            <input id="code" name="code" defaultValue={code} dir="ltr" maxLength={4} pattern="[A-Za-z]{2,4}" />
          </div>
          <div>
            <label htmlFor="position">Position (lower = earlier)</label>
            <input id="position" name="position" type="number" defaultValue={position} dir="ltr" />
          </div>
        </div>
        <label><input type="checkbox" name="hidden" defaultChecked={hidden} style={{ width: "auto" }} /> Hidden (not shown on the site or in the sitemap)</label>
        {builtin && <p className="muted small">Built-in category: fields you leave empty fall back to the built-in copy.</p>}

        {locales.map((l) => {
          const t = texts[l] ?? blank;
          const rtl = l === "ar";
          const dir = rtl ? "rtl" : undefined;
          return (
            <details className="grp" key={l} open={l === "en"}>
              <summary>{localeMeta[l].native} ({l.toUpperCase()}){l !== "en" && !builtin && " — optional, falls back to English"}</summary>
              <div className="in">
                <label htmlFor={`${l}-name`}>Name</label>
                <input id={`${l}-name`} name={`${l}:name`} defaultValue={t.name} dir={dir} required={l === "en" && !builtin} />
                <label htmlFor={`${l}-short`}>Short description (card and search snippet)</label>
                <textarea id={`${l}-short`} name={`${l}:short`} defaultValue={t.short} style={{ minHeight: 70 }} dir={dir} />
                <label htmlFor={`${l}-examples`}>Products — one per line</label>
                <textarea id={`${l}-examples`} name={`${l}:examples`} defaultValue={t.examples.join("\n")} dir={dir} />
                <label htmlFor={`${l}-intro`}>Introduction (category page)</label>
                <textarea id={`${l}-intro`} name={`${l}:intro`} defaultValue={t.intro} style={{ minHeight: 130 }} dir={dir} />
                <label htmlFor={`${l}-uses`}>Typical uses — one per line</label>
                <textarea id={`${l}-uses`} name={`${l}:uses`} defaultValue={t.uses.join("\n")} dir={dir} />
                <label>FAQ</label>
                <FaqRows name={l} initial={t.faq} rtl={rtl} />
              </div>
            </details>
          );
        })}
        <p className="sticky"><button className="btn">Save</button></p>
      </form>
      {slug && (!builtin || hasRow) && (
        <form action={deleteCategory}>
          <input type="hidden" name="slug" value={slug} />
          <ConfirmButton className="btn danger" message={builtin ? "Reset to built-in copy?" : "Delete this category?"}>
            {builtin ? "Reset to built-in" : "Delete category"}
          </ConfirmButton>
        </form>
      )}
    </>
  );
}
