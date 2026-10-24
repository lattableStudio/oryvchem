"use client";

import { useState } from "react";
import { ConfirmButton } from "@/app/admin/ConfirmButton";
import type { ListDef, ListItem } from "@/lib/lists";
import { resetList, saveList } from "./actions";

export function ListEditor({ def, locale, dir, initial, customised }: { def: ListDef; locale: string; dir: "ltr" | "rtl"; initial: ListItem[]; customised: boolean }) {
  const [items, setItems] = useState<ListItem[]>(initial);
  const blank = () => Object.fromEntries(def.fields.map((f) => [f.k, ""]));
  const set = (i: number, k: string, v: string) => setItems((a) => a.map((it, j) => (j === i ? { ...it, [k]: v } : it)));
  const move = (i: number, d: number) =>
    setItems((a) => {
      const j = i + d;
      if (j < 0 || j >= a.length) return a;
      const b = [...a];
      [b[i], b[j]] = [b[j], b[i]];
      return b;
    });

  return (
    <form action={saveList} className="card list-ed">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="key" value={def.key} />
      <input type="hidden" name="items" value={JSON.stringify(items)} />
      <h2 style={{ margin: "0 0 4px" }}>
        {def.label} {customised && <span className="pill won">customised</span>}
      </h2>
      <p className="muted small" style={{ margin: "0 0 10px" }}>{def.help}</p>
      {items.map((it, i) => (
        <div className="li" key={i}>
          <div className="li-bar">
            <b>#{i + 1}</b>
            <button type="button" className="btn ghost" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up">↑</button>
            <button type="button" className="btn ghost" onClick={() => move(i, 1)} disabled={i === items.length - 1} aria-label="Move down">↓</button>
            <button type="button" className="btn danger" onClick={() => setItems((a) => a.filter((_, j) => j !== i))}>Delete</button>
          </div>
          {def.fields.map((f) => (
            <div key={f.k}>
              <label>{f.label}</label>
              {f.multiline ? (
                <textarea dir={dir} value={it[f.k] ?? ""} onChange={(e) => set(i, f.k, e.target.value)} />
              ) : (
                <input dir={dir} value={it[f.k] ?? ""} onChange={(e) => set(i, f.k, e.target.value)} />
              )}
            </div>
          ))}
        </div>
      ))}
      <div className="inline" style={{ marginTop: 12 }}>
        <button type="button" className="btn ghost" onClick={() => setItems((a) => [...a, blank()])}>+ Add item</button>
        <button className="btn">Save</button>
        {customised && <ConfirmButton message="Discard your changes and restore the built-in list?" className="btn ghost" formAction={resetList} type="submit">Reset to built-in</ConfirmButton>}
      </div>
    </form>
  );
}
