import { NextResponse, type NextRequest } from "next/server";
import { locales, defaultLocale, type Locale } from "@/i18n/config";

function pickLocale(req: NextRequest): Locale {
  const header = req.headers.get("accept-language") ?? "";
  const prefs = header
    .split(",")
    .map((p) => {
      const [tag, q] = p.trim().split(";q=");
      return { lang: tag.toLowerCase().split("-")[0], q: q ? parseFloat(q) : 1 };
    })
    .sort((a, b) => b.q - a.q);
  for (const { lang } of prefs) {
    const hit = locales.find((l) => l === lang);
    if (hit) return hit;
  }
  return defaultLocale;
}

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const hasLocale = locales.some((l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`));
  if (hasLocale) return NextResponse.next();
  const url = req.nextUrl.clone();
  url.pathname = `/${pickLocale(req)}${pathname === "/" ? "" : pathname}`;
  const res = NextResponse.redirect(url, 307);
  res.headers.set("Vary", "Accept-Language");
  return res;
}

export const config = {
  // Skip API, Next internals, metadata files and anything with a file extension.
  matcher: ["/((?!api|admin|_next|og|llms|llms-full|.*\\..*).*)"],
};
