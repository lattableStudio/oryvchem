"use client";

import { useState, useTransition } from "react";
import { resetHomeLayout, saveHomeLayout } from "./actions";

type Item = { id: string; label: string; visible: boolean };

export function HomeLayoutEditor({ initial }: { initial: Item[] }) {
  const [items, setItems] = useState(initial);
  const [msg, setMsg] = useState("");
  const [pending, start] = useTransition();

  const move = (i: number, d: -1 | 1) =>
    setItems((cur) => {
      const j = i + d;
      if (j < 0 || j >= cur.length) return cur;
      const next = cur.slice();
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  const toggle = (i: number) => setItems((cur) => cur.map((it, k) => (k === i ? { ...it, visible: !it.visible } : it)));

  const save = () =>
    start(async () => {
      const r = await saveHomeLayout(JSON.stringify(items.map(({ id, visible }) => ({ id, visible }))));
      setMsg(r.ok ? "Saved. The home page updates immediately." : r.error ?? "Failed.");
    });
  const reset = () =>
    start(async () => {
      const r = await resetHomeLayout();
      if (r.ok) {
        window.location.reload();
      } else setMsg(r.error ?? "Failed.");
    });

  return (
    <>
      <ol className="home-ed">
        {items.map((it, i) => (
          <li key={it.id} className={it.visible ? "" : "off"}>
            <span className="n">{i + 1}</span>
            <span className="t">{it.label}{!it.visible && <span className="pill spam" style={{ marginInlineStart: 8 }}>hidden</span>}</span>
            <span className="inline">
              <button type="button" className="btn ghost" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up">↑</button>
              <button type="button" className="btn ghost" onClick={() => move(i, 1)} disabled={i === items.length - 1} aria-label="Move down">↓</button>
              <button type="button" className="btn ghost" onClick={() => toggle(i)}>{it.visible ? "Hide" : "Show"}</button>
            </span>
          </li>
        ))}
      </ol>
      <p className="inline">
        <button type="button" className="btn" onClick={save} disabled={pending}>{pending ? "…" : "Save layout"}</button>
        <button type="button" className="btn ghost" onClick={reset} disabled={pending}>Reset to default</button>
        {msg && <span className="muted">{msg}</span>}
      </p>
    </>
  );
}
