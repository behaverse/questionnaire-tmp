# ED-D4b — Live score preview (design)

**Date:** 2026-06-20 · **Status:** approved (owner, 2026-06-20) · **Stage:** ED-D4b (editor, under `editor/`; touches `web-viewer/`)

## Problem

ED-D's authoring surface is complete (D1 visibility, D2 logic+piping+randomization, D3 validation, D4 scoring builder). The one deferred piece is **live score preview**: in the inline editor preview, `score(id)` always resolves to `null`, so the ScoringPanel can't show computed values and any `show_if` / logic rule / validation condition that references a score is inert. D4b makes scorers actually run in the preview.

It was deferred because the editor preview has no way to *execute* a scorer: scorers are external wasm entities, the web-viewer's scoring engine is internal to the viewer app (not exported from the renderer lib the editor embeds), and the live Library has zero scorer entities seeded. The only runnable scorer that exists is the reference **PHQ-9** wasm in `questionnaire-scorer/dist-wasm/phq9.wasm`.

## Decisions (owner-approved)

1. **Approach B — single-source the scoring engine.** Rather than re-implement scoring in the editor, the **web-viewer exposes its existing scoring engine through a new lib entry**, and the editor reuses it. Justified because the editor preview already builds a viewer-typed `Runtime` and embeds the viewer's `StepRenderer` — calling the viewer's `compileScorers`/`makeScoreCache` is a natural extension, and the editor's `LogicEvaluator`/`ScoreResolver`/`EvalValue`/`Bindings` types are **identical** to the viewer's (`editor/src/logic/types.ts` ≡ `web-viewer/src/logic/types.ts`), so `makeScoreCache` is reused wholesale with the editor's own evaluator — no adapter, no orchestration duplication.
2. **Scoped to bundled scorers.** The editor can only run scorers whose wasm it bundles. Today that's the **reference PHQ-9**. Any other scorer ref degrades **gracefully**: `score(id)` stays `null` and the ScoringPanel shows a per-score "unavailable in preview (no scorer impl bundled)" badge. This is honest and is exactly today's behavior, now labelled.
3. **Bundle the PHQ-9 wasm at build.** A build step copies `questionnaire-scorer/dist-wasm/phq9.wasm` into the editor (gitignored) and emits a manifest with its **build-computed sha256**, so the editor's `impl.sha256` always matches the bundled bytes (the existing `fetchScorerWasm` verifies the hash). No drift against `scr_phq9.json`.
4. **Ship a loadable, self-contained PHQ-9 sample** so the feature is demonstrable and e2e-able. The sample stays **impl-free** (no `impl` on its `scores[]`, matching the canonical model) — the wasm comes from the editor's bundled registry, not the sample.
5. **No change to the editor's `Score` model.** The editor `Score` type stays implementation-free (`{id, scorer, path, name?, description?}`). The `impl` (`{kind:'wasm', url, sha256}`) is attached **only** at preview-projection time, from the editor's bundled registry — it never enters the authored/exported questionnaire.

## Architecture

```
web-viewer (renderer lib build)                 editor (preview)
  NEW lib entry ./scoring  ───────────────────▶ imports compileScorers, makeScoreCache,
   exports compileScorers, makeScoreCache,        fetchScorerWasm, types
   fetchScorerWasm, ScorerSet, ScoreCache,
   PinnedScore, PinnedScorerImpl                 editor scorer registry (scr_phq9 → bundled wasm + sha)
                                                  + fetchImpl serving the bundled bytes
                                                  + project scores[] → Runtime.scores as PinnedScore[]
                                                  + makeScoreCache → resolver into evaluator bindings
                                                  + ScoringPanel reads cache.scorerOutputs()/resolver
```

### Part 1 — web-viewer: export the scoring engine (additive)

- Add a second renderer-lib entry **`@behaverse/questionnaire-renderer/scoring`** (`web-viewer/src/scoring/lib.ts`) re-exporting from `web-viewer/src/scoring/`: `compileScorers`, `makeScoreCache`, `fetchScorerWasm`, and the types `ScorerSet`, `ScoreCache`, `PinnedScore`, `PinnedScorerImpl` (plus a re-export of `EvalValue`/`ScoreResolver`/`Bindings`/`LogicEvaluator`/`AnswerValue` for convenience). The vendored `scorerHost` and `scoredValueFor` ride along in the bundle.
- Extend `web-viewer`'s `build:lib` (Vite lib mode) to emit `dist-lib/scoring.js` alongside `renderer.js`, and add the `./scoring` subpath to `package.json#exports`.
- The existing renderer export (`./renderer`) is **unchanged** — no breaking change. A small export-surface test asserts `dist-lib/scoring.js` (or the `scoring/lib.ts` module) exposes the named functions.

### Part 2 — editor: bundled scorer registry + projection + wiring

- **Build step `editor/scripts/ensure-scorers.mjs`** (chained into `predev`/`prebuild`/`pretest`, beside `ensure-renderer.mjs`): copies `questionnaire-scorer/dist-wasm/phq9.wasm` → gitignored `editor/src/logic/scorers/wasm/phq9.wasm`, computes its sha256, and writes `editor/src/logic/scorers/manifest.json` = `{ "scr_phq9": { "file": "phq9.wasm", "sha256": "<computed>" } }`. If the source wasm is absent, it writes an empty manifest and warns (preview still works; PHQ-9 just shows "unavailable").
- **Registry `editor/src/logic/scorers/registry.ts`**: reads the manifest; `knownScorer(scorerRef): { url, sha256 } | null` (matches on the bare id, e.g. `scr_phq9` from `scr_phq9@v26.0602`); `localScorerFetch(url)` — a `fetchImpl` that returns the bundled wasm bytes for a registry URL (e.g. `local-scorer:scr_phq9`) and 404s otherwise. The wasm asset is imported via Vite `?url` so the bytes are addressable in dev and build.
- **Projection** `editor/src/preview/project.ts`: project `model.scores` into the preview `Runtime.scores` as `PinnedScore[]`, attaching `impl` from the registry for known scorers; **omit** scores whose scorer is unknown from `Runtime.scores` used for compilation but still surface them to the panel as "unavailable" (the panel reads `model.scores`, the registry tells it which are runnable).
- **Wiring** `editor/src/preview/PreviewView.tsx`: build a `ScoreCache` once per (resolved scores set) via `compileScorers(runtime, localScorerFetch)` → `makeScoreCache(set, runtime)`; replace the hardcoded `{ score: () => null }` in `makeBindings` with `cache.resolver`; call `cache.refresh(answers, evaluator)` whenever answers change (the editor already has the evaluator via `useEvaluator`). Compilation is async → until ready (or for unknown scorers) the resolver returns `null` (today's behavior).
- **ScoringPanel** `editor/src/logic/ScoringPanel.tsx`: replace the "computed by the deployed viewer — not shown live" note with, per score row, the **live computed value**, or an **"unavailable in preview"** badge when the scorer isn't in the registry / failed to compile. The preview and the panel sit far apart in the tree (preview pane vs. questionnaire-root Inspector), so they share results through a **small store slice** `previewScores: { values: Record<scoreId, EvalValue>, unavailable: Set<scorerRef> } | null`: the preview owns the `ScoreCache` and, on each `refresh`, publishes the per-score computed values + the unavailable set into the slice; the panel reads it. When the preview pane is **not active** there are no live values → the panel shows a neutral "open the preview to see live scores" hint (and still flags unrunnable scorers as "unavailable" from the registry, which is preview-independent).
- **Loadable PHQ-9 sample** `editor/src/samples/phq9.bundle.json` + a second "Load PHQ-9 sample" affordance on the start screen (or a sample picker): a self-contained `{questionnaire, entities}` bundle with 9 items referencing `pr_phq9_*` + a `scores[]` referencing `scr_phq9@v26.0602` (impl-free).

## Data flow

1. Editor resolves the model + projects a `Runtime` (now including `scores` as `PinnedScore[]` with registry `impl` for known scorers).
2. `compileScorers(runtime, localScorerFetch)` fetches the bundled wasm (sha-verified) + compiles; unknown/failed → recorded in `failures`.
3. On every answer change, `cache.refresh(answers, evaluator)` assembles `{scored_responses:{promptId: scoredValue}}` (reversal via the editor's evaluator) and runs each compiled scorer, caching outputs.
4. `cache.resolver.score(id)` reads `Score.path` (JSON-Pointer) from the cached output → fed into the evaluator `Bindings`, so `show_if`/rules/validation that call `score(id)` go live; the ScoringPanel shows the same values.

## Error handling

- **Unknown scorer (not in registry):** not compiled; `score(id)` → `null`; panel badge "unavailable in preview". (The common case until the Library seeds scorers.)
- **wasm fetch/sha/compile/run failure:** recorded in `failures` / output absent; `score(id)` → `null`; panel badge "unavailable" (optionally with the failure reason in a tooltip). Never throws into the preview.
- **Missing responses:** handed to the scorer as-is (PHQ-9 reports `missing_count`); partial scores still compute.
- **Source wasm absent at build:** empty manifest; everything degrades to "unavailable"; build + preview still succeed.

## Testing

- **web-viewer:** an export test asserting `scoring/lib.ts` exposes `compileScorers`/`makeScoreCache`/`fetchScorerWasm` + types; existing scoring tests stay green; `build:lib` emits `dist-lib/scoring.js`.
- **editor `registry.ts`:** `knownScorer` matches `scr_phq9@…`→impl and returns `null` for unknown; `localScorerFetch` serves bytes for the registry url and 404s otherwise.
- **editor score-runner integration:** with the real bundled `phq9.wasm`, project a PHQ-9 runtime, compile, `refresh` with the 9 answers, assert `resolver.score('phq9_total')` equals the expected total and a severity string; unknown scorer → `null`.
- **editor preview/visibility:** a `show_if`/rule gated on `score(...) >= N` becomes visible once answers push the score past the threshold (proves `score()` is live end-to-end through the evaluator).
- **editor ScoringPanel:** shows the live value for a runnable score; shows the "unavailable" badge for an unknown scorer.
- **e2e:** load the PHQ-9 sample, answer the items, see the live Total in the ScoringPanel (and a score-gated element appear); stub nothing (the wasm is bundled locally). Full `npm run e2e` stays green.
- All existing editor + web-viewer suites stay green; the feature is additive.

## Non-goals

- **No authoring of scorer logic** in the editor (scorers remain external entities).
- **No running of non-bundled / Library scorers** — that needs the Library to serve scorer wasm (separate, owner-gated). The registry is intentionally limited to bundled reference scorers.
- **No change to the exported questionnaire** — `impl` is preview-only; authored `scores[]` stay impl-free.
- **No Schema bump**, no new evaluator/runtime-denormaliser work.
- **No Inspector-tabs consolidation** (tracked separately).

## Risks

- **wasm sha drift:** mitigated by computing the sha from the actually-bundled bytes at build (not trusting `scr_phq9.json`).
- **web-viewer lib surface growth:** one additive entry; the renderer export is untouched; the editor is the only consumer today.
- **Cache lifetime / panel access:** the ScoringPanel and the preview must read the *same* cache; the design lifts the cache to a shared owner (small store slice or context) — kept minimal to avoid leaking the cache across the app.
- **promptId mapping:** reuses the viewer's `buildScoreInputIndex` (answer-key → promptId, via the same renderer key helpers the editor preview already uses), so the editor and viewer map identically.

## Decomposition

One spec → one plan, three natural task groups (each independently testable):
- **D4b·1 — web-viewer scoring lib export** (`./scoring` entry + build + export test). No editor change.
- **D4b·2 — editor scorer registry + bundled wasm + score-runner glue** (`ensure-scorers.mjs`, `registry.ts`, project `scores`→`Runtime`, build the `ScoreCache`). Unit + integration tests run the real PHQ-9 wasm.
- **D4b·3 — wire into PreviewView + ScoringPanel live display + loadable PHQ-9 sample + e2e.** Delivers the visible feature.

Each lands editor-only (and web-viewer-only for D4b·1) to master via the multi-agent isolate-push pattern (see `project_editor_ed_i`).
