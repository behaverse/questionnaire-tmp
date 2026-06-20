# Harvester: authored descriptions (SP2)

**Date:** 2026-06-20
**Status:** approved (brainstorming)
**Scope:** replace every questionnaire's canonical `description` with an **original, two-sentence house-format** description authored from facts (not the site's copyrighted copy). A durable override store + apply mechanism (survives re-harvest), an originality/copyright guard, batched generation of all 158, then rollout (apply + regenerate review/scoring).
**Builds on SP1** (source_metadata capture + `x_description_source: "site_meta"`).

## Problem

The canonical `description` is currently the source site's copy (psychology-tools SEO meta `x_description_source: "site_meta"`; psytoolkit scraped). The owner wants our own original descriptions. Structured `classification` is too sparse to template (domain populated for 2/158), so descriptions must be **authored** (LLM) from the reliable facts (title, acronym, item count, response type, keywords) + the SP1-captured Introduction **as a factual reference only** + the instrument's known purpose.

## Decisions (owner-approved)

- **Scope: all 158** (uniform house style; also replaces psytoolkit scraped descriptions).
- **Format: two sentences** — *"The {Name} ({ACRONYM}) is a {N}-item {self-report/clinician-/parent-rated} {measure/screening tool/questionnaire} {assessing/screening for} {construct}. It is used to {purpose}."* — factual, **original wording**, no copied phrasing.
- **Durable override store:** `questionnaire-harvester/descriptions/<id>.md` (one file = the authored description text). Source of truth; survives re-harvest. Original scraped text remains preserved in SP1's `source_metadata/`.
- **`x_description_source` becomes `"authored"`** when an override exists (wins over `"site_meta"`).
- **Originality guard** gates generation (no long verbatim overlap with the captured source text).
- Out of scope: any schema change; an LLM call in the per-harvest pipeline (generation is one-time/batched, not in-pipeline); authoring beyond the two-sentence description (keywords/intro already handled by SP1).

## Architecture

### Override store + mechanism (`descriptions.py`)
- `load_authored(descriptions_dir) -> {id: text}` — reads `descriptions/<id>.md` (stripped; empties skipped).
- `apply_authored_description(rq, descriptions_dir) -> bool` — if `<id>.md` exists, set `rq.description = text` and `rq.description_source = "authored"`; return whether applied.
- `apply_descriptions_to_output(out_dir, descriptions_dir) -> list[str]` — bulk in-place patch: for each `output/questionnaires/*.json` whose id has an override, set `metadata.description` + `metadata.x_description_source = "authored"` and rewrite via the canonical `write_entity(out_dir, "questionnaire", q)` (identical `sort_keys=True, indent=2`, no trailing newline → minimal diff). Returns ids patched. **No re-fetch.**
- `RawQuestionnaire` gains `description_source: str | None = None`.
- `draft` emits `x_description_source` from the override first: `if rq.description_source: md["x_description_source"] = rq.description_source` `elif rq.source_meta: "site_meta"`.
- `cli` harvest gains `--descriptions` (default `questionnaire-harvester/descriptions`) and calls `apply_authored_description(rq, ...)` after the `--id` override (so a re-harvest keeps the authored description — durability). A new `apply-descriptions` subcommand runs `apply_descriptions_to_output`.

### Originality / copyright guard (`check-descriptions`)
`check_descriptions(out_dir, descriptions_dir, source_meta_dir) -> list[dict]` flags, per authored description:
- **verbatim overlap**: shares any run of **≥ 8 consecutive words** (lowercased, alphanumeric tokens) with that id's `source_metadata` `introduction` (joined) or `meta_description` → copyright risk.
- **shape**: empty, or > 400 chars, or no sentence period, or missing the acronym (`short_title`, case-insensitive).
Returns `[{id, issues:[...]}]`. CLI `check-descriptions` prints flagged + returns non-zero when any flagged.

### Generation (all 158, controller-orchestrated batched subagents)
Batches of ids; each subagent, per id, reads the facts from `output/questionnaires/<id>.json` (title, short_title, item_count, the first option's `input_data_type`/`measurement_type`) + `output/options` anchors + `source_metadata/<id>.json` (keywords + introduction, as **factual reference only**) + its own knowledge, and writes `descriptions/<id>.md` — two sentences, house format, **original wording (never copy a run from the introduction)**. After each batch, `check-descriptions` must pass; flagged ids are regenerated. Owner reviews via the regenerated review export.

### Rollout
`apply-descriptions` → all 158 canonical descriptions become authored + `x_description_source: "authored"`; regenerate `import_review/` + `scoring/`; tree validates at v26.0618.

## Components & boundaries

| Unit | Responsibility |
|---|---|
| `descriptions.py` (`load_authored`, `apply_authored_description`, `apply_descriptions_to_output`, `check_descriptions`) | override store IO + apply + bulk patch + originality guard (pure-ish; reuses `write_entity`) |
| `raw.py` | `RawQuestionnaire.description_source` field |
| `draft.py` | emit `x_description_source` (authored wins over site_meta) |
| `cli.py` | `--descriptions` on harvest + `apply-descriptions` + `check-descriptions` subcommands |
| `descriptions/<id>.md` (data) | the authored override store (158 files) |

No schema change (`x_description_source`/`x_keywords` are `^x_` metadata extensions; `descriptions/` is a tracked sidecar, not validated).

## Testing (TDD)

- **`load_authored`/`apply_authored_description`:** dir with `<id>.md` → map; `apply_*` sets `rq.description` + `rq.description_source="authored"` and returns True; missing → returns False, unchanged; missing dir → `{}`.
- **`draft`:** `description_source="authored"` → `x_description_source=="authored"`; only `source_meta` → `"site_meta"`; both → `"authored"`.
- **`apply_descriptions_to_output`:** a tmp output tree (canonical written via `write_entity`) + a `descriptions/<id>.md` → after apply, the JSON's `metadata.description` == authored, `x_description_source=="authored"`, and a questionnaire with NO override is byte-identical (untouched).
- **`check_descriptions`:** a description copying an 8-word run from the source introduction → flagged `verbatim overlap`; an over-long/period-less/acronym-missing one → flagged shape; a clean original → no issues.
- **CLI:** `apply-descriptions --out <tmp>` patches + reports; `check-descriptions` returns non-zero on a planted overlap.
- **harvest durability (integration):** with a `descriptions/<id>.md` present, harvesting that id yields canonical `description` == authored + `x_description_source=="authored"` (not the scraped meta).
- **Generation acceptance:** `check-descriptions` passes for all 158; spot-review a sample (an instrument you know, an obscure one, a two-dimension one) for accuracy + house format.
- **Rollout:** after `apply-descriptions`, all 158 have `x_description_source=="authored"`; review export shows the authored text (no `site_meta` note remains); tree validates.
- Existing harvester suite stays green.

## Risks

- **Multi-agent shared checkout** — isolated worktree `.claude/worktrees/harvester-descriptions`, branch `harvester-authored-descriptions-0620`; commit on HEAD only (verify branch+parent before/after each commit); ALL edits under the worktree; never checkout/reset/switch or `cd` elsewhere; do not use the cheapest model tier; edit gitignored `HANDOFF.md` on disk only. At final integration merge `origin/master` INTO this branch inside the worktree and fast-forward-push.
- **Copyright (the whole point):** the originality guard blocks verbatim overlap with the captured source; authored text is original. The scraped original stays only in `source_metadata/` (SP1).
- **Durability:** the override is applied both in the harvest path (future re-harvests) and via `apply-descriptions` (bulk now) — re-harvest never reverts to SEO copy.
- **Serialization fidelity:** the bulk patch reuses `write_entity` (`sort_keys=True, indent=2`, no trailing newline) so only the two changed fields diff.
- **Accuracy of generated text:** factual, conservative wording; the rater/purpose qualifiers are omitted when unknown rather than guessed; owner reviews. Generation never invents psychometric claims (cut-offs, validity stats).
