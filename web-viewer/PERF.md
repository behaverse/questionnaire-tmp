# Web Viewer — performance budget

Measured from `npm run build` (Vite 6 production, gzip sizes reported by the build):

| Asset | raw | gzip |
| --- | --- | --- |
| App shell JS (`index-*.js`) | 242.89 KB | 76.08 KB |
| App CSS (`index-*.css`) | 12.47 KB | 3.33 KB |
| Evaluator glue JS (`questionnaire_expr_web-*.js`) | 4.89 KB | 1.99 KB |
| Evaluator WASM (`*_bg.wasm`) | 1064.44 KB | 391.85 KB |

Interactive shell (app JS + CSS + glue) ≈ **81 KB gzip**.

## PERF-01 — interactive in < 3s on a 3G connection

- The interactive **shell** (~81 KB gzip) loads well under the 3G budget; first paint and
  the boot logic do not wait on the evaluator.
- The ~392 KB-gzip evaluator WASM is the heaviest asset. As of PERF-01 its load is **kicked
  off before** the session mint and the two run in parallel (`Promise.all([evaluatorPromise,
  mintSession(...)])` in `boot()`), so boot cost ≈ `max(wasm, mint)` rather than their sum.
- On repeat loads the WASM is served from the service-worker cache (WV-F Task 4), so it does
  not re-download.

## Deferred follow-up (F3)

Fully lazy / on-demand evaluator loading (only fetch the WASM once logic is actually needed,
or split it from the boot path entirely) is a deferred optimisation.
