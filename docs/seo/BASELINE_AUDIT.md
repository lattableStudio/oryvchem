# Baseline SEO / GEO audit — www.oryvchem.com

- **Date:** 2026-10-27 (Sprint 0)
- **Commit audited:** `0d10796` (main)
- **Method:** source review of `src/`, plus read-only HTTP checks against production with a Googlebot user agent (`curl` and a stdlib HTML parser). No production changes were made.
- **Scope:** 27 indexable URLs, which is 9 templates × 3 locales (en, ar, fr). At audit time no Insights articles or CMS pages were published.

Statuses: **IMPLEMENTED** · **PARTIAL** · **MISSING** · **BROKEN** · **NEEDS VALIDATION**

## 1. Capability map

| Capability | Status | Evidence |
|---|---|---|
| Framework / rendering | IMPLEMENTED | Next.js 16.4 App Router on Vercel. Pages are ISR (`revalidate = 300`) and server-rendered, so content is fully present in the HTML without JS. |
| Locale routing | IMPLEMENTED | `/en`, `/ar`, `/fr`. `/` returns a 307 chosen by `Accept-Language`, with `Vary: Accept-Language` (`src/proxy.ts`). |
| `html lang` / `dir` | IMPLEMENTED | `ar` is `dir="rtl"` (`src/app/[locale]/layout.tsx`). Verified live. |
| Titles / descriptions | PARTIAL | Every page is unique and localized, but the home descriptions are 303–346 characters and the FR home title is 84 (see F2). |
| Canonicals | IMPLEMENTED | Self-referencing and absolute on `www` (`src/lib/seo.ts`). Verified on 8 sampled URLs. |
| hreflang | IMPLEMENTED | en/ar/fr plus `x-default` → `/en`, reciprocal, in both the `<head>` and the sitemap. CMS pages only get hreflang for languages that actually exist. |
| XML sitemap | IMPLEMENTED | 27 `<loc>`s with `xhtml:link` alternates (`src/app/sitemap.ts`). Every listed URL returns 200. |
| Sitemap `lastmod` accuracy | PARTIAL | Core pages use the hard-coded `SITE.updated` constant, so admin edits don't change it (F8). |
| robots.txt | IMPLEMENTED | Allows all crawlers, with an explicit allow list for 19 AI crawlers and `Disallow: /api/`. |
| Admin isolation | IMPLEMENTED | `/admin/*` sends `X-Robots-Tag: noindex, nofollow` and `no-store`, and redirects to the login page. |
| 404 handling | IMPLEMENTED | Unknown paths return a real 404 status (`/en/nope` → 404). |
| Host canonicalisation | **BROKEN** | `https://oryvchem.com/en` returns **200** instead of redirecting to `www` (F1). |
| Structured data | IMPLEMENTED | Home: Organization+LocalBusiness, WebSite, WebPage, ItemList, FAQPage, HowTo. Product: Service, BreadcrumbList, FAQPage. Article: Article. Every block parsed as valid JSON. |
| Structured data coverage | PARTIAL | The Insights index has no page-level schema and articles have no BreadcrumbList (F5). |
| Open Graph / Twitter | PARTIAL | Present on every page, but one English-only card (`/og`) is shared by all pages and locales (F9). |
| GEO: llms.txt | IMPLEMENTED | `/llms.txt` (7 KB) and `/llms-full.txt` (41 KB), generated from live content (`src/lib/llms.ts`). |
| GEO: answer-first content | IMPLEMENTED | "What is Oryvchem" answer block with a facts `<dl>`, home FAQ and per-category FAQs, in all 3 languages. |
| Content depth | **PARTIAL** | 0 articles and 0 CMS pages. The 3 Insights index pages are indexed while empty (F7). |
| Headings | IMPLEMENTED | Exactly one `<h1>` on every sampled page. |
| Images | IMPLEMENTED | No content `<img>` on core pages. CMS and article cover images use `/media/:id` with `alt`. |
| Fonts / performance | PARTIAL | 8 font preloads on every page, including the Arabic and mono families on en/fr pages (F3). |
| Core Web Vitals | NEEDS VALIDATION | The PageSpeed Insights API returned *quota exceeded* on the keyless shared quota (F13). |
| Analytics | **MISSING** | No GA4, Vercel Analytics or other analytics in `src/`, so organic conversions can't be measured (F15). |
| Search Console / Bing | NEEDS VALIDATION | No verification meta tag in code (DNS verification is possible). There's no access to confirm verification or sitemap submission (F14). |
| Automated SEO tests / CI | MISSING | No tests or CI before this sprint. Now added: `scripts/seo-check.mjs` (F16). |

## 2. Findings

| ID | Severity | Finding | Evidence / files | Business impact | Fix | Effort | Verify | Status |
|---|---|---|---|---|---|---|---|---|
| F1 | **High** | The apex host serves a duplicate site. `https://oryvchem.com/en` returns 200, and `http://oryvchem.com` takes 3 hops (`→ https://oryvchem.com/ → /en`). | `curl -I https://oryvchem.com/en`. The README says to redirect the apex to `www`. | Duplicate host: link signals and crawl budget split across two hosts. Canonicals limit the damage but don't remove it. | **Primary:** set `oryvchem.com` to a 308 redirect to `www.oryvchem.com` in Vercel → Domains (infra change, needs approval). **Fallback (on branch):** host-based 308 in `next.config.ts`, derived from `NEXT_PUBLIC_SITE_URL`. | S | `curl -sI https://oryvchem.com/en` → 308 to `https://www.oryvchem.com/en` | Code fallback on branch; Vercel setting needs approval |
| F2 | Medium | Home meta descriptions are 303 (en), 319 (ar) and 346 (fr) characters. The FR title is 84 characters. | `src/i18n/dictionaries/{en,ar,fr}.ts` → `meta` | Google rewrites or truncates past roughly 155–160 characters / ~600 px, so the value proposition gets cut off in results. | Shorter built-in copy (≤160 characters, title ≤65). Edits in `/admin` → Content override the built-in copy, so check after deploying. | S | `npm run seo:check` length rules | Fixed on branch |
| F3 | Medium | Every page preloads 8 font files, including IBM Plex Sans Arabic and IBM Plex Mono on en/fr pages, where `unicode-range` would otherwise never fetch the Arabic files. | `src/app/[locale]/layout.tsx`. Live HTML has 8 `<link rel=preload as=font>` on `/en`. | Wasted bandwidth that competes with the LCP text font on mobile. | `preload: false` for the Arabic and mono families. Arabic pages still load them through `@font-face` with `display: swap`. | S | Count of `rel=preload as=font` in the built HTML | Fixed on branch |
| F4 | Low | The product meta description always drops the last word and appends "…", even when the intro is shorter than 155 characters. CMS page descriptions are cut mid-word. | `src/app/[locale]/products/[slug]/page.tsx`, `src/app/[locale]/[slug]/page.tsx` | Descriptions look clipped. | A shared `snippet()` helper in `src/lib/seo.ts` that truncates on a word boundary only when needed. | S | Unit check in `seo:check` | Fixed on branch |
| F5 | Low | The Insights index has no CollectionPage or BreadcrumbList. Articles have no BreadcrumbList even though a visible breadcrumb is shown. | `src/app/[locale]/insights/**` | Weaker page-type and hierarchy signals for search and AI parsers. | Add CollectionPage + BreadcrumbList (index) and BreadcrumbList (articles), built from content that is actually on the page. | S | JSON-LD types in `seo:check` | Fixed on branch |
| F6 | Low | Breadcrumb level 2 ("Products") on product pages points to `/en#categories`, which resolves to the home URL. | `src/lib/schema.ts` → `productPageSchema` | The breadcrumb hierarchy collapses to Home → Category. | Add a real `/[locale]/products` index page (Sprint 3), then point the crumb at it. | M | Rich Results Test | Planned (Sprint 3) |
| F7 | Medium | No articles or CMS pages are published. The 3 Insights index pages are indexable but show only an empty-state message. | Live sitemap (27 URLs). `/en/insights` shows *empty* copy. | Thin pages, and no long-tail or question-led content for AEO/GEO to cite. | (a) Publish 6–10 buyer-guide articles per language (Sprint 7–8), **or** (b) `noindex` the Insights index and drop it from the sitemap until the first post exists. That changes production robots directives, so it **needs approval**. | M | Sitemap / robots meta | Needs approval |
| F8 | Low | The sitemap `lastmod` for home and product pages is the hard-coded `SITE.updated` constant. | `src/lib/site.ts`, `src/app/sitemap.ts` | Google ignores `lastmod` when it is inaccurate, so recrawls of edited pages are slower. | Track the latest `updated_at` across categories, overrides and lists, and use it (Sprint 3). | M | Edit in admin → sitemap `lastmod` changes | Planned |
| F9 | Low | One OG image for every page and locale, and its text is English only. | `src/app/og/route.tsx` | Weaker social and AI-preview relevance for ar/fr shares. | Per-locale, per-page OG cards (Sprint 4). Arabic needs an embedded Arabic font in `ImageResponse`. | M | Open Graph debugger | Planned |
| F10 | Info | FAQPage and HowTo markup are present. Google limited FAQ rich results to authoritative government and health sites (Aug 2023) and dropped HowTo rich results (Sep 2023). | `src/lib/schema.ts` | Expect **no** rich results from these. They remain valid schema.org that other parsers may use. | Keep. Don't report them as rich-result eligible. | — | — | Documented |
| F11 | Info | `/EN` and `/xx/…` redirect to `/en/EN` → 404 (one hop, then a 404). | `src/proxy.ts` | Negligible. | Leave as is. Optionally lower-case the locale segment later. | S | — | Won't fix now |
| F12 | Info | The `Host:` line in robots.txt is a legacy Yandex directive that Google ignores. | `src/app/robots.ts` | None. | Leave. | — | — | — |
| F13 | — | Core Web Vitals lab and field data are unavailable: the PSI API returned *Quota exceeded* without a key. | `docs/seo/TOOLING_EVALUATION.md` | — | Add a free PSI API key (`PSI_API_KEY`), or read the GSC CWV report. | S | — | **Blocked: needs key** |
| F14 | — | Search Console and Bing verification and sitemap submission can't be confirmed. | No verification meta in code | — | The owner confirms access and grants a read-only GSC user or service account. | S | — | **Blocked: needs access** |
| F15 | High (measurement) | No analytics, so organic sessions and inquiry conversions can't be measured. | `grep` of `src/` | The optimisation loop has no outcome metric. The CRM leads table records submissions but not their source. | (a) Record `referrer` and `landing_page` on leads (first-party, no consent banner needed), and/or (b) add GA4 or Vercel Web Analytics. Adding a third-party script changes privacy disclosures, so it **needs approval**. | M | Lead rows carry source | Needs approval |
| F16 | Medium | No automated SEO regression tests. | Repo had no `tests/`, `.github/` or test script. | Regressions such as a broken canonical or a `noindex` leak would only be found in production. | `scripts/seo-check.mjs` (zero dependencies) covers status, canonical, hreflang reciprocity, lengths, JSON-LD, the sitemap and robots. `npm run seo:check`. | S | Run it | Done on branch |

## 3. What is already strong

This is a well-built base. Most of the "enterprise technical SEO" checklist was already in place before this audit: SSR/ISR HTML, reciprocal hreflang in both the head and the sitemap, self-canonicals, real 404s, admin noindex, an AI-crawler allow list, `llms.txt`/`llms-full.txt`, an answer-first block and localized FAQs. The remaining gains are mostly **host canonicalisation (F1), measurement (F13–F15) and content depth (F7)**, not more markup.
