"use client";

import { useState } from "react";

/**
 * Pick an image from the media library for a form field.
 * Props: `name` — the hidden input submitted with the form (the media id, or empty for none);
 *        `value` — current media id (string | number | null); `label` — optional field label.
 * Use inside any <form>; no onChange needed. Example: <MediaPicker name="cover_media" value={post?.cover_media} label="Cover image" />
 */
export function MediaPicker({ name, value, label = "Image" }: { name: string; value?: string | number | null; label?: string }) {
  const [id, setId] = useState(value ? String(value) : "");
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<{ id: string; filename: string; alt: string }[] | null>(null);
  const [err, setErr] = useState("");

  async function show() {
    setOpen(true);
    setErr("");
    try {
      const r = await fetch("/admin/media/list", { cache: "no-store" });
      if (!r.ok) throw new Error();
      setItems(((await r.json()) as { items: { id: string; filename: string; alt: string }[] }).items);
    } catch {
      setErr("Could not load the media library.");
    }
  }

  return (
    <div className="picker">
      <label>{label}</label>
      <input type="hidden" name={name} value={id} />
      <div className="picker-cur">
        {id ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={`/media/${id}`} alt="" />
        ) : (
          <span className="muted small">None</span>
        )}
        <button type="button" className="btn ghost" onClick={show}>{id ? "Change" : "Choose"}</button>
        {id && <button type="button" className="btn ghost" onClick={() => setId("")}>Remove</button>}
        <a className="small" href="/admin/media" target="_blank" rel="noreferrer">Upload new ↗</a>
      </div>
      {open && (
        <div className="picker-pop">
          {err && <p className="notice">{err}</p>}
          {items && items.length === 0 && <p className="muted">No images yet — upload some in the media library.</p>}
          <div className="picker-grid">
            {(items ?? []).map((m) => (
              <button type="button" key={m.id} title={m.filename} className={m.id === id ? "on" : ""} onClick={() => { setId(m.id); setOpen(false); }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/media/${m.id}`} alt={m.alt} loading="lazy" />
              </button>
            ))}
          </div>
          <button type="button" className="btn ghost" onClick={() => setOpen(false)}>Close</button>
        </div>
      )}
    </div>
  );
}
