# SEO knowledge base

Facts about *this* codebase and the current search-engine guidance that the agents rely on. Add an entry whenever something non-obvious is learned.

## Codebase
- All copy comes from `getDict(locale)`, which is built-in dictionaries plus DB `content_overrides`. **An admin override beats the code**, so a copy fix in `src/i18n/dictionaries/*` can be silently masked in production. Check `/admin` → Content.
- Categories are built-ins (`src/lib/site.ts`) merged with DB rows (`src/lib/categories.ts`). A DB row can hide a built-in or add a new one.
- Pages are ISR (`revalidate = 300`), and admin saves flush the `content` cache tag.
- Without `DATABASE_URL` the site builds and runs from built-in copy. That's how CI and `seo:check` run locally (`DATABASE_URL= npm run build`).
- `src/proxy.ts` (Next 16's name for middleware) redirects locale-less paths with a 307 based on `Accept-Language`. Its matcher skips `api`, `admin`, `_next`, `og`, `llms*`, `media/` and any path with a dot.
- `next.config.ts` redirects run **before** the proxy, so the apex→www redirect happens before the locale redirect.
- `next/font` preloads are emitted per layout file. A per-locale preload isn't possible from a shared `[locale]/layout.tsx`.
- Shared helpers: `url()`, `alternates()`, `pageMetadata()`, `snippet()` and `plainText()` in `src/lib/seo.ts`; JSON-LD builders in `src/lib/schema.ts` (`breadcrumbSchema()` and others).

## Search-engine guidance (verify periodically)
- FAQ rich results are limited to well-known government and health sites (Google, Aug 2023). HowTo rich results were removed (Sep 2023).
- Google uses sitemap `lastmod` only when it is consistently accurate.
- hreflang must be reciprocal and self-referencing. `x-default` is recommended.
- Bing's index feeds ChatGPT search and Copilot, so Bing Webmaster Tools and IndexNow matter for GEO.
- No implementation guarantees an AI citation. Record observations only (see `AI_SEARCH_EVAL.md`).

## Regression causes seen
- _(none yet)_
