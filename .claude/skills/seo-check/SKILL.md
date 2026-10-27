---
name: seo-check
description: Run the Oryvchem SEO regression check (status codes, canonicals, hreflang reciprocity, title/description lengths, JSON-LD, sitemap, robots, 404, admin noindex, apex redirect) against a local build or production. Use before calling any SEO change done, after deploys, or when asked "is SEO OK?".
---
# seo-check

The argument is `local` (default) or `prod`.

## local: verifies the working tree
Run from the repo root. Use no DB, so production data is never read.
```bash
npm run typecheck
DATABASE_URL= npm run build
```
Start the server in the background (Bash `run_in_background`): `DATABASE_URL= npx next start -p 3123`. Then:
```bash
SEO_BASE_URL=http://localhost:3123 npm run seo:check
```
Stop the server afterwards (`pkill -f "next start -p 3123"`).

## prod: read-only, about 35 requests at 4 concurrent
```bash
SEO_BASE_URL=https://www.oryvchem.com SEO_APEX_URL=https://oryvchem.com npm run seo:check
```

## Reporting
- Quote the summary line (`N checks passed, M failed`) and every `FAIL` line verbatim.
- Map each FAIL to a finding ID in `docs/seo/BASELINE_AUDIT.md`, or add a new finding.
- A failing length check on production can come from an `/admin` content override rather than the code. Say which one it is.
- Never report "verified" when the run failed or didn't run.
