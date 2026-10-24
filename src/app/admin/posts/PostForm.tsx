import { locales, localeMeta } from "@/i18n/config";
import { savePost, deletePost } from "../actions";
import type { Post } from "@/lib/posts";

export function PostForm({ post }: { post?: Post }) {
  return (
    <>
      <form action={savePost} className="card">
        {post && <input type="hidden" name="id" value={post.id} />}
        <div className="row">
          <div>
            <label htmlFor="locale">Language</label>
            <select id="locale" name="locale" defaultValue={post?.locale ?? "en"}>
              {locales.map((l) => <option key={l} value={l}>{localeMeta[l].native}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="slug">URL slug (auto from title if empty)</label>
            <input id="slug" name="slug" defaultValue={post?.slug ?? ""} dir="ltr" />
          </div>
        </div>
        <label htmlFor="title">Title</label>
        <input id="title" name="title" defaultValue={post?.title ?? ""} required />
        <label htmlFor="excerpt">Summary (shown in listings and Google, ~150 chars)</label>
        <textarea id="excerpt" name="excerpt" defaultValue={post?.excerpt ?? ""} maxLength={400} style={{ minHeight: 70 }} />
        <label htmlFor="body">Body — Markdown: ## heading, - list, **bold**, [link](https://…)</label>
        <textarea id="body" name="body" defaultValue={post?.body ?? ""} style={{ minHeight: 340 }} />
        <label><input type="checkbox" name="published" defaultChecked={post?.published} style={{ width: "auto" }} /> Published</label>
        <p><button className="btn">Save</button></p>
      </form>
      {post && (
        <form action={deletePost}>
          <input type="hidden" name="id" value={post.id} />
          <button className="btn danger">Delete post</button>
        </form>
      )}
    </>
  );
}
