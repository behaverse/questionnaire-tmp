# psychology-tools.com adapter: stem-less Beck-style scales (shared prompt)

**Date:** 2026-06-19
**Status:** approved (brainstorming)
**Scope:** teach `PsychologyToolsAdapter` to harvest the stem-less Beck-style alt-layout (item containers whose `span.prompt` is empty; the options carry the content) by routing them to the existing shared-prompt model. Adapter-only — NO schema or draft change. Re-sweep the 2 affected pages.
**Extends:** the layout-robustness work (`2026-06-19-...-layout-robustness-design.md`).
**Sibling (separate, later):** #3b liebowitz two-dimension table layout — NOT in this spec.

## Problem

Two psychology-tools pages — binge-eating-scale, health-anxiety-inventory — use the alternate `li.question-container` layout but with an **empty `span.prompt`**: each item is a cluster of *distinct* scored statement-options (Beck-style), and the only shared text is the page's `Instructions`. The adapter currently refuses these ("empty stem"), deferring them.

This is structurally identical to the matrix (`t: multiradio`) shape the harvester already models: one **shared prompt** + **per-item options** + items with no per-item stem. The drafter already supports it via `RawQuestionnaire.shared_prompt_text` and `RawItem(text=None, option=…)` (draft.py lines ~124-140). So this is an adapter routing change only.

Confirmed structure (binge-eating): `Instructions` paragraph ("Below are groups of statements …"); 16 `li.question-container` rows, each with empty `span.prompt` + 4 distinct scored `ul.responses > li` options; item option-sets differ across items.

## Decisions (owner-approved)

- A page whose alt-layout item rows are **all stem-less** → harvest as one **shared prompt** (= the page's `Instructions` text) + **per-item options** (`RawItem(text=None, option=…)`). Matches the matrix model.
- The shared prompt is the page's real `Instructions`; if a stem-less page has **no** instruction, refuse (don't fabricate a prompt).
- A page with **mixed** stem/stem-less rows → refuse (ambiguous).
- Per-item options keep distinct anchors + verbatim scores (counter ids + existing dedup), exactly as matrix/standard per-item options.

## Design (adapter-only, `sources/psychology_tools.py`)

The current `_extract_items(form)` raises on an empty stem. Change so empty stems are allowed, and let `parse()` decide stem-less vs per-item:

- **`_extract_items`**: a row with an empty stem yields `RawItem(text=None, option=<that row's choice option>)` instead of raising. (Empty *anchor labels* and non-numeric *values* still behave as today: blank anchor allowed; non-numeric value still raises.) A row with no response cells still raises.
- **`parse()`**, after `items = _extract_items(form)`:
  - `stemless = [it for it in items if it.text is None]`
  - if `stemless` and `len(stemless) == len(items)` (**all** stem-less): require a non-empty `instruction_text`, else `raise PsychologyToolsParseError("stem-less page with no instruction to use as the shared prompt")`. Set `shared_prompt_text = instruction_text`, then `instruction_text = None`.
  - elif `stemless` (some-but-not-all): `raise PsychologyToolsParseError("mixed stem / stem-less item rows")`.
  - else (all have stems): unchanged.
- The `return RawQuestionnaire(...)` passes the resolved `shared_prompt_text`/`instruction_text` (currently it hardcodes `shared_prompt_text=None`; change to the computed value). Everything else (references, license, items) unchanged.

The drafter then mints one `pr_<slug>_shared` prompt (the Instructions) referenced by every element, and each item's own per-item choice option — no schema/draft change.

## Resulting shape (illustrative, synthetic content)

For a stem-less page, each page element is a `(shared prompt, own option)` pair; the item's statements live in its Option's `content.options` with the source's scores in `value`:
- one `Prompt` `pr_<slug>_shared` = the Instructions text;
- per item, an `Option` `opt_<slug>_rating_<n>` (`choice`/`ordinal`/`single`) whose `content.options` are that item's distinct statements and whose structural `options[].value` are the source scores;
- `question` carries only the shared `prompt` ref (no `instruction` ref); `text=None` items.

## Scope / out of scope

- **In:** stem-less Beck-style alt-layout detection → shared-prompt routing; re-sweep binge-eating-scale + health-anxiety-inventory.
- **Out:** liebowitz two-dimension table (#3b, separate); mixed stem/stem-less pages (refuse); any new schema/draft change.

## Testing (TDD)

- **Unit (`psychology_tools`):**
  - all-stem-less alt page with an Instructions paragraph → `rq.shared_prompt_text` == the instruction, `rq.instruction_text is None`, every `rq.items[i].text is None`, each item has its own distinct option-set (anchors + values).
  - all-stem-less with NO instruction → `PsychologyToolsParseError`.
  - mixed stem/stem-less rows → `PsychologyToolsParseError`.
  - regression: an all-stems alt page (e.g. the young-mania-style fixture) still parses with per-item stems and `shared_prompt_text is None`.
  - regression: standard-layout endpoint-only page unchanged.
- **Unit (`draft`)/e2e:** harvest a synthetic stem-less fixture → one `pr_<slug>_shared` referenced by all elements; each element's option `choice`/`single`; questions omit `instruction`; validates at `v26.0618`.
- Existing harvester suite stays green.
- **Re-sweep** binge-eating-scale + health-anxiety-inventory; tree validates; report item/option counts.

## Components & boundaries

| Unit | Responsibility | Depends on |
|---|---|---|
| `sources/psychology_tools.py` (`_extract_items` + `parse()` stem-less branch) | route stem-less alt pages to shared-prompt | `raw.py` (existing `shared_prompt_text`) |
| `draft.py` | UNCHANGED — shared-prompt path already exists | — |

## Risks

- **Multi-agent shared checkout** — isolated worktree; commit on HEAD only (verify branch+parent before/after each commit); ALL edits under the worktree; never checkout/reset/switch or `cd` elsewhere; do not use the cheapest model tier; edit the gitignored `HANDOFF.md` on disk only. `origin/master` moves with the editor agent — at final integration merge `origin/master` INTO this branch inside the worktree and fast-forward-push.
- **Instruction detection** — the shared prompt depends on the adapter's existing `^instructions?` paragraph match; if a stem-less page phrases its instruction differently, it refuses (no fabricated prompt) rather than mis-harvesting. Acceptable.
- **Don't regress per-item-stem alt pages** — the stem-less branch is gated on *all* rows being stem-less; per-item-stem pages keep their current behavior (guarded by a regression test).
- **Copyright** — same posture: `needs-review` / `license: unknown`; tests use synthetic fixtures; staging only.
