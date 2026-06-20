# Harvester: import review aid (readable export + checklist)

**Date:** 2026-06-20
**Status:** approved (brainstorming)
**Scope:** a `review-export` CLI command that reads the harvested canonical JSON and writes `questionnaire-harvester/import_review/` — a `README.md` review checklist (one box per questionnaire, grouped by source site, with a link to the readable export + a link to the original page) and a human-readable `<id>.md` render per questionnaire (refs resolved to text) for side-by-side comparison with the source. NO change to harvest, the canonical entities, or the schema.

## Problem

The owner wants to review each imported questionnaire against its original source. The canonical JSON is ref-based (prompts/options/instructions/contexts referenced by id), so it's hard to read directly. We need: (1) a single checklist to track review progress across all 158 questionnaires, and (2) a readable transcript per questionnaire with the original link, so the two can be opened side by side.

This is a third per-questionnaire renderer alongside the existing `questions/<id>.md` and `scoring/<id>.md`. It reuses the entity-loading approach from `scoring_doc.py`.

## Decisions (owner-approved)

- Output folder: **`questionnaire-harvester/import_review/`** (consistent with `questions/`, `scoring/`).
- **Idempotent command** `review-export` (regenerates all; `--id` re-renders one but always rewrites the full `README.md`).
- **Faithful reformatting only** — resolves refs to their stored text and lays it out; no interpretation, no edits to canonical data. Instruction/context text is rendered **verbatim** (incl. any literal HTML), so the review surfaces import artifacts.
- `import_review/` is **tracked staging** (like `questions/`/`scoring/`); owner-reviewable.

## Canonical field paths (verified)

- questionnaire `metadata`: `id`, `title`, `short_title`, `x_source_url` (the original link), `x_source_site`, `license`, `publication?` (`{citation, year}`).
- `pages[0].elements[]`: `{option:{ref}, question:{prompt:{ref}, instruction?:{ref}, context?:{ref}}, required}`.
- option: `dimension`, `input_data_type` (`choice`|`number`|`text`), structural `options[]`=`[{index,value}]`, `content.en.options[]`=`[{index,text}]`; number options carry `min`/`max`/`step`/`min_label`/`max_label`/`center_label`/`initial_value`.
- prompt: `content.en.text`; optional `reversed`.
- instruction / context: `content.en.text`.
- refs carry `@vYY.MMDD` → strip with `split("@",1)[0]`.
- Source sites present: `psytoolkit.org` (117), `psychology-tools.com` (40), `phqscreeners.com` (1) = 158.

## Output

### `import_review/README.md` (the checklist)
Grouped by `x_source_site` (sorted; count per group), each questionnaire one checkbox, sorted by id:
```markdown
# Import review

Tick each box after reviewing the imported questionnaire against its original.

## psychology-tools.com (40)
- [ ] [Liebowitz Social Anxiety Scale (`qst_lsas`)](qst_lsas.md) — [original](https://psychology-tools.com/test/liebowitz-social-anxiety-scale)
...
## psytoolkit.org (117)
- [ ] [GAD-7 (`qst_gad7`)](qst_gad7.md) — [original](https://www.psytoolkit.org/survey-library/anxiety-gad7.html)
```
Link text = `<short_title or title> (\`id\`)`; first link → the readable export; "original" → `x_source_url`.

### `import_review/<id>.md` (readable render)
```markdown
# <title> (`<id>`)

**Original:** <x_source_url>

- short_title: <short_title>
- source: <x_source_site>
- license: <license>
- publication: <citation> (<year>)        ← omitted if absent
- items: <N>

## Instructions
<resolved instruction text(s), verbatim>     ← section omitted if none

## Context
<resolved context text(s), verbatim>          ← section omitted if none

## Items
1. **<prompt text>**  _(dimension: rating)_ _(reversed)_
   - 1. None (0) · 2. Mild (1) · 3. Moderate (2) · 4. Severe (3)
2. **<prompt text>**
   - number 1–7 (step 1): "not at all" … "very much"   ← slider/number rendering
...
```
- **Choice** option → `index. anchor (value)` joined by ` · ` (zip anchors with values by index; if an anchor is blank, show just `(value)`).
- **Number/slider** option → `number <min>–<max> (step <step>): "<min_label>" … "<max_label>"` (+ ` · center "<center_label>"` and ` · initial <initial_value>` when present).
- **Instructions/Context**: collect the distinct resolved texts across the questionnaire's elements (usually one each) and render each once.
- Whole-number floats render as ints (`0.0` → `0`).
- A missing referenced entity renders as `‹missing <ref>›` (visible, never crashes).

## Components (`questionnaire-harvester/src/harvester/review_export.py`, pure where possible)

| Unit | Responsibility | Depends on |
|---|---|---|
| `load_entities(out_dir, subdirs=("options","prompts","instructions","contexts")) -> dict` | id→json maps per subdir | stdlib `json`/`pathlib` |
| `render_option(opt) -> str` | one option → readable choice/number line | — |
| `render_questionnaire_md(qst, entities) -> str` | full readable render (original link + meta + instr/context + items) | `render_option` |
| `index_entry(qst) -> dict` | `{id,title,short_title,source_url,source_site}` for the checklist | — |
| `render_index_md(entries) -> str` | grouped-by-site checkbox list | — |
| `write_review_export(out_dir, review_dir, only_id=None) -> list[str]` | scan all questionnaires → write `README.md` (full index, always) + `<id>.md` (for `only_id` or all); returns doc ids written | the above |
| `cli.py` `review-export` subparser | `--out` (default `questionnaire-harvester/output`), `--review-dir` (default `questionnaire-harvester/import_review`), `--id` | `write_review_export` |

`render_*` are pure (no I/O) → unit-testable. Existing modules are untouched (this does not import or change `scoring_doc.py`; it has its own `load_entities` covering four subdirs).

## Testing (TDD, synthetic fixtures)

- **`render_option`:** a choice option (values `[0,1,2,3]`, anchors `[None,Mild,Moderate,Severe]`) → `1. None (0) · … · 4. Severe (3)`; a number option (min 1, max 7, step 1, labels) → `number 1–7 (step 1): "not at all" … "very much"`; a blank-anchor choice → `(value)` only.
- **`render_questionnaire_md`:** synthetic qst + resolved entities → contains `**Original:** <url>`, the item prompt text, the rendered option line, a `(reversed)` marker for a reversed item, the dimension, and the resolved instruction text; a missing option ref renders `‹missing …›` and does not crash.
- **`render_index_md`:** entries spanning two sites → a `## <site> (n)` header per site (sorted) and one `- [ ] [<title> (\`id\`)](<id>.md) — [original](<url>)` per entry; total checkbox count == entry count.
- **Integration (`review-export`):**
  - `--id qst_lsas` over the real `output/` → `import_review/qst_lsas.md` exists, contains the original URL, 48 numbered items, and both `fear`/`avoidance` dimensions; `import_review/README.md` exists with 158 `- [ ]` boxes.
  - a uniform real scale (`--id qst_gad7`) → its doc shows the 7 items + the 0–3 choice line + the resolved instruction/context text.
- **Full sweep:** `review-export` (no `--id`) → 158 `<id>.md` + README; doc count == questionnaire count; README checkbox count == 158; spot-check a number/slider questionnaire renders the slider line.
- Existing harvester suite stays green.

## Scope / out of scope

- **In:** `review_export.py` + `review-export` command + `import_review/README.md` + `import_review/<id>.md` for all 158.
- **Out:** any schema or canonical-JSON change; new runtime dependency; rendering non-`en` locales (harvested data is `en`-only); embedding/fetching the original page content (we link to it, not copy it).

## Risks

- **Multi-agent shared checkout** — isolated worktree `.claude/worktrees/harvester-review`, branch `harvester-review-export-0620`; commit on HEAD only (verify branch+parent before/after each commit); ALL edits under the worktree; never checkout/reset/switch or `cd` elsewhere; do not use the cheapest model tier; edit the gitignored `HANDOFF.md` on disk only. At final integration merge `origin/master` INTO this branch inside the worktree and fast-forward-push (a concurrent editor agent holds the main dir).
- **HTML in stored text** — rendered verbatim (a faithful review should see it); not stripped.
- **Missing/dangling refs** — rendered as `‹missing <ref>›`, never crash; the sweep still completes.
- **Faithfulness** — pure reformatting of canonical data; no interpretation, no edits to `output/`.
