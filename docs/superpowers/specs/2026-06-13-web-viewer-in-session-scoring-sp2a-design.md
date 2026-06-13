# Web Viewer In-Session Scoring — Branching Gate (OD-16 SP2a) — Design Spec

**Date drafted:** 2026-06-13
**Author:** OD-16 SP2 brainstorming session (2026-06-13)
**Component:** **Web Viewer** scoring integration (OD-16 sub-project **2a**), with small additions to the **Viewer Service** and **questionnaire-scorer**.
**Target:** `web-viewer/` (the executor + wiring), `viewer-service/` (serve the wasm + mint url-rewrite), `questionnaire-scorer/` (one PHQ-9 leniency tweak + doc). Plus a regenerated stale runtime example. **No schema CalVer bump.**
**Stage:** SP2a of the OD-16 build-out (SP1 engine done; SP2a = branching-gate scoring; SP2b = display + persistence; SP3 = server-side executors).

**Authoritative source documents:**

- **OD-16** `design/05b_scoring.md` — the two-trigger model (§4.4: **branching = always-on at page-submit**; display = `show_score`-gated, SP2b), the external Scorer entity contract, reversed-value pipeline, sentinel-null semantics ("Scorer failure / missing inputs → `null`; LogicRule conditions treat `null` as false").
- **OD-18** `design/05d_runtime.md` — Schema 3 `PinnedScore.impl` (the chosen impl pinned by the denormaliser) and the `scorer_impl_kinds` intersection.
- SP1: `questionnaire-scorer/` — the Scorer ABI v1 (`ABI.md`), the reference `phq9.wasm`, and the browser-safe host `compileScorer`/`runScorer` (`host/src/runScorer.ts`).
- The web-viewer scoring scaffolding (already built, wired to `nullResolver`): `web-viewer/src/logic/{scoring,bindings,types}.ts`, `web-viewer/src/app/{App.tsx,responses.ts,steps.ts}`, the WV-D logic engine (`src/logic/{compile,navigation,validation,visibility,piping}.ts`).
- Schema 3 `schemas/runtime/schema.json` `PinnedScore`/`PinnedScorerImpl`; the **stale** `schemas/runtime/examples/phq9_runtime.json` (pre-OD-15 shape — to be regenerated).
- VS submission/mint: `viewer-service/src/viewer_service/{runtime.py,api/}`.

---

## 0 — Decisions locked in brainstorming (2026-06-13)

1. **Decomposition:** SP2a (branching gate) first; SP2b (display + `scorer_outputs` persistence + `show_score` timing) next; SP3 (http/python/r executors, Library artifact storage) later.
2. **Wasm delivery:** the viewer **fetches `PinnedScorerImpl.url` + verifies `sha256`** (SubtleCrypto); the **Viewer Service serves** the pinned scorer wasm at its own endpoint and **rewrites `impl.url` at mint** to point there.
3. **Input scoping:** the viewer passes `scored_responses` for **all answered prompts**; **scorers select their keys and ignore extras** (PHQ-9 made lenient). No Schema 3 change.
4. **Host reuse:** SP1's `compileScorer`/`runScorer` is **vendored into the web-viewer via a build-copy** (single source of truth stays in SP1).

---

## 1 — The synchronous-resolver constraint (the crux)

`ScoreResolver.score(id)` is called **synchronously** by the evaluator during branching (`nextStepIndex`) and validation (`validateStep`). Fetching/compiling wasm is async. Resolution:

- **Boot (async, once):** in App's existing boot `Promise.all` (which already awaits the evaluator), also fetch + sha256-verify + `compileScorer` **every distinct scorer** referenced by `runtime.scores`, producing a `ScorerSet` (`Map<scorerRef, CompiledScorer>`). By the `ready` phase, all scorers are compiled. A scorer that fails to fetch/compile is recorded as absent (its scores will resolve `null`).
- **Page-submit (sync):** in `advance()`, **before** `validateStep`/`nextStepIndex`, call `refreshScores(answers)` — assemble inputs and run each compiled scorer (`run()` is synchronous), caching outputs.
- **`score(id)` (sync):** look up the `PinnedScore` by id → its scorer's cached output → JSON-Pointer (`path`) → value; any failure → `null`.

This keeps the evaluator's synchronous contract intact while running real wasm scorers. Scorers sharing a ref run **once per refresh**; multiple `PinnedScore`s with different `path`s read the same cached output.

---

## 2 — The ScorerExecutor (`web-viewer/src/scoring/`)

New module, four focused files:

### `vendor/scorerHost.ts` (generated)
A build-copied verbatim copy of `questionnaire-scorer/host/src/runScorer.ts` (+ the `ScorerResult` type it needs), with a `// GENERATED — do not edit; source: questionnaire-scorer/host/src/runScorer.ts` header. Exposes `compileScorer(wasm) → { abiVersion(), run(input) }`. Pure browser APIs (WebAssembly/TextEncoder/DataView) — no `node:` imports. Copied by `scripts/build-scorer-host.mjs` (mirrors `build-evaluator.mjs`); a vitest asserts the vendored copy matches the SP1 source (drift guard).

### `fetch.ts`
`fetchScorerWasm(impl: PinnedScorerImpl, fetchImpl = fetch): Promise<ArrayBuffer>` — `fetch(impl.url)`, `arrayBuffer()`, compute `crypto.subtle.digest('SHA-256', buf)` → hex, compare to `impl.sha256` (throw `ScorerIntegrityError` on mismatch). Only `kind === 'wasm'` is handled (others throw `UnsupportedScorerKind`). An in-module `Map<sha256, ArrayBuffer>` dedups fetches across scores sharing a binary.

### `executor.ts`
- `compileScorers(runtime, fetchImpl?): Promise<ScorerSet>` — for each **distinct** `scorer` ref in `runtime.scores`, fetch+verify+compile; collect failures into `ScorerSet.failures: Map<ref, string>`. Never throws (a bad scorer degrades to null-resolution).
- `assembleInputs(answers, runtime, evaluator): { scored_responses: Record<string, number|string|(number|string)[]> }` — for every answered item, key by **`prompt.id`**, value = `scoredValueFor(option, prompt, answer, evaluator)` (post-reversal). Items without a `prompt.id` or with `null` answers are omitted.
- `makeScoreCache(scorerSet)` → an object with `refresh(answers, runtime, evaluator)` (runs each compiled scorer once on the assembled inputs; stores `output` by scorer ref; on `run()` returning `{ok:false}` or a trap, stores `undefined`) and a `ScoreResolver` whose `score(id)`:
  1. finds `pinned = runtime.scores.find(s => s.id === id)`; if none → `null`;
  2. `output = cache[pinned.scorer]`; if `undefined` → `null`;
  3. resolve the JSON Pointer `pinned.path` against `output` (a tiny RFC-6901 resolver — handle `/total`, `/band/label`, `~0`/`~1` escapes); missing → `null`;
  4. coerce to `EvalValue` (number/string/boolean/array) or `null`.

### `types.ts`
`PinnedScorerImpl` (`{kind:'wasm', url, sha256} | {kind:'http', url} | …`), `PinnedScore` (`{id, scorer, path, impl, name?}`), `ScorerSet`. The web-viewer renderer `Runtime.scores` is retyped from `unknown[]` to `PinnedScore[]`.

---

## 3 — Wiring into `App.tsx`

- **Boot:** alongside `loadEvaluator()`, call `compileScorers(runtime, fetchImpl)`; store the `ScorerSet` + the `ScoreCache` on the `Pipeline`. Replace `resolver: nullResolver` with the cache's `ScoreResolver`. (The fixture boot path uses the same, with `fetchImpl` injectable for tests; fixtures with no `scores[]` get an empty set → identical to today.)
- **Page-submit:** in `advance()`, after the per-item rows are built but **before** `nextStepIndex(...)`, call `pipeline.cache.refresh(s.answers, runtime, evaluator)` so branching/validation see fresh scores. (Validation already receives `p.resolver.score`; it now returns real values.)
- **Failure handling:** all failures (no scorer, run error, missing path) resolve `null` → the evaluator treats branching conditions as false (sentinel semantics). No exceptions reach the render loop. Optionally emit a `bdm:` system event on scorer failure (nice-to-have; not required for SP2a).

No change to navigation/resume/submission semantics; the only behavioural change is that score-gated branches can now fire.

---

## 4 — Viewer Service: serve the wasm + rewrite at mint

- **Endpoint** `GET /v1/scorers/{ref}.wasm` (`ref` = the CalVer-pinned scorer ref, e.g. `scr_phq9@v26.0602`) → streams the bytes from a **configured scorer store**: a directory + a `ref → filename` map (env/config). SP2a config points `scr_phq9@*` at `questionnaire-scorer/dist-wasm/phq9.wasm`. Response `Content-Type: application/wasm`, cacheable, CORS-enabled (reuse `VS_CORS_ORIGINS`). 404 if the ref is unknown.
- **Mint rewrite:** in `mint_runtime`, **after `denormalise` and before the cache store**, for each `runtime.scores[].impl` with `kind === 'wasm'`, rewrite `url` → `{VS_PUBLIC_BASE}/v1/scorers/{ref}.wasm` (keep `sha256`). So the **cached** runtime already carries the VS url. `VS_PUBLIC_BASE` is stable deployment config and is **not** part of the 5-tuple cache key (a base change would require a cache purge — acceptable and noted). Only `wasm` kinds the store can serve are rewritten; others pass through untouched.
- **Note (follow-up):** real artifact storage belongs in the Library (a `GET /v1/scorers/{id}/versions/{v}/impl.wasm`); SP2a uses the VS-local store to stay viewer-focused. Logged in `viewer-service/FOLLOWUPS.md`.

---

## 5 — questionnaire-scorer: lenient PHQ-9 + convention

- Change `score_phq9` to **ignore unexpected keys** in `scored_responses` (select `pr_phq9_1..9`; absent → `missing_count`; **no longer error on extras**). It still rejects out-of-range/non-integer values for *its* keys.
- Flip the Rust test `rejects_unexpected_key` → `ignores_unexpected_key` (asserts a `bogus` key is ignored and scoring proceeds).
- Rebuild `phq9.wasm` (the sha256 changes → the build script re-syncs `scr_phq9.json` + the conformance test still passes; the committed binary updates).
- Document the convention in `questionnaire-scorer/ABI.md` (a "Conformance / input handling" note: *a scorer MUST ignore `scored_responses` keys it does not recognise; the host passes all answered prompts*).

---

## 6 — Runtime fidelity + fixtures

- **Type** `Runtime.scores` as `PinnedScore[]` in `web-viewer/src/renderer/types.ts`; add `id?`/`reversed?` to the runtime prompt type (already accessed via cast in `responses.ts`).
- **Verify** the denormaliser faithfully carries `prompt.id` and `prompt.reversed` into Schema 3 (it is a faithful projection; if either is dropped, fix the denormaliser — additive, no schema bump — and add a denormaliser test). This is a **verification step that may produce a small denormaliser change**; called out, not assumed.
- **Regenerate** the stale `schemas/runtime/examples/phq9_runtime.json` to the real current Schema 3 shape (prompt `id = pr_phq9_*`, `option.options[]`, `content.<locale>.text`), with a branching `logic` rule and the three `phq9_*` scores — so it is a valid, runnable example.
- **Add web-viewer fixtures** (`src/fixtures/`): a PHQ-9 runtime (9 `pr_phq9_*` items + the 3 scores) and a **branching** fixture (a `LogicRule` like `score('phq9_total') >= 10 → branch to page X`), plus a reversed-item case to exercise `scoredValueFor` in `assembleInputs`. Used by both unit tests and the dev viewer (`?fixture=`).

---

## 7 — Testing & verification

- **web-viewer unit (vitest):**
  - `fetch.test.ts` — good fetch resolves; tampered bytes → `ScorerIntegrityError`; non-wasm kind → `UnsupportedScorerKind` (inject `fetchImpl`).
  - `executor.test.ts` — `assembleInputs` keys by prompt.id + applies reversal; `refresh` runs each scorer once even with multiple paths; `ScoreResolver.score` resolves `/total`, `/severity`, `/band/label`, returns `null` for an unknown id / missing path / failed scorer; drives a real `nextStepIndex` branch. Uses the **built** `phq9.wasm` via the vendored host (the `pretest`/build provides it).
  - `vendor.test.ts` — the vendored host byte-matches the SP1 source (drift guard).
  - All **existing web-viewer tests stay green** (fixtures without `scores[]` behave as before).
- **questionnaire-scorer:** the flipped Rust test + the conformance test still green; the rebuilt wasm's sha256 re-synced.
- **viewer-service (pytest):** `GET /v1/scorers/{ref}.wasm` serves bytes / 404s unknown; mint rewrites wasm `impl.url` to the VS endpoint (sha256 preserved).
- **Live smoke:** deploy a PHQ-9-with-branching questionnaire through the real Library→denormaliser→VS→viewer stack; complete it in chromium; confirm the viewer fetches the VS-served wasm (sha256 verified), computes `phq9_total`, and **takes the score-gated branch** (and the non-branch path when the score is low). Record it (the established show-don't-tell pattern).

---

## 8 — Out of scope → SP2b / SP3

- **SP2b:** in-session score **display** (the `show_score` / `show_score_live` timing, terminal-vs-live), **Schema 6 `scorer_outputs`** assembly + a new VS persistence endpoint, the em-dash rendering of sentinel-null scores, per-item `score`/`correct` already handled by WV-D.
- **SP3:** `http`/`python`/`r` executors, **Library** scorer-artifact storage/serving (replacing the VS-local store), conformance-at-publish gate.

---

## 9 — Constraints

- **No schema CalVer bump** (per the locked decisions); runtime fidelity is faithful-projection + typing only.
- **Pure-additive viewer behaviour:** the only observable change is that score-gated branches/validation now evaluate real scores; linear and no-score questionnaires are unchanged.
- **Graceful degradation:** every scorer failure path resolves to the design's sentinel `null`; the viewer never crashes on a bad/absent/slow scorer.
- **Keep the web-viewer test suite green**; keep `npm run build`/`build:lib` clean; the vendored host stays in sync with SP1 (drift test).
- **Cross-viewer/OD-16 fidelity:** scoring uses the SP1 ABI + the same `scoredValueFor` reversal already shipped; no divergence from the canonical scorer semantics.
