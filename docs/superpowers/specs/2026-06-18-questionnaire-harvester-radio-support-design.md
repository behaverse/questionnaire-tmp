# Per-item radio (`t: radio`) support for the questionnaire harvester

**Date:** 2026-06-18
**Status:** approved (brainstorming)
**Scope:** harvester `t: radio` parsing only — NO schema, data-model, or draft changes
**Extends:** the slider + matrix per-item-option engine

## Problem

The harvester handles single-Likert (`t: scale`), slider (`t: range`), and matrix
(`t: multiradio`). The remaining common PsyToolkit format is **per-item radio** (`t: radio`)
— 3 pages: Edinburgh Postnatal Depression (EPDS), Systemizing Quotient (SQ),
Nurturant-Fathering Scale (NFS).

In `t: radio`, **each `l:` block is one item**: the `q:` line is the item's stem and its
`- {score=N} text` lines are that item's own scored options. Example (EPDS):

```
l: epds2
t: radio
q: I have looked forward with enjoyment to things
- {score=0} As much as I ever did
- {score=1} Rather less than I used to
- {score=2} Definitely less than I used to
- {score=3} Hardly at all
```

This is **per-item prompt + per-item choice option** — the union of two mechanisms the
harvester already has: Likert's per-item prompt (from item text) and slider/matrix's
per-item options (counter-id choice options). The options differ per item (EPDS item 3 even
reverses the score order: `{score=3} Yes, most of the time` … `{score=1} Not very often`),
and that per-option scoring is captured directly in the option's `values` — no `reverse`
flag needed.

## Key property: parser-only change

A `t: radio` item maps to `RawItem(text=<q:>, option=RawOption(input_data_type="choice",
measurement_type="ordinal", selection="single", anchors=<texts>, values=<scores>))`. The
existing `draft()` already handles exactly this combination:

- per-item choice options via `_resolve_option(..., per_item=True)` → counter id
  `opt_<slug>_rating_<n>` + fingerprint dedup;
- per-item prompts minted from `item.text`;
- the no-instruction case (`instruction_text` falsy → instruction skipped, no
  `question.instruction` ref) added in the matrix work.

So **`draft.py`, `dedup.py`, `raw.py`, and the schema are untouched.** Only the parser
(`psytoolkit.py`) gains a `t: radio` branch.

## Decisions

- **Faithful conflated prompt.** EPDS item 1's `q:` mixes a general note with the stem:
  *"Note, all questions in this questionnaire are about how you felt in the past 7 days. I
  have been able to laugh and see the funny side of things"*. Per the faithfulness rule
  (and consistent with how matrix keeps the embedded "at this moment" verbatim), the entire
  `q:` becomes that item's prompt **verbatim** — no fragile note/stem split.
- **Per-item scored options.** `values` from each `{score=N}`; positional `1…N` fallback if
  a block has no `{score=...}` markers. Duplicate scores (SQ uses `2/1/0/0`) are kept as-is.
- **Generic dimension** `"rating"` (the construct is per-item and not in the DSL).
- `instruction_text=None`, `scale=None`, `shared_prompt_text=None` for radio pages.

## Parsing (`psytoolkit.py`)

- New `_parse_radio_block(block_lines) -> RawItem`: from one `t: radio` block, take the
  `q:` (multi-line aware) as the item stem and the `- {score=N} text` lines as a choice
  `RawOption`. Reuse the existing `_parse_scale`-style score/positional logic. Returns the
  `RawItem`, or raises `PsyToolkitParseError` (see refusals below).
- New `parse()` branch, after multiradio and before the final error:
  `elif radio_blocks:` — collect one `RawItem` per `t: radio` block across the page; build a
  `RawQuestionnaire` with `scale=None`, `instruction_text=None`, `shared_prompt_text=None`.
- **Refuse cleanly** (`PsyToolkitParseError` → SKIP, nothing written): a radio block with no
  options; an empty option label; or a page where the radio branch yields zero items. Never
  fabricate or silently truncate.
- Branch precedence: `t: scale` → `t: range` → `t: multiradio` → `t: radio` → error. (A
  page that mixes types still resolves by this precedence, matching existing behavior.)

## Scope / out of scope

- **In:** `t: radio` pages with per-item stems + scored options (EPDS, SQ, NFS).
- **Out (unchanged refusals):** `t: check` (multi-select), `t: textline`, mixed
  text+radio (demographics), `dsmqr` (literal `..` placeholder labels), no-`<pre>` pages.

## Testing (TDD)

- **Unit (`psytoolkit`):** one radio block → `RawItem` with stem + scored choice option
  (correct anchors/values); positional fallback when no `{score=...}`; refuse a block with
  no options; refuse an empty option label; full-page parse via the public surface
  (`scale=None`, N items, each with its own option).
- **e2e:** a `t: radio` HTML fixture → harvest → validates against `schemas/` at `v26.0618`;
  per-item prompts distinct; per-item choice options with counter ids; no instruction.
- Existing harvester suite (58) stays green — scale/slider/matrix paths untouched.
- Then sweep EPDS, SQ, NFS; the whole `output/` tree must validate at `v26.0618`.

## Components & boundaries

| Unit | Responsibility | Depends on |
|---|---|---|
| `psytoolkit.py` (`_parse_radio_block` + branch) | parse `t: radio` → `RawQuestionnaire` | `raw.py` |
| `draft.py` | UNCHANGED — per-item prompt + per-item choice option already supported | — |

## Risks

- **Multi-agent shared checkout** — work in the isolated worktree; commit on HEAD only
  (never checkout/reset/switch); merge via the established pattern. Do not use the cheapest
  model tier for implementers (it mis-parented commits twice in prior runs).
- **Conflated EPDS prompt** — intentional verbatim capture; flagged here so it is not
  mistaken for a parser bug downstream.
