# psychology-tools.com adapter: two-dimension table (Liebowitz)

**Date:** 2026-06-19
**Status:** approved (brainstorming)
**Scope:** teach `PsychologyToolsAdapter` to harvest the two-super-header **dimension table** layout (Liebowitz Social Anxiety Scale: 24 items × {Fear, Avoidance}) by flattening each item into one question per dimension, with the dimension carried on the `Option`. Adapter-only — NO schema/draft/raw change. Re-sweep the 1 affected page.
**Sibling (done):** #3a stem-less Beck-style (shipped 2026-06-19). This closes the last "deferred layout" item.

## Problem

`liebowitz-social-anxiety-scale` uses a `<form><table>` (not `div.notable-tr` or `li.question-container`), so the adapter currently refuses it. Structure (confirmed):

- **Header row 1:** two super-header `<th colspan="4">` cells — `Fear` and `Avoidance`.
- **Header row 2:** 8 anchor `<th>`: Fear → `None`/`Mild`/`Moderate`/`Severe`; Avoidance → `Never(0%)`/`Occasionally(1-33%)`/`Often(34-66%)`/`Usually(67-100%)`.
- **24 data rows:** cell 0 = item stem; then 8 radio cells — `qa<N>` (Fear, values 0–3) + `qb<N>` (Avoidance, values 0–3). Radios have **no per-radio `<label>`** — the anchor is the column header by position.

Each item carries **two** ratings, but the canonical model is one `Option` per `Question`. So each item flattens into two questions.

## Decisions (owner-approved)

- **Flatten** each item into one question per dimension. The two questions of an item share the stem; they are distinguished by the structured **`Option.dimension`** (`fear`/`avoidance`) + differing anchors — **the prompt text is the verbatim stem, never augmented** (owner choice: "dimension on the Option").
- Parse **by column position** (partition columns by the super-header colspans), not by the `qa`/`qb` radio names — more faithful to the table semantics and robust to naming.
- Dimension keys come from the super-header labels, sanitized to the schema pattern `^[a-z][a-z0-9_]+$` (`Fear`→`fear`, `Avoidance`→`avoidance`).
- Anchors + scores are the page's own column headers / radio values, verbatim.

## Design (adapter-only, `sources/psychology_tools.py`)

New functions + a `parse()` branch; everything else (instruction, references, license, id) reuses the existing per-item path.

- **`_sanitize_dimension(label) -> str`**: lowercase; non-`[a-z0-9]`→`_`; collapse repeats; strip leading/trailing `_`; if it doesn't match `^[a-z][a-z0-9_]+$` (e.g. too short, leading digit), raise `PsychologyToolsParseError`. `"Fear"`→`"fear"`, `"Avoidance"`→`"avoidance"`.
- **`_dimension_table(form)`**: returns the `<table>` if the form has a table whose first header row contains ≥2 `<th colspan=…>` super-header cells, else `None`. (Detection predicate.)
- **`_radio_value(cell) -> float`**: reads the single radio's numeric `value`; raises on missing/non-numeric (mirrors `_cell_pair`'s value rule).
- **`_extract_dimension_table(table) -> list[RawItem]`**:
  - Read header row 1 → ordered `[(dim_key, colspan), …]` via `_sanitize_dimension` on each `<th colspan>`; require ≥2.
  - Read header row 2 → the anchor `<th>` texts; partition into per-dimension anchor lists by the colspans; require the partition to consume exactly the anchor cells (else refuse).
  - For each data row containing radios: cell 0 = stem (verbatim; refuse if empty); the radio cells, in column order, partitioned by the same colspans into one group per dimension; require each row's radio-cell count == sum(colspans) (else refuse).
  - For each (item, dimension) emit, **interleaved** (item1-dim1, item1-dim2, item2-dim1, …): `RawItem(text=stem, option=RawOption(input_data_type="choice", measurement_type="ordinal", selection="single", dimension=dim_key, anchors=<that dim's anchors>, values=<that group's radio values>))`.
- **`parse()`**: replace `items = _extract_items(form)` with: `tbl = _dimension_table(form); items = _extract_dimension_table(tbl) if tbl is not None else _extract_items(form)`. The rest of `parse()` (instruction/description/references/return) is unchanged; `shared_prompt_text` stays `None` (this is the per-item-prompt model).

## Drafting (NO change — verified)

The drafter's per-item path (`_resolve_option(per_item=True)`) already mints per-item choice options and dedups identical ones via `mint_cache` keyed on `option_fingerprint`. Verified: the **choice fingerprint is `[input_data_type, measurement_type, selection, values, anchors]`** (it does NOT include `dimension`). Therefore:
- all 24 Fear ratings (identical anchors+values) → **one** `opt_<slug>_fear_*`;
- all 24 Avoidance ratings → **one** `opt_<slug>_avoidance_*`;
- Fear vs Avoidance differ in anchors → kept as **2 distinct Options**.

Result for Liebowitz: **48 page elements, 48 prompts, 2 Options**, `qst_lsas`. The per-item path mints one prompt per element (`pr_<slug>_<i>`) and does **not** dedup prompt text, so each item's stem appears on the item's two prompts (24 same-text pairs). That redundancy is schema-valid and faithful; collapsing it would need a drafter change (out of scope). Page Instructions → Instruction entity, Sources → `publication`/`x_references` (existing extraction, unchanged).

**Documented limitation:** because `dimension` is not in the choice fingerprint, two dimensions with *identical* anchor sets would dedup into one Option (losing the dimension distinction). Moot for Liebowitz (Fear and Avoidance anchors differ). If a future two-dimension table has identical per-dimension anchors, revisit the fingerprint; out of scope here.

## Resulting shape (illustrative, synthetic)

Item N → two elements sharing the stem prompt, distinguished by `Option.dimension`:
- `{question:{prompt:{ref: pr_<slug>_<i>}}, option:{ref: opt_<slug>_fear_*}}` — Fear (anchors None/Mild/Moderate/Severe, values 0–3)
- `{question:{prompt:{ref: pr_<slug>_<i>}}, option:{ref: opt_<slug>_avoidance_*}}` — Avoidance (% bands, values 0–3)

`opt_<slug>_fear_*` carries `dimension: "fear"`; `opt_<slug>_avoidance_*` carries `dimension: "avoidance"`. No `instruction` per-element ref difference vs other per-item pages.

## Scope / out of scope

- **In:** two-super-header dimension-table detection + parsing → flattened per-dimension questions; re-sweep `liebowitz-social-anxiety-scale`.
- **Out:** identical-anchor dimension merging (documented limitation); any non-table page (falls through to `_extract_items`, unchanged); schema/draft/raw changes.

## Testing (TDD, synthetic fixtures)

- **Unit (`psychology_tools`):**
  - 2-dim × 2-item synthetic table → 4 RawItems, interleaved; `items[0].option.dimension=="fear"`, anchors == the Fear set, values from row 1's first group; `items[1].option.dimension=="avoidance"`, anchors == the Avoidance set; `items[2]`/`items[3]` from row 2; **stems verbatim** on the right items.
  - `_sanitize_dimension`: `"Fear"`→`"fear"`, `"Avoidance"`→`"avoidance"`, a label sanitizing to <2 chars or leading digit → refuse.
  - data row with radio-cell count ≠ sum(colspans) → `PsychologyToolsParseError`.
  - non-numeric radio value → `PsychologyToolsParseError`.
  - a table with only 1 super-header (or no colspan) → NOT treated as a dimension table (falls through to `_extract_items`).
  - regression: a standard `div.notable-tr` page and an alt `li.question-container` page still parse unchanged (no table → `_extract_items`).
- **Unit (`draft`)/e2e:** harvest a synthetic 2-dim fixture → the two dimensions dedup to 2 Options with distinct `dimension` values; each element references the correct option; questions carry verbatim stems; validates at `v26.0618`.
- Existing harvester suite stays green.
- **Re-sweep** `liebowitz-social-anxiety-scale` → `qst_lsas`: 48 elements, exactly 2 Options (one `dimension:"fear"`, one `dimension:"avoidance"`), zero dangling/orphan refs; tree validates; report counts.

## Components & boundaries

| Unit | Responsibility | Depends on |
|---|---|---|
| `_sanitize_dimension` | super-header label → schema-valid `dimension` key | — |
| `_dimension_table` | detect the two-super-header table | BeautifulSoup |
| `_radio_value` | one radio cell → numeric value | — |
| `_extract_dimension_table` | table → flattened per-dimension `RawItem`s | the three helpers above, `raw.py` |
| `parse()` branch | route table pages to the new parser, else `_extract_items` | `_dimension_table` |
| `draft.py` | UNCHANGED — per-item dedup already yields 2 Options | — |

## Risks

- **Multi-agent shared checkout** — isolated worktree `.claude/worktrees/psytools-liebowitz`, branch `harvester-psytools-liebowitz-0619`; commit on HEAD only (verify branch+parent before/after each commit); ALL edits under the worktree; never checkout/reset/switch or `cd` elsewhere; do not use the cheapest model tier; edit the gitignored `HANDOFF.md` on disk only. At final integration, merge `origin/master` INTO this branch inside the worktree and fast-forward-push (a concurrent editor agent holds the main dir).
- **Detection precedence** — the dimension-table branch is gated on a ≥2-colspan-super-header table; standard/alt pages have no such table and keep their current path (guarded by regression tests).
- **Dedup-by-anchors limitation** — documented above; acceptable for Liebowitz.
- **Copyright** — same posture: `license: unknown` / `needs-review`; tests use synthetic fixtures; staging only.
