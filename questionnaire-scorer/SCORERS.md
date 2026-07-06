# Data-driven Scorers (engine + specs)

Most questionnaire scorers are the same shape: **sum a set of items (optionally per-subscale),
optionally transform linearly, then assign a severity band**. Rather than hand-write a Rust
module per instrument (see `scorers/phq9/` for the bespoke reference), these are authored as a
small **declarative spec** and compiled by a shared engine.

- `engine/` — `scorer-engine`: the reusable scoring logic (`fn score(spec_json, input)`).
  Covers sum / mean aggregation, per-subscale item sets, a linear `transform` (`mul`/`add`),
  per-item range validation, severity `bands`, and `missing_count`. Reverse-keyed items are
  **not** handled here — the host applies reversal before scoring (OD-16), so `scored_responses`
  already carry final per-item values.
- `specs/<id>.json` — the authoring file for one instrument (the only thing you write).
- `scripts/build-scorer.mjs <id>` — generates the thin crate `scorers/<id>/` (embeds the spec,
  calls the engine), builds it to `dist-wasm/<id>.wasm`, derives the Scorer entity
  `dist-entities/scr_<id>.json` (inputs + output_schema + impl sha256 + test_cases), and runs the
  conformance runner. Exit 0 iff conformant.

## Output envelope

```json
{ "scores": { "<key>": { "value": N, "severity": "...", "band": { "min": …, "max": …, "label": "…" } } },
  "missing_count": M }
```
`severity`/`band` appear only when the score defines `bands` and one matches `value`.

## Authoring spec format

```json
{
  "id": "gad7",
  "scorer_id": "scr_gad7",
  "name": "GAD-7 Standard Scoring",
  "status": "validated",
  "description": "… how the score is computed + interpreted …",
  "publication": { "citation": "…", "year": 2006 },
  "engine_spec": {
    "item_range": [0, 3],
    "scores": [
      { "key": "total",
        "items": ["pr_gad7_1", "…", "pr_gad7_7"],
        "aggregate": "sum",                 // "sum" (default) | "mean"
        "transform": { "mul": 1, "add": 0 },// optional linear transform of the aggregate
        "bands": [ { "min": 0, "max": 4, "severity": "minimal", "label": "Minimal anxiety" } ] }
    ]
  },
  "test_cases": [ { "name": "…", "input": { "scored_responses": { … } }, "expected": { … } } ]
}
```

`items` MUST be the real prompt ids from the harvested questionnaire (the host keys
`scored_responses` by bare prompt id). For subscale instruments, add one `scores[]` entry per
subscale. Multi-form transforms: WHO-5 uses `transform.mul = 4`; DASS-21 subscales use `mul = 2`.

## Add a scorer

1. Find the real prompt ids + the option's encoded values:
   `output/questionnaires/qst_<id>.json` → element `question.prompt.ref`; `output/options/<ref>.json` → `options[].value`.
2. Source the scoring rules (items per subscale, reverse — host-applied, cut-offs/bands, any transform)
   from the instrument manual / `questionnaire-harvester/scoring/<id>.md` (the `needs-research` checklist).
3. Write `specs/<id>.json` with `engine_spec` + `test_cases` (hand-compute the expected output).
4. `node scripts/build-scorer.mjs <id>` → must print `CONFORMANT`.

## Validated scorers so far

| id | shape | source |
|---|---|---|
| `phq9` | bespoke Rust (reference) | Kroenke et al. 2001 |
| `gad7` | sum + 4 bands | Spitzer et al. 2006 |
| `swls` | sum + 7 bands | Diener et al. 1985 |
| `who5` | sum × 4 + bands | Topp et al. 2015 |
| `dass21` | 3 subscales × 2 + per-subscale bands | Lovibond & Lovibond 1995 |

> The table shows illustrative scorer shapes; the true total is 149 specs + 9 bespoke = 158.

## Wired vertical slice (done)

All 158 scorers are wired end-to-end (each qst_* declares scores[]; entities in output/scorers/) and live:
- each `qst_<id>.json` declares `scores[]: { id, scorer, path }` (OD-16; JSON-Pointer into the
  scorer output, e.g. `/scores/total/value`), referencing `scr_<id>@v26.0618`;
- the Scorer entities live in `questionnaire-harvester/output/scorers/scr_<id>.json` (ingested
  with the harvested tree; the denormaliser's `pin_scorers` resolves them and embeds the impl);
- `node scripts/verify-slice.mjs` runs each real wasm on a sample response set and resolves every
  declared path (the local end-to-end proof).

## Going live (deploy)

1. **Library:** re-seed so the questionnaires carry `scores[]` and the `scr_*` entities exist
   (adding `scores[]` changes content → `ImmutabilityError` on a plain re-ingest, so use the
   delete-then-ingest reseed: `scripts/reseed_classification.py` already deletes questionnaire
   entities + re-ingests the harvested tree, which now includes `output/scorers/`).
2. **Viewer-service:** the VS already bundles `questionnaire-scorer/dist-wasm` (see
   `viewer-service/vercel.json` `includeFiles`) and serves `/v1/scorers/{ref}/impl.wasm`. Set two
   env vars and redeploy the VS:
   - `VS_SCORER_MAP` = contents of `scorer_map.json` (maps `scr_<id>@v26.0618` → `<id>.wasm`,
     since the wasm files are named by id, not by the versioned ref);
   - `VS_PUBLIC_BASE` = the VS public URL (so `rewrite_scorer_urls` points impls at the VS).
   The web-viewer already fetches + sha256-verifies the wasm and displays scores (SP2a/SP2b).

## Coverage

All 158 harvested instruments are scored + live (149 spec-driven + 9 bespoke crates). 0 remain. Instruments needing
non-linear / lookup-table scoring (e.g. MBTI-type categorical) still want a bespoke crate.
