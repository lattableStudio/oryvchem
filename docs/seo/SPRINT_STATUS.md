# Sprint status

_Last updated: 2026-10-27, branch `seo/sprint-0-2`_

| Sprint | Status | Evidence |
|---|---|---|
| 0 Discovery and baseline | ✅ Done | `BASELINE_AUDIT.md`. Production `seo:check`: **29 passed, 11 failed** (F1, F2, F5). |
| 1 Agents, skills, tooling | ✅ Done | `.claude/agents/` (6), `.claude/skills/` (4), `TOOLING_EVALUATION.md` |
| 2 Technical SEO foundation | ✅ Done on branch, awaiting review | `npm run typecheck` ✓, `npm run build` ✓, local `seo:check`: **0 failed**. Font preloads 8 → 2. Apex fallback returns a 308 locally. |
| 3–12 | Not started | See `ROADMAP.md` |

## Needs approval
1. **Vercel Domains:** redirect `oryvchem.com` → `www.oryvchem.com` (308). The code fallback is on the branch, but the platform setting is the proper fix (F1).
2. **Merge and deploy** the `seo/sprint-0-2` PR.
3. **F7:** `noindex` the empty Insights index (a robots change on production), *or* commit to publishing articles.
4. **F15:** analytics choice: first-party lead attribution (DB migration) and/or GA4 / Vercel Web Analytics (privacy notice).

## Blocked (needs owner input)
- PSI API key (free): no Core Web Vitals baseline yet (F13).
- GSC read-only access and Bing WMT API key (F14, Sprint 9).
- Exact business address and postal code, for LocalBusiness schema (Sprint 4).

## After deploy, verify
```bash
SEO_BASE_URL=https://www.oryvchem.com SEO_APEX_URL=https://oryvchem.com npm run seo:check
```
Expected: 0 failures once the PR is deployed (the apex check also passes through the in-app fallback). Also check `/admin` → Content: if someone has overridden `meta.description` there, the override takes precedence over the new built-in copy.
