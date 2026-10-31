---
name: seo-audit
description: Re-audit www.oryvchem.com and refresh docs/seo/BASELINE_AUDIT.md — live HTTP checks, head/JSON-LD parsing, redirects, sitemap, and a source review of SEO code. Use at the start of a sprint or when asked for an SEO/GEO audit of Oryvchem.
---
# seo-audit

1. **Regression baseline:** run the `seo-check` skill in `prod` mode and keep the output.
2. **Redirect and host map** (read-only):
   ```bash
   for u in http://oryvchem.com https://oryvchem.com https://oryvchem.com/en http://www.oryvchem.com https://www.oryvchem.com/ https://www.oryvchem.com/en/nope; do
     printf "%-40s " "$u"; curl -s -o /dev/null -m 15 -w "%{http_code} %{redirect_url}\n" "$u"; done
   ```
3. **Performance:** if `PSI_API_KEY` is set, run
   `curl -s "https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=https://www.oryvchem.com/en&strategy=mobile&key=$PSI_API_KEY"`
   for `/en` and `/ar`, mobile and desktop. Record LCP, CLS, TBT and whether field data exists. Without a key, mark CWV as NEEDS VALIDATION. Never guess.
4. **Source review:** `src/lib/seo.ts`, `src/lib/schema.ts`, `src/app/sitemap.ts`, `src/app/robots.ts`, `src/proxy.ts`, `next.config.ts`, every `generateMetadata`. Look for new templates without schema or metadata, and for hard-coded dates.
5. **Content inventory:** count `<loc>` entries in `/sitemap.xml` by template, and check whether the Insights index is still empty.
6. For deeper or specialised passes, the installed `searchfit-seo` skills (technical-seo, schema-markup, on-page-seo, broken-links, ai-visibility) can be layered on. Don't duplicate their output.
7. Update `BASELINE_AUDIT.md`: refresh the date and commit, update statuses (IMPLEMENTED / PARTIAL / MISSING / BROKEN / NEEDS VALIDATION) and give each finding evidence, files, severity, impact, fix, effort and verification. Keep the IDs stable. Mark fixed items "Fixed (commit)" rather than deleting them.
