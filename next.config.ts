import type { NextConfig } from "next";

// Canonical host, e.g. www.oryvchem.com. The bare domain should 308 to it (also set in Vercel Domains; this is the in-app fallback).
const siteHost = new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.oryvchem.com").host;

const config: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  async redirects() {
    if (!siteHost.startsWith("www.")) return [];
    return [{ source: "/:path*", has: [{ type: "host", value: siteHost.slice(4) }], destination: `https://${siteHost}/:path*`, permanent: true }];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
        ],
      },
      {
        source: "/admin/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
          { key: "Cache-Control", value: "no-store" },
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
        ],
      },
      { source: "/:path*", headers: [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" }] },
    ];
  },
};

export default config;
