"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const I = (d: string) => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={d} />
  </svg>
);

const GROUPS: { title: string; items: { href: string; label: string; icon: string; exact?: boolean }[] }[] = [
  { title: "Overview", items: [{ href: "/admin/dashboard", label: "Dashboard", icon: "M3 13h8V3H3zM13 21h8V11h-8zM13 3v6h8V3zM3 21h8v-6H3z" }] },
  { title: "Sales", items: [{ href: "/admin", label: "Leads (CRM)", icon: "M4 4h16v12H5.2L4 17.2zM8 9h8M8 12h5", exact: true }] },
  {
    title: "Content",
    items: [
      { href: "/admin/pages", label: "Pages", icon: "M7 3h8l4 4v14H7zM15 3v4h4M10 12h6M10 16h6" },
      { href: "/admin/home", label: "Home layout", icon: "M3 11l9-8 9 8M5 10v10h14V10" },
      { href: "/admin/categories", label: "Categories & products", icon: "M4 7l8-4 8 4-8 4zM4 12l8 4 8-4M4 17l8 4 8-4" },
      { href: "/admin/lists", label: "Process, markets & more", icon: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" },
      { href: "/admin/posts", label: "Insights posts", icon: "M4 5h16v14H4zM8 9h8M8 13h8M8 17h4" },
      { href: "/admin/content", label: "Site text", icon: "M5 5h14M12 5v14M9 19h6" },
    ],
  },
  {
    title: "Library",
    items: [{ href: "/admin/media", label: "Media", icon: "M4 5h16v14H4zM4 16l5-5 4 4 3-3 4 4M9 9h.01" }],
  },
  { title: "Site", items: [{ href: "/admin/settings", label: "Settings", icon: "M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z" }] },
];

export function AdminShell({ footer, children }: { footer: React.ReactNode; children: React.ReactNode }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [path]);
  const active = (href: string, exact?: boolean) =>
    exact ? path === href || path.startsWith("/admin/leads") : path === href || path.startsWith(href + "/");

  return (
    <div className={`shell${open ? " open" : ""}`}>
      <aside className="side" aria-label="Admin navigation">
        <div className="brand">
          <span className="mark" aria-hidden="true" />
          <b>Oryvchem</b>
          <small>Admin</small>
        </div>
        <nav>
          {GROUPS.map((g) => (
            <div className="grp-nav" key={g.title}>
              <div className="grp-title">{g.title}</div>
              {g.items.map((it) => (
                <Link key={it.href} href={it.href} className={active(it.href, it.exact) ? "on" : ""} aria-current={active(it.href, it.exact) ? "page" : undefined}>
                  {I(it.icon)}
                  <span>{it.label}</span>
                </Link>
              ))}
            </div>
          ))}
        </nav>
        <div className="side-foot">{footer}</div>
      </aside>
      <div className="main-col">
        <div className="mobile-bar">
          <button type="button" className="burger-btn" aria-label="Menu" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
            {I("M4 6h16M4 12h16M4 18h16")}
          </button>
          <b>Oryvchem admin</b>
        </div>
        <main className="adm">{children}</main>
      </div>
      {open && <button type="button" className="scrim" aria-label="Close menu" onClick={() => setOpen(false)} />}
    </div>
  );
}
