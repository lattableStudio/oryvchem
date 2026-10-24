"use client";

import { useState } from "react";

type Faq = { q: string; a: string };

export function FaqRows({ name, initial, rtl }: { name: string; initial: Faq[]; rtl?: boolean }) {
  const [rows, setRows] = useState<(Faq & { id: number })[]>(() => initial.map((f, i) => ({ ...f, id: i })));
  const [next, setNext] = useState(initial.length);
  return (
    <div className="faqrows">
      {rows.map((r) => (
        <div className="faqrow" key={r.id}>
          <input name={`${name}:faq_q`} defaultValue={r.q} placeholder="Question" dir={rtl ? "rtl" : undefined} />
          <textarea name={`${name}:faq_a`} defaultValue={r.a} placeholder="Answer" dir={rtl ? "rtl" : undefined} />
          <button type="button" className="btn ghost" onClick={() => setRows(rows.filter((x) => x.id !== r.id))}>Remove</button>
        </div>
      ))}
      <button type="button" className="btn ghost" onClick={() => { setRows([...rows, { id: next, q: "", a: "" }]); setNext(next + 1); }}>+ Add question</button>
    </div>
  );
}
