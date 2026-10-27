# SEO experiments

Rules: one hypothesis per entry, a measured baseline before the change, a fixed observation window, and no causal claims from ranking noise. Use GSC data once Sprint 9 lands, and mark anything else as "observation".

| ID | Hypothesis | Change | Baseline (date, source) | Window | Result | Confidence |
|---|---|---|---|---|---|---|
| E-001 | Shorter home meta descriptions (≤160 chars) raise home-page CTR in all 3 locales. | Sprint 2 (D-007) | **Missing**: no GSC access yet. Capture 28 days of home-page CTR per locale before deploying if possible. | 28 days after deploy | — | — |
| E-002 | Removing 6 font preloads improves mobile LCP on `/en` and `/fr`. | Sprint 2 (D-006) | **Missing**: PSI blocked (no key). | Lab: immediate. Field: 28 days (CrUX). | — | — |
