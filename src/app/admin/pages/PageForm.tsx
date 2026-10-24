import { locales, localeMeta } from "@/i18n/config";
import { ConfirmButton } from "@/app/admin/ConfirmButton";
import { savePage, deletePage } from "./actions";
import type { CmsPage } from "@/lib/pages";

export function PageForm({ page }: { page?: CmsPage }) {
  return (
    <>
      <form action={savePage} className="card">
        {page && <input type="hidden" name="id" value={page.id} />}
        <div className="row">
          <div>
            <label htmlFor="locale">Language</label>
            <select id="locale" name="locale" defaultValue={page?.locale ?? "en"}>
              {locales.map((l) => <option key={l} value={l}>{localeMeta[l].native}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="slug">URL slug (auto from title if empty) — page lives at /language/slug</label>
            <input id="slug" name="slug" defaultValue={page?.slug ?? ""} dir="ltr" />
          </div>
        </div>
        <label htmlFor="title">Title (page heading)</label>
        <input id="title" name="title" defaultValue={page?.title ?? ""} required />
        <label htmlFor="body">Body — Markdown: ## heading, - list, **bold**, [link](https://…)</label>
        <textarea id="body" name="body" defaultValue={page?.body ?? ""} style={{ minHeight: 340 }} />
        <details className="grp">
          <summary>SEO &amp; cover image</summary>
          <div className="in">
            <label htmlFor="seo_title">SEO title (blank = page title + site name)</label>
            <input id="seo_title" name="seo_title" defaultValue={page?.seo_title ?? ""} maxLength={200} />
            <label htmlFor="seo_description">SEO description (~150 chars; blank = start of the body)</label>
            <textarea id="seo_description" name="seo_description" defaultValue={page?.seo_description ?? ""} maxLength={400} style={{ minHeight: 70 }} />
            <label htmlFor="cover_media">Cover image — media ID from the Media library (optional)</label>
            <input id="cover_media" name="cover_media" type="number" min="1" defaultValue={page?.cover_media ? String(page.cover_media) : ""} dir="ltr" />
          </div>
        </details>
        <div className="row">
          <div>
            <label><input type="checkbox" name="published" defaultChecked={page?.published} style={{ width: "auto" }} /> Published</label>
            <label><input type="checkbox" name="show_in_nav" defaultChecked={page?.show_in_nav} style={{ width: "auto" }} /> Show in header menu</label>
            <label><input type="checkbox" name="show_in_footer" defaultChecked={page?.show_in_footer} style={{ width: "auto" }} /> Show in footer</label>
          </div>
          <div>
            <label htmlFor="position">Menu order (lower first)</label>
            <input id="position" name="position" type="number" defaultValue={page?.position ?? 0} dir="ltr" />
          </div>
        </div>
        <p><button className="btn">Save</button></p>
      </form>
      {page && (
        <form action={deletePage}>
          <input type="hidden" name="id" value={page.id} />
          <ConfirmButton message="Delete this page permanently?" className="btn danger">Delete page</ConfirmButton>
        </form>
      )}
    </>
  );
}
