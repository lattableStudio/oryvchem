# Tooling evaluation

Date: 2026-10-27. Each tool is scored 1–5 on value to *this* project: a 27-URL trilingual B2B site, no budget assumed and a single maintainer.

## Already available in this Claude Code environment (verified by listing, not assumed)

| Tool | What it gives us | Use it for | Notes |
|---|---|---|---|
| `searchfit-seo` plugin | Skills: seo-audit, technical-seo, schema-markup, on-page-seo, broken-links, internal-linking, keyword-clustering, content-brief, translate-content, ai-visibility. Agents: seo-auditor, competitor-analyzer, content-strategist. | Ad-hoc audits, content briefs, AR/FR localisation briefs | Already installed, so nothing new to install. Our project skills call it instead of duplicating it. **5** |
| `marketing` plugin | seo-audit, competitive-brief, content-creation | Competitor briefs (Sprint 8) | Its Ahrefs and Similarweb MCPs are present but **unauthenticated** and paid. **3** |
| Playwright MCP | Headless browser | Rendered-DOM checks, screenshots of RTL layout | Free. **4** |
| Claude in Chrome | The user's real browser | Manual checks in GSC, Bing WMT and the Rich Results Test while logged in | Needs the user present. **4** |
| Vercel plugin / CLI | Deployments, env vars, domains | F1 apex redirect, env vars | The CLI is outdated (65.2 → 65.4). Domain changes need approval. **4** |
| Neon plugin | Postgres | Reading `leads` for conversion attribution (Sprint 9) | Read-only queries only. **3** |
| WebSearch / WebFetch | Docs and research | Search-engine guidance changes | **4** |

## Evaluated, not installed

| Tool | Capability | Maintenance / security | Cost | Verdict |
|---|---|---|---|---|
| **claude-seo** (`AgriciDaniel/claude-seo`, MIT, ~9.4k★, last push Jun 2026 per third-party trackers) | A broad SEO skill: technical, E-E-A-T, schema, GEO/AEO, local, international. Optional DataForSEO/Firecrawl extensions. | Popular community project. It installs skills and scripts that run locally, so its install script and any network calls need review first. | Free core. The extensions are paid APIs. | **Defer.** It overlaps heavily with the installed `searchfit-seo` plugin and with our own skills. Revisit only if a gap appears. Not to be confused with the separate `claude-seo-skills` repo. **2** |
| Google Search Console API | Queries, pages, CTR, position, URL Inspection, sitemaps | Official Google API. Use the `webmasters.readonly` scope. | Free | **Adopt (Sprint 9)** through a service account or OAuth with read-only scope. There is no official Google GSC MCP server. Community MCPs exist (e.g. `search-console-mcp`, which is read-only), so review the code before giving one credentials. **5** |
| Bing Webmaster Tools API | Bing and Copilot queries, crawl, IndexNow | Official | Free | **Adopt (Sprint 9)**. Bing's index feeds ChatGPT search and Copilot, so it matters for GEO. **4** |
| IndexNow | Instant URL submission to Bing, Yandex and others | Open protocol | Free | **Adopt (Sprint 3)**: ping on admin publish. Needs a key file on the domain. **4** |
| PageSpeed Insights API | Lighthouse lab data plus CrUX field data | Official | Free with an API key | **Blocked:** keyless calls returned *quota exceeded*. Needs a free `PSI_API_KEY`. **5** |
| Lighthouse CLI (`npx lighthouse`) | Local lab audits | Official Google package | Free | Use for local checks if PSI stays blocked. It runs through `npx` (no repo dependency) and needs Chrome. **3** |
| GA4 / Vercel Web Analytics | Sessions, conversions | Official | Free tier | **Needs approval:** a third-party script changes the privacy disclosure. The lighter alternative is first-party `referrer` and `landing_page` on `leads` (F15). **4** |
| Schema.org validator / Google Rich Results Test | Structured-data validation | Official | Free, but no API | Manual, through Claude in Chrome. Our `seo:check` covers parse validity and expected types. **3** |
| DataForSEO | SERP, keyword volume, AI Overview data | Commercial API | Pay-as-you-go | **Needs approval (paid).** Only worthwhile once content production starts (Sprint 8). **3** |
| Ahrefs | Backlinks, keywords | MCP is present | Paid subscription | **Needs approval (paid).** Not justified at the current site size. **2** |
| Screaming Frog | Crawler | Desktop app | Free up to 500 URLs | Unnecessary: `seo:check` crawls the sitemap. **1** |

## Installed this sprint

**Nothing.** `scripts/seo-check.mjs` uses only Node built-ins (`fetch`), so no third-party code was added.
