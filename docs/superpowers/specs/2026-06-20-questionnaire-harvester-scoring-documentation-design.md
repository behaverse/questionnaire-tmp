# Harvester: scoring documentation (faithful descriptor + research pointers)

**Date:** 2026-06-20
**Status:** approved (brainstorming)
**Scope:** a new harvester module + `document-scoring` CLI command that reads the harvested canonical JSON and writes a `scoring/<id>.md` sidecar per questionnaire — a faithful, machine-readable + human-readable descriptor of the *known* scoring structure, with the un-sourced parts (aggregation, cut-offs) flagged `needs-research`. Sets up the later `scr_*` Scorer-authoring stage. NO change to harvest, the canonical entities, or the schema.

## Problem & rationale

The owner wants each questionnaire's scoring documented so the computations can be reimplemented later as canonical `Scorer` entities (`scr_*`; see the reference `scr_phq9` + `questionnaire-scorer/`). But the harvested sources do **not** contain the scoring computation:
- psychology-tools.com has no on-page scoring prose — scoring is server-side (`POST /test/<slug>/score`).
- PsyToolkit doesn't structure it either.

What the harvester *does* faithfully capture is the raw material: per-item weights in `option.values`, `reversed` flags on prompts, parsed `dimension`s (e.g. Liebowitz fear/avoidance), and any `scl_*` subscale refs. So the faithful, automatable deliverable is a **descriptor of what we know + a research checklist for what we don't** — not a reverse-engineered or invented formula (rejected approaches B/C in brainstorming).

## Decisions (owner-approved)

- **Sidecar only.** Write `scoring/<id>.md` (mirroring the existing `questions/<id>.md`); the canonical questionnaire JSON is left untouched (it will later carry real `scores[]`/`scr_*` references, not provisional stubs).
- **Prose + structured block.** Each doc has a machine-readable structured block **plus** a human-readable summary.
- **Structured block = a fenced ` ```json ` block** at the top of the `.md` (stdlib `json`; PyYAML is importable but NOT a declared harvester dependency — deps are `beautifulsoup4`+`httpx` — and `questions/*.md` uses plain markdown, so we add no dependency and no YAML frontmatter).
- **`status: needs-research` always** — we never invent the aggregation/cut-offs.
- **Source-agnostic, idempotent.** Reads `output/`, regenerates all docs; a `--id` flag regenerates one.

## Faithful descriptor (derived from canonical JSON only)

For each questionnaire, resolve its page elements + referenced `options`/`prompts` from `output/` and derive:
- `item_count` (number of elements).
- `dimensions`: sorted distinct `option.dimension` across items (e.g. `["avoidance","fear"]`, or `["rating"]`).
- `option_scales`: one entry per distinct option ref, each `{ref, dimension, measurement_type, levels, values, value_range:[min,max], anchors}` (anchors from `content.en.options[].text`; values from structural `options[].value`).
- `reversed_items`: prompt ids with `reversed: true`.
- `subscales`: sorted distinct `scl_*` refs found on prompts (usually none for harvested data).
- `uniform_scale`: `true` iff every item references the same single option scale.
- `per_item`: ordered list of `{index, prompt_id, prompt_snippet (<=80 chars), dimension, values, reversed}`.
- Provenance: `title`, `short_title`, `source_url`, `publication` (`{citation, year}` or null), instrument acronym if derivable.

**Explicitly NOT derived (left null, listed as the research checklist):**
- `aggregation` (sum / mean / weighted / per-subscale) — not in source.
- `subscale_definitions` (item→subscale membership) beyond any parsed `scl_*` refs.
- `cutoffs` (severity bands / interpretation thresholds).
- `notes`.

Reverse scoring: we record *which* items are `reversed` (faithful); the transform itself (max−value) is a viewer concern and is noted in prose, not invented into a formula here.

## `scoring/<id>.md` layout

````markdown
# Scoring — <title> (`<id>`)

> **status: needs-research.** Derived structure below is faithful to the harvested data.
> The aggregation formula, subscale membership, and cut-offs are NOT in the source and
> must be sourced from the instrument manual/literature before authoring a `scr_*` Scorer.

```json
{ "id": "...", "title": "...", "source_url": "...", "publication": {...}|null,
  "status": "needs-research", "item_count": N, "dimensions": [...],
  "option_scales": [ {"ref":"...","dimension":"...","levels":4,"values":[0,1,2,3],
                      "value_range":[0,3],"anchors":[...]} ],
  "reversed_items": [...], "subscales": [...], "uniform_scale": true|false,
  "per_item": [ {"index":1,"prompt_id":"...","prompt_snippet":"...","dimension":"...",
                 "values":[...],"reversed":false} ],
  "to_research": { "aggregation": null, "subscale_definitions": null,
                   "cutoffs": null, "notes": null } }
```

## Known structure
- Items: N; scales: <uniform 0–3 / two dimensions: fear, avoidance / …>; reversed: <none / list>.

## Per-item
| # | item | dimension | weights | reversed |
|---|------|-----------|---------|----------|
| 1 | … | … | 0,1,2,3 | no |

## To research (fill from <source_url> / manual)
- [ ] Aggregation: how is the total computed? (sum / mean / per-subscale)
- [ ] Subscales: item membership + names.
- [ ] Cut-offs / severity bands.
````

## Components & boundaries

| Unit (`questionnaire-harvester/src/harvester/scoring_doc.py`) | Responsibility | Depends on |
|---|---|---|
| `load_entities(out_dir) -> dict` | id→json maps for `options`, `prompts` | stdlib `json`, `pathlib` |
| `derive_scoring(qst, options_by_id, prompts_by_id) -> dict` | pure faithful descriptor (the JSON object above) | — |
| `render_scoring_md(descriptor) -> str` | fenced-json block + prose + per-item table + checklist | stdlib `json` |
| `write_scoring_docs(out_dir, scoring_dir, only_id=None) -> list[str]` | resolve + derive + render + write `scoring/<id>.md`; returns ids written | the three above |
| `cli.py` `document-scoring` subparser | `--out` (default `questionnaire-harvester/output`), `--scoring` (default `questionnaire-harvester/scoring`), `--id` | `write_scoring_docs` |

`derive_scoring` and `render_scoring_md` are pure (no I/O) → unit-testable in isolation. Existing harvest/draft/validate code is untouched.

## Testing (TDD, synthetic fixtures)

- **`derive_scoring`:**
  - uniform single-scale questionnaire (e.g. 3 items, one 0–2 option) → `item_count==3`, `dimensions==["rating"]`, one `option_scales` entry with `values`/`anchors`/`value_range`, `uniform_scale is True`, `reversed_items==[]`, `per_item` length 3.
  - two-dimension questionnaire (fear/avoidance, distinct scales) → `dimensions==["avoidance","fear"]`, two `option_scales`, `uniform_scale is False`.
  - a reversed item → appears in `reversed_items` and its `per_item` entry `reversed is True`.
  - a prompt carrying `subscales:["scl_x"]` → `subscales==["scl_x"]`.
  - `to_research` always `{aggregation:null, subscale_definitions:null, cutoffs:null, notes:null}`; `status=="needs-research"`.
- **`render_scoring_md`:** the fenced ` ```json ` block round-trips via `json.loads` to the descriptor; the markdown contains the per-item table, the `source_url`, the words `needs-research`, and the three "To research" checkboxes.
- **Integration (`document-scoring`):**
  - `--id qst_lsas` over the real `output/` → `scoring/qst_lsas.md` exists; its json block has `dimensions==["avoidance","fear"]`, `item_count==48`, two `option_scales`, `uniform_scale False`.
  - a uniform real scale (`--id qst_gad7` or similar) → `uniform_scale True`, single scale `values==[0,1,2,3]`.
- **Full sweep:** `document-scoring` (no `--id`) → writes 158 docs; report count; spot-check PHQ-9 / LSAS / a reversed-item scale; every json block parses.
- Existing harvester suite stays green; nothing else changes.

## Scope / out of scope

- **In:** `scoring_doc.py` + `document-scoring` command + `scoring/<id>.md` for all 158 (structured + prose from canonical JSON).
- **Out:** the actual formulas/cut-offs (`needs-research`); executable `scr_*` Scorer authoring (the later stage this enables); `/score` endpoint probing; any schema or canonical-JSON change; new runtime dependency.

## Risks

- **Multi-agent shared checkout** — isolated worktree `.claude/worktrees/harvester-scoring`, branch `harvester-scoring-doc-0620`; commit on HEAD only (verify branch+parent before/after each commit); ALL edits under the worktree; never checkout/reset/switch or `cd` elsewhere; do not use the cheapest model tier; edit the gitignored `HANDOFF.md` on disk only. At final integration merge `origin/master` INTO this branch inside the worktree and fast-forward-push (a concurrent editor agent holds the main dir).
- **Dangling refs in output** — if a questionnaire references an option/prompt missing on disk, `derive_scoring` records the ref with empty/derived fields and a `notes` flag rather than crashing; the sweep reports any such cases (it does not silently drop them).
- **Faithfulness** — the descriptor derives only from canonical data; all interpretive fields stay null under `to_research`; `status` is always `needs-research`. No fabrication.
- **`scoring/` is tracked staging** (like `questions/`) — owner-reviewable; not promoted to the Library automatically.
