# Tasks

The SEO backlog lives in `docs/seo/ROADMAP.md`, and its status in `docs/seo/SPRINT_STATUS.md`.

## Now
- [ ] Review and merge PR `seo/sprint-0-2` (approval)
- [ ] Vercel → Domains: `oryvchem.com` → 308 → `www.oryvchem.com` (approval)
- [ ] After deploy: `SEO_BASE_URL=https://www.oryvchem.com SEO_APEX_URL=https://oryvchem.com npm run seo:check` → 0 failures

## Waiting on owner
- [ ] Free PageSpeed Insights API key → `PSI_API_KEY`
- [ ] Read-only Search Console access and Bing WMT API key
- [ ] Decide on the empty Insights index: noindex it or publish (F7)
- [ ] Decide on analytics / lead attribution (F15)
- [ ] Confirm the full business address (LocalBusiness schema)

## Next (Sprint 3)
- [ ] `/[locale]/products` index page; point breadcrumb level 2 at it (F6)
- [ ] Accurate sitemap `lastmod` from DB `updated_at` (F8)
- [ ] IndexNow ping on admin publish
- [ ] CI workflow running `seo:check` on PRs (Sprint 11, small)
