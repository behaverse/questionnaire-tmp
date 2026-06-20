# Harvester: import-review feedback fixes

**Date:** 2026-06-20
**Status:** approved (brainstorming)
**Scope:** address the owner's first-pass review comments (on `qst_phq9`, `qst_aq`, `qst_asrm`) generalised across the corpus: (1) render `description` + all references (with links) + unambiguous option weights in the review export; (2) enrich the psychology-tools adapter to capture secondary instruction notes + per-reference source links, then re-harvest the 40 psychology-tools pages; (3) add the PHQ-9 10th (functional-impairment) item to `qst_phq9`. Regenerate `import_review/` + `scoring/` for all 158.

## Problem (from owner review comments)

Comments on the first three `import_review/*.md`:
- **aq/asrm:** "description is missing" → actually captured in JSON, just not rendered. "cites 3 papers, not one" → all in `x_references`, only the first rendered. "references should contain link to actual paper."
- **aq:** "are the values part of the label? ('Definitely Agree (0)')" → the `(0)` is the appended score; ambiguous rendering.
- **asrm:** "a part is missing: 'Please note: …'" → a secondary instruction `<p>` the adapter drops.
- **phq9:** "there's a 10th question in the PDF" (functional-impairment item); publication formatting/DOI.

Investigation findings (verified):
- All 40 psychology-tools questionnaires have a non-blank `description`; 38 have `x_references` (13 with >1). The review export renders neither `description` nor `x_references`.
- psychology-tools `li.source` entries contain `<a href>` **PubMed** links (e.g. `ncbi.nlm.nih.gov/pubmed/11439754`) — faithful per-reference links, currently discarded by `_clean_citation`.
- The adapter's instruction loop keeps only the first `^instructions?` paragraph; "Please note…" is a separate `<p>`.
- `qst_phq9` is a **curated** entity (provenance `web_harvest`, `phqscreeners.com`) — there is **no phqscreeners adapter**, so no re-harvest path; the 10th item is a deliberate edit.
- `OptionChoiceStructural` requires `value` — an unscored item still needs values.

## Decisions (owner-approved)

- **Part 1 (rendering, all 158, no re-harvest):** R1 render `description`; R2 add a **References** section listing all `x_references` with links; R3 render choice weights as **`label [score: N]`**.
- **Part 2 (psychology-tools adapter + re-harvest the 40 pages):** D1 capture secondary "Please note / Note" instruction paragraph(s); D3 extract each `li.source` link → `x_references` becomes a list of `{citation, url?}` objects (publication unchanged). Re-harvest idempotently (URL→id map from existing output preserves the `--id` overrides binge/lsas/pcl22/pcptsd5).
- **Part 3 (curated, `qst_phq9` only):** D2 add the standard functional-impairment item as item 10 (4-option choice, values 0–3 ordinal, `x_scored: false` marker on its option), update `psychometrics.item_count` to 10.
- **Out of scope:** DOIs beyond the source's own links (no external lookup); reformatting/altering existing citation text; any schema change.

## Part 1 — review-export rendering (`review_export.py`)

- **R1 description:** after the metadata bullets, emit `\n<description>\n` (or a `## Description` line) when `metadata.description` is non-empty and not equal to the title.
- **R2 references:** add a `## References` section listing every `x_references` entry. Each entry is rendered defensively for **both shapes**: a plain string → `- <citation>`; an object `{citation, url?}` → `- <citation>` + ` — [link](<url>)` when `url` present. Omit the section when there are no references. (The `publication` bullet stays.)
- **R3 weights:** `render_option` choice branch renders `index. <label> [score: <N>]` joined by ` · ` (blank label → `index. [score: <N>]`). Number/slider line unchanged (no per-anchor scores). Whole-float scores render as ints.
- Unit tests updated for the new choice format + new description/references sections; both reference shapes covered.

## Part 2 — adapter enrichment + re-harvest (`sources/psychology_tools.py`)

- **D1 secondary instructions:** after the existing main-instruction capture, also scan `<p>` elements whose text matches `^\s*(please note|note)\b[:.]?` (case-insensitive) and, when the page is not stem-less, append each (deduped, in order) to `instruction_text` separated by `\n\n`. Conservative: only `note`-prefixed paragraphs, so pages without such a note are unchanged.
- **D3 reference links:** add `_source_link(li)` → the first `<a href>` in a `li.source` (or `None`). Change the references build to a list of objects: `references = [{"citation": _clean_citation(li), "url": _source_link(li)} for li in soup.select("ol.sources li.source") if _clean_citation(li)]`. `publication.citation` = `references[0]["citation"]`; `year` logic unchanged. `RawQuestionnaire.references` now carries the object list; `draft` already passes it straight to `md["x_references"]` (no draft change). `url` omitted (key absent) when `None`.
- **Re-harvest:** build a URL→id map from existing `output/` for `x_source_site == "psychology-tools.com"`; re-harvest each `x_source_url` with `--id <existing id>` and `--version v26.0618`. Idempotent: same ids, enriched `x_references` (objects) + instructions. Validate the tree.

## Part 3 — PHQ-9 10th item (`qst_phq9`, curated edit)

`qst_phq9` has no adapter, so add the item directly + validated:
- New prompt `pr_phq9_10` (content.en.text = the functional-impairment question: "If you checked off any problems, how difficult have these problems made it for you to do your work, take care of things at home, or get along with other people?").
- New option `opt_phq9_impairment_4` (`choice`/`ordinal`/`single`, dimension `impairment`): structural `options` values `0,1,2,3`; content anchors `Not difficult at all` / `Somewhat difficult` / `Very difficult` / `Extremely difficult`; extension `x_scored: false`.
- Append the element `{option: {ref: opt_phq9_impairment_4@v26.0618}, question:{prompt:{ref: pr_phq9_10@v26.0618}}, required: false}`.
- Bump `metadata.psychometrics.item_count` 9 → 10.
- Validate at v26.0618. (Done via a small one-off Python writer in the task so it's reproducible, not blind hand-JSON.)

## Part 4 — regenerate + handoff

After Parts 1–3 land: `python -m harvester.cli review-export` + `python -m harvester.cli document-scoring` (regenerate all 158 `import_review/` + `scoring/` docs from the updated data + renderer). Validate the tree. Update HANDOFF (on disk). The owner re-reviews from the refreshed `import_review/`.

## Testing (TDD)

- **review_export unit:** choice render `1. Definitely Agree [score: 0] · …`; description section present when set; References section renders string refs (`- cite`) and object refs (`- cite — [link](url)`); no References section when empty.
- **psychology_tools unit:** a synthetic page with a `Please note:` `<p>` → `instruction_text` ends with the note (after `\n\n`); a page without one → unchanged; `ol.sources` with `<a href>` → `references[i] == {"citation": …, "url": …}`; a source with no link → object has no `url` key (or `url is None`); the main-instruction + stem-less paths unchanged.
- **phq9 (Part 3):** after the edit, `qst_phq9` has 10 elements; item 10's prompt text contains "how difficult"; its option has 4 anchors + `x_scored is False`; `item_count == 10`; tree validates.
- **Integration:** re-harvest one psychology-tools page (e.g. `qst_asrm`) → its instruction includes the "Please note" text and `x_references[0]` is an object with a `url`; `review-export --id qst_asrm` shows the Description + References-with-link + `[score: N]`.
- **Full regen sweep:** review-export → 158 docs; document-scoring → 158 docs; tree validates; spot-check qst_aq (3 references rendered with links), qst_phq9 (10 items), qst_asrm (Please-note instruction).
- Existing harvester suite stays green.

## Components & boundaries

| Unit | Change | 
|---|---|
| `review_export.py` `render_option` / `render_questionnaire_md` | R1 description, R2 References section (both ref shapes), R3 `[score: N]` |
| `sources/psychology_tools.py` (`parse`, new `_source_link`) | D1 secondary notes, D3 reference link objects |
| `raw.py` | none (references already a free-form list) |
| `draft.py` | none (passes `rq.references` through) |
| re-harvest sweep (Part 2) + regen (Part 4) | data only, idempotent |
| `qst_phq9` entities (Part 3) | curated 10th item |

## Risks

- **Multi-agent shared checkout** — isolated worktree `.claude/worktrees/harvester-review-fixes`, branch `harvester-review-fixes-0620`; commit on HEAD only (verify branch+parent before/after each commit); ALL edits under the worktree; never checkout/reset/switch or `cd` elsewhere; do not use the cheapest model tier; edit gitignored `HANDOFF.md` on disk only. At final integration merge `origin/master` INTO this branch inside the worktree and fast-forward-push (a concurrent editor agent holds the main dir).
- **Re-harvest idempotency** — URL→id map from existing output preserves `--id` overrides; same `--version`; additive enrichment only. A page that now refuses (unlikely) is reported + skipped, not fabricated.
- **`x_references` shape change** — only the 40 re-harvested psychology-tools entities become object-form; psytoolkit have none; the renderer handles both string and object shapes so partial states never crash.
- **Curated phq9 edit precedent** — `qst_phq9` has no adapter; the edit is explicit, scripted, and validated. The unscored item carries `x_scored: false`; the exclusion-from-total is a Scorer-authoring concern (deferred), noted in its scoring doc.
- **Faithfulness** — descriptions/references/links/instructions all come from the source; weights unchanged; the only authored content is the standard PHQ-9 functional-impairment item (a documented completion of a curated entity).
