import type { Metadata } from "next";
import Link from "next/link";
import { Inter } from "next/font/google";
import { isAdmin } from "@/lib/auth";
import { logout } from "./actions";
import { AdminShell } from "./AdminShell";
import "./admin.css";

const inter = Inter({ subsets: ["latin"], display: "swap", variable: "--f-ui" });

export const metadata: Metadata = { title: "Oryvchem admin", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const authed = await isAdmin();
  return (
    <html lang="en" className={inter.variable}>
      <body>
        {authed ? (
          <AdminShell
            footer={
              <>
                <Link href="/en" target="_blank" className="side-link">View site ↗</Link>
                <form action={logout}><button className="side-link out">Log out</button></form>
              </>
            }
          >
            {children}
          </AdminShell>
        ) : (
          <main className="adm bare">{children}</main>
        )}
      </body>
    </html>
  );
}
