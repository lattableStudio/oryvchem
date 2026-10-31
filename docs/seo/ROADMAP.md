# SEO / AEO / GEO roadmap — www.oryvchem.com

This roadmap adapts the generic 13-sprint SEO-system plan to Oryvchem: a B2B chemical-sourcing exporter in Foshan, serving the Middle East, North Africa, francophone Africa and Europe in EN/AR/FR. The commercial outcome is **qualified inquiries** (rows in `leads`), not bookings.

**Must never be affected by SEO work:** the inquiry form and `/api/inquiry`, lead storage and the email pipeline, admin auth, the rate limiter, the CMS save/revalidate flow, and the media route.

Complexity: S ≈ under ½ day · M ≈ 1–2 days · L ≈ 3+ days.

| # | Sprint | Depends on | Complexity | Status |
|---|---|---|---|---|
| 0 | Discovery, security, baseline audit | — | S | ✅ Done |
| 1 | Agents, skills, tooling | 0 | S | ✅ Done |
| 2 | Technical SEO foundation | 0 | S | ✅ On branch `seo/sprint-0-2`, awaiting review |
| 3 | Page architecture (products index, accurate lastmod, IndexNow) | 2 | M | Next |
| 4 | Structured data and social cards | 3 | M | Planned |
| 5 | Market SEO: Gulf and Levant (AR/EN) | 3 | M | Planned |
| 6 | Market SEO: Maghreb, francophone Africa, Europe (FR) | 3 | M | Planned |
| 7 | GEO and AEO content | 3, 9 (soft) | L | Planned |
| 8 | Keyword and competitor intelligence | 9 | M | Planned |
| 9 | Search Console, Bing and analytics integration | Owner access | M | **Blocked: access** |
| 10 | SEO dashboard (in `/admin`) | 9 | M | Planned |
| 11 | Automated QA and CI | 2 | S | Planned |
| 12 | Continuous optimisation loop | 9, 10, 11 | M | Planned |

---

### Sprint 0 — Discovery and baseline ✅
- **Deliverables:** `BASELINE_AUDIT.md`, `TOOLING_EVALUATION.md`, a production baseline for `seo:check` (29 passed / 11 failed).
- **Acceptance:** every finding has evidence, files, a fix and a verification method. *Met.*

### Sprint 1 — Agents and skills ✅
- **Deliverables:** `.claude/agents/*.md` (6 agents) and `.claude/skills/*/SKILL.md` (4 skills). See `DECISION_LOG.md` D-003 for why there are 6 agents rather than 12.
- **Acceptance:** every skill runs a real command or a defined workflow. Nothing is decorative.

### Sprint 2 — Technical SEO foundation ✅ (branch)
- **Tasks done:** in-app apex→www 308 fallback (F1), shorter home meta copy (F2), font preloads cut from 8 to 2 (F3), `snippet()` truncation (F4), Insights CollectionPage/Breadcrumb and Article Breadcrumb JSON-LD (F5), `npm run seo:check` (F16).
- **Acceptance:** `typecheck` and `build` pass, and `seo:check` against the local build reports 0 failures. *Met.*
- **Rollback:** revert the PR. All changes are stateless (no DB or migrations).
- **Still needed outside code:** set the Vercel Domains apex redirect (approval).

### Sprint 3 — Page architecture
- **Objective:** a real hierarchy and accurate freshness signals.
- **Tasks:**
  - `/[locale]/products` index page (ItemList and Breadcrumb), linked from the nav; fix F6 so breadcrumb level 2 points at it.
  - `lastmod` derived from `max(updated_at)` across categories, content overrides and lists (F8). Also feeds `SITE.updated` on product pages.
  - IndexNow ping on admin publish (key file route, Bing).
  - Decide F7: noindex the empty Insights index until the first post, or publish (approval).
- **Acceptance:** `seo:check` is extended with the products index. Editing a category in admin changes its sitemap `lastmod`.
- **Risks:** the nav change affects the RTL layout, so check Arabic visually.

### Sprint 4 — Structured data and social
- **Tasks:**
  - Per-locale, per-page OG images (`ImageResponse` with an embedded Arabic font) (F9).
  - `Organization.logo` as a ≥112 px raster.
  - Confirm the address and postal code with the owner before enriching LocalBusiness.
  - Validate the main templates in the Rich Results Test.
- **Rule:** only mark up facts that are visible on the page. Never invent certifications, ratings or reviews.

### Sprint 5 / 6 — Market SEO
- **Objective:** match buyer intent in the Gulf/Levant (AR/EN) and the Maghreb/francophone Africa (FR).
- **Tasks:**
  - Research native-language queries separately per market. Arabic buyers search by product and CAS number as well as by Arabic trade terms; don't translate EN keywords literally.
  - Per-category localized FAQs answering market questions: import documents, Incoterms, HS codes, SASO/GSO for the Gulf, ONSSA/EU REACH where relevant.
  - Check `areaServed` against the markets actually served.
- **Guardrail:** no country landing pages without unique, useful content (avoid doorway pages).

### Sprint 7 — GEO and AEO
- **Tasks:**
  - Run the AI-search evaluation suite (`AI_SEARCH_EVAL.md`) monthly and log observations only.
  - Publish buyer guides (e.g. "How to verify a COA from a Chinese supplier", "PAC vs alum for water treatment", "Shipping chemicals from China to Saudi Arabia: documents") in EN/AR/FR with sources.
  - Add a dated, factual "About / how we verify factories" page (provenance, E-E-A-T).
- **Acceptance:** each article has a clear answer in its first 2–3 sentences, cites sources and appears in `llms.txt`.

### Sprint 8 — Keyword and competitor intelligence
- **Depends on:** GSC data (Sprint 9). DataForSEO is optional and paid, so it needs approval.
- **Deliverable:** keyword clusters → page mapping in `docs/seo/KEYWORDS.md`, and a content calendar.

### Sprint 9 — Search data integration (blocked)
- **Needs from the owner:**
  - Read-only GSC access (add a service-account email as a *restricted* user).
  - Bing WMT API key.
  - A free PSI API key.
  - A decision on analytics (F15).
- **Tasks:**
  - `scripts/gsc-report.mjs` (read-only).
  - `leads.source_referrer` and `leads.landing_page` columns (first-party attribution). This is a DB migration on production, so it **needs approval**.

### Sprint 10 — Dashboard
- Extend the existing `/admin/dashboard` rather than building a separate app.
- Panels: organic inquiries by locale and landing page, the last `seo:check` result, GSC clicks/impressions (when available), and open SEO tasks.
- **Rule:** show missing data as "no data", never as 0.

### Sprint 11 — QA and CI
- **Tasks:**
  - GitHub Actions workflow on PRs: `typecheck` → `build` → `next start` → `seo:check` (no DB).
  - Optional scheduled run against production (daily, read-only).
- **Acceptance:** a PR that introduces a canonical or hreflang regression fails CI.

### Sprint 12 — Continuous loop
- **Cadence:**
  - Weekly: `seo:check` against production and a GSC delta.
  - Monthly: AI-search suite, competitor scan, roadmap review.
- **Mechanism:** Claude Code routines (`/schedule`) or GitHub Actions cron. Each run opens an issue or PR and never deploys.
- **Approval gate:** humans merge, and Vercel deploys from `main`.
