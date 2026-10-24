import type { ReactNode } from "react";

// Tiny, safe Markdown subset: ## / ### headings, - lists, 1. lists, paragraphs, **bold**, *italic*, `code`, [links](url), ![images](/media/ID or https://…).
// Output is React elements only (never raw HTML), and only http(s)/mailto/relative links are allowed.

const safeHref = (h: string) => (/^(https?:|mailto:|tel:|#)/i.test(h) || /^\/(?![/\\])/.test(h) ? h : "#");

function inline(text: string, key: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /(!\[[^\]]*\]\([^)\s]+\)|\*\*[^*]+\*\*|\*[^*\s][^*]*\*|`[^`]+`|\[[^\]]+\]\([^)\s]+\))/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const t = m[0];
    const k = `${key}-${i++}`;
    if (t.startsWith("**")) out.push(<strong key={k}>{t.slice(2, -2)}</strong>);
    else if (t.startsWith("`")) out.push(<code key={k}>{t.slice(1, -1)}</code>);
    else if (t.startsWith("![")) {
      const [, alt, src] = /^!\[([^\]]*)\]\(([^)]+)\)$/.exec(t)!;
      // Only library images and https sources are rendered; anything else falls back to the alt text.
      if (/^\/media\/\d+$/.test(src) || /^https:\/\//i.test(src))
        // eslint-disable-next-line @next/next/no-img-element
        out.push(<img key={k} src={src} alt={alt} loading="lazy" style={{ height: "auto", borderRadius: 10 }} />);
      else out.push(alt);
    } else if (t.startsWith("[")) {
      const [, label, href] = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(t)!;
      const external = /^https?:/i.test(href);
      out.push(
        <a key={k} href={safeHref(href)} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
          {label}
        </a>,
      );
    } else out.push(<em key={k}>{t.slice(1, -1)}</em>);
    last = m.index + t.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export function Markdown({ source }: { source: string }) {
  const blocks = source.replace(/\r\n/g, "\n").split(/\n{2,}/);
  return (
    <>
      {blocks.map((raw, bi) => {
        const b = raw.trim();
        if (!b) return null;
        const k = `b${bi}`;
        if (b.startsWith("### ")) return <h3 key={k}>{inline(b.slice(4), k)}</h3>;
        if (b.startsWith("## ")) return <h2 key={k}>{inline(b.slice(3), k)}</h2>;
        const lines = b.split("\n");
        if (lines.every((l) => /^[-*] /.test(l)))
          return <ul key={k}>{lines.map((l, i) => <li key={i}>{inline(l.slice(2), `${k}${i}`)}</li>)}</ul>;
        if (lines.every((l) => /^\d+\. /.test(l)))
          return <ol key={k}>{lines.map((l, i) => <li key={i}>{inline(l.replace(/^\d+\. /, ""), `${k}${i}`)}</li>)}</ol>;
        return <p key={k}>{inline(lines.join(" "), k)}</p>;
      })}
    </>
  );
}
