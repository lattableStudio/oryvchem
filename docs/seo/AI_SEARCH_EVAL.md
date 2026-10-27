# AI search evaluation suite

The **AI Search Readiness Score** is an internal diagnostic. It is *not* a Google or AI-platform metric and doesn't predict citations.

## Readiness score (0–100) for a page
| Signal | Points | How it's checked |
|---|---|---|
| Crawlable: 200, indexable, in sitemap, AI bots allowed in robots.txt | 20 | `npm run seo:check` + robots.txt |
| Answer-first: the question is answered in the first 2–3 sentences of visible text | 20 | Manual / agent review |
| Entity clarity: Organization JSON-LD, consistent name, address and contact, `sameAs` | 15 | JSON-LD |
| Facts are specific and verifiable (CAS numbers, specs, documents, Incoterms) | 15 | Manual review |
| Present in `llms.txt` / `llms-full.txt` | 10 | Fetch |
| Freshness: accurate `dateModified` / `lastmod` | 10 | Sitemap / JSON-LD |
| Available in the buyer's language (EN/AR/FR) with hreflang | 10 | `seo:check` |

## Query set
Record observations only when you can actually reproduce them. Use the engines' normal UIs by hand, and don't scrape in breach of their terms. Note the date, engine, language and whether oryvchem.com was cited (yes/no/URL). Never estimate.

| # | Market | Lang | Intent | Query | Target page |
|---|---|---|---|---|---|
| Q1 | Global | en | Commercial | chemical sourcing agent in Foshan China | `/en` |
| Q2 | Gulf | en | Commercial | polyaluminium chloride supplier China for water treatment Saudi Arabia | `/en/products/water-treatment` |
| Q3 | Gulf | ar | Commercial | مورد بولي ألومنيوم كلورايد من الصين | `/ar/products/water-treatment` |
| Q4 | Gulf | ar | Informational | كيف أتحقق من شهادة تحليل COA لمورد صيني | `/ar` (FAQ). Gap: needs an article |
| Q5 | Maghreb | fr | Commercial | fournisseur dioxyde de titane Chine pour peinture Algérie | `/fr/products/paints-coatings` |
| Q6 | Maghreb | fr | Informational | importer des produits chimiques de Chine documents nécessaires | Gap: needs an article |
| Q7 | Global | en | Commercial | ceramic frit and zirconium silicate supplier China | `/en/products/ceramic-raw-materials` |
| Q8 | Global | en | Navigational | Oryvchem | `/en` |

## Observation log
| Date | Engine | Query | Cited? | URL cited | Notes |
|---|---|---|---|---|---|
| _(none recorded yet)_ | | | | | |
