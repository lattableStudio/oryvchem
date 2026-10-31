---
name: ai-search-eval
description: Run the Oryvchem AI search evaluation suite — score target pages with the internal AI Search Readiness Score and log observed AI-engine citations for the EN/AR/FR query set. Use monthly or when asked about GEO / AI visibility.
---
# ai-search-eval

The suite, scoring rubric and log are in `docs/seo/AI_SEARCH_EVAL.md`.

1. **Readiness scoring:** for each target page in the query table, fetch it and score it against the rubric. Most signals come from `npm run seo:check` (prod), `/llms.txt` and the page's JSON-LD. Write the score with a one-line justification per signal. Always label it an *internal diagnostic*.
2. **Citation observations:** only through legitimate use of each engine's UI, done by the user or with browser tools in the user's session (Claude in Chrome). No scraping and no automation that breaks terms. For each query record the date, engine, language, whether oryvchem.com was cited, and the exact URL. If you couldn't check an engine, write "not checked", never "no".
3. **Gaps:** for every query with no good target page, add a content idea to `docs/seo/ROADMAP.md` (Sprint 7). Include the answer the page must give in its first two sentences.
4. Don't attribute any change in citations to a specific site change without a dated before/after entry in `docs/seo/EXPERIMENTS.md`.
