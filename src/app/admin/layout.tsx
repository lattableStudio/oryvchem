import type { Metadata } from "next";
import Link from "next/link";
import { isAdmin } from "@/lib/auth";
import { logout } from "./actions";
import "./admin.css";

export const metadata: Metadata = { title: "Oryvchem admin", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const authed = await isAdmin();
  return (
    <html lang="en">
      <body>
        {authed && (
          <header className="top">
            <b>Oryvchem admin</b>
            <Link href="/admin">Leads (CRM)</Link>
            <Link href="/admin/content">Site content</Link>
            <Link href="/admin/posts">Insights posts</Link>
            <Link href="/en" target="_blank">View site ↗</Link>
            <form action={logout}><button className="btn ghost" style={{ color: "#fff", borderColor: "#41545c" }}>Log out</button></form>
          </header>
        )}
        <main className="adm">{children}</main>
      </body>
    </html>
  );
}
