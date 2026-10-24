import Link from "next/link";

export const PAGE_SIZE = 25;

/** Server-rendered prev/next pager. `href(page)` builds the link, keeping the other filters. */
export function Pager({ page, total, href }: { page: number; total: number; href: (p: number) => string }) {
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  if (pages <= 1) return null;
  return (
    <nav className="pager" aria-label="Pagination">
      {page > 1 ? <Link className="btn ghost" href={href(page - 1)}>← Previous</Link> : <span className="btn ghost off">← Previous</span>}
      <span className="muted small">Page {page} of {pages} · {total} total</span>
      {page < pages ? <Link className="btn ghost" href={href(page + 1)}>Next →</Link> : <span className="btn ghost off">Next →</span>}
    </nav>
  );
}

export const pageNum = (v: string | undefined) => Math.max(1, Math.min(10000, Number.parseInt(v ?? "1", 10) || 1));
