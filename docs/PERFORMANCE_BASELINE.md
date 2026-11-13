# Performance Baseline

How to reproduce: `npm run build && npm run bundle:report`. The report lists the
files `dist/index.html` references, which is what the browser must download
before the app can start.

## Baseline: 2026-11-13

- Commit: `09e0921` (`preview_b`), measured on branch `LinC/quality-of-life`
- Initial-chunk total: **5 files, 1290.5 KB raw / 337.4 KB gzip**

| Initial chunk | Raw | Gzip |
|---|---|---|
| `index-*.js` | 193.1 KB | 61.4 KB |
| `vendor-react-*.js` | 250.7 KB | 81.6 KB |
| `vendor-ui-*.js` | 347.8 KB | 110.0 KB |
| `vendor-data-*.js` | 123.9 KB | 36.5 KB |
| `index-*.css` | 375.0 KB | 47.9 KB |

Not in the initial load (fetched on demand): `vendor-charts`, `vendor-pdf`.

### Lighthouse (mobile, https://fitswizardbeta.vercel.app)

Pending: run by owner. Record Performance score, LCP, TBT and JS transferred here.

| Metric | Value |
|---|---|
| Performance score | pending |
| LCP | pending |
| TBT | pending |
| JS transferred | pending |

## Task 3 (lazy-load chart components): skipped

The plan runs Task 3 only if `vendor-charts` is in the initial chunk list. It is
not: every page that renders a chart is already a lazy route, so the chart
library is only downloaded when one of those pages opens. No change was needed.

## After the quality-of-life pass: 2026-11-13

- Branch `LinC/quality-of-life`
- Initial-chunk total: **5 files, 1294.3 KB raw / 338.4 KB gzip** (baseline 1290.5 KB / 337.4 KB)

| Initial chunk | Before (gzip) | After (gzip) |
|---|---|---|
| `index-*.js` | 61.4 KB | 62.3 KB |
| `vendor-react-*.js` | 81.6 KB | 81.6 KB |
| `vendor-ui-*.js` | 110.0 KB | 110.0 KB |
| `vendor-data-*.js` | 36.5 KB | 36.5 KB |
| `index-*.css` | 47.9 KB | 47.9 KB |

The initial load grew by about 1 KB gzip. That is the new translation strings
(all four locales ship in the main chunk) and small helpers. This pass did not
make the first load smaller: the only planned load-time change (Task 3) did not
apply. The largest remaining items in the initial load are `vendor-ui` and the
CSS file.

Exercise search: the same live search run twice made 2 requests before and 1
after (counted in `searchCache.test.ts` with a mocked fetch, not in the browser).
