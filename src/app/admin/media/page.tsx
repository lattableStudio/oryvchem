import { requireAdmin } from "@/lib/auth";
import { listMedia } from "@/lib/media";
import { ConfirmButton } from "@/app/admin/ConfirmButton";
import { updateAlt, deleteMedia } from "./actions";
import { UploadForm } from "./UploadForm";

export const dynamic = "force-dynamic";

const kb = (n: number) => (n > 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);

export default async function MediaPage() {
  await requireAdmin();
  const items = await listMedia().catch(() => []);
  return (
    <>
      <h1>Media library</h1>
      <p className="muted">Use an image by pasting <code>![alt text](/media/ID)</code> in any Markdown body, or pick it as a cover image on posts.</p>
      <UploadForm />
      {items.length === 0 ? (
        <p className="muted">No images yet.</p>
      ) : (
        <div className="media-grid">
          {items.map((m) => (
            <div key={m.id} className="media-card">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/media/${m.id}`} alt={m.alt} loading="lazy" />
              <div className="media-meta">
                <b title={m.filename}>{m.filename}</b>
                <span className="muted small">{kb(m.size)} · <code>/media/{m.id}</code></span>
              </div>
              <form action={updateAlt}>
                <input type="hidden" name="id" value={m.id} />
                <input name="alt" defaultValue={m.alt} placeholder="Alt text (describe the image)" maxLength={300} />
                <button className="btn ghost">Save alt</button>
              </form>
              <form action={deleteMedia}>
                <input type="hidden" name="id" value={m.id} />
                <ConfirmButton message="Delete this image? Posts using it as a cover will lose it, and Markdown links to it will break." className="btn danger" formNoValidate>Delete</ConfirmButton>
              </form>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
