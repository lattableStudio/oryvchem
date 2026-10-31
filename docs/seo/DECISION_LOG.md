# Decision log

| ID | Date | Decision | Why | Reversible? |
|---|---|---|---|---|
| D-001 | 2026-10-27 | The master prompt (written for LastTable) was adapted to Oryvchem. Restaurants, bookings and IE/UAE markets were replaced with chemical categories, inquiries and EN/AR/FR markets. | The user chose "Adapt it to Oryvchem" and pointed at oryvchem.com. | — |
| D-002 | 2026-10-27 | First run scoped to Sprints 0–2. | User choice. The full 13-sprint plan is far more than one session can do. | — |
| D-003 | 2026-10-27 | **6 agents, not 12.** Performance was merged into technical SEO, AEO into GEO, and experimentation into the architect. Local search, content strategy and search data were left out. | Local search: a B2B exporter has no consumer local pack. Content strategy: `searchfit-seo:content-strategist` already exists. Search data: there's no GSC/GA4 access yet, so the agent would be decorative. Add it in Sprint 9. | Yes |
| D-004 | 2026-10-27 | `scripts/seo-check.mjs` has zero dependencies, rather than using Playwright or Jest. | No supply-chain additions. The pages are SSR, so a raw-HTML check is what crawlers see. It runs in CI without a browser. | Yes |
| D-005 | 2026-10-27 | Apex→www fixed in-app (`next.config.ts` host redirect) as well as through Vercel Domains. | The platform setting needs approval. The in-app 308 is derived from `NEXT_PUBLIC_SITE_URL`, only triggers on the bare host, and is a no-op on localhost and previews. | Yes (revert) |
| D-006 | 2026-10-27 | `preload: false` on the IBM Plex Sans Arabic and Mono fonts. | `next/font` preloads per layout, not per locale, so en/fr pages were preloading 4 Arabic files. Arabic pages now load the font through `@font-face` (swap). Expect a brief fallback-font flash on first visit to `/ar`. | Yes |
| D-007 | 2026-10-27 | Home meta descriptions shortened to ≤160 characters, and the FR title to 63. | F2. The Arabic copy was rewritten natively (not machine-shortened), keeping COA and SDS as the trust terms buyers search for. | Yes (admin override or revert) |
| D-008 | 2026-10-27 | Did **not** noindex the empty Insights index. | A robots-directive change on production requires approval under the autonomy policy (F7). | — |
| D-009 | 2026-10-27 | FAQPage and HowTo markup kept, but not counted as rich-result eligible. | Google restricted or removed these rich results in 2023. They are still valid schema.org for other parsers. | — |
