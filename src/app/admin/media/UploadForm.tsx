"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

/** Uploads the chosen images one request at a time (keeps each request small), then refreshes the grid. */
export function UploadForm() {
  const input = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msgs, setMsgs] = useState<string[]>([]);

  async function go(e: React.FormEvent) {
    e.preventDefault();
    const files = Array.from(input.current?.files ?? []).slice(0, 10);
    if (!files.length) return;
    setBusy(true);
    const out: string[] = [];
    for (const f of files) {
      const fd = new FormData();
      fd.append("file", f);
      try {
        const r = await fetch("/admin/media/upload", { method: "POST", body: fd });
        const j = (await r.json()) as { ids?: string[]; errors?: string[]; error?: string };
        if (j.error) out.push(`${f.name}: ${j.error}`);
        out.push(...(j.errors ?? []));
      } catch {
        out.push(`${f.name}: upload failed`);
      }
    }
    setMsgs(out);
    setBusy(false);
    if (input.current) input.current.value = "";
    router.refresh();
  }

  return (
    <form onSubmit={go} className="card">
      <label htmlFor="files">Upload images (JPEG, PNG, WebP, GIF, AVIF — up to 4 MB each, 10 at a time)</label>
      <input id="files" ref={input} type="file" name="file" multiple accept="image/jpeg,image/png,image/webp,image/gif,image/avif" />
      <p><button className="btn" disabled={busy}>{busy ? "Uploading…" : "Upload"}</button></p>
      {msgs.length > 0 && <div className="notice">{msgs.map((m) => <div key={m}>{m}</div>)}</div>}
    </form>
  );
}
