# Multi-select checkbox (`t: check`) support for the questionnaire harvester

**Date:** 2026-06-19
**Status:** approved (brainstorming)
**Scope:** harvester `t: check` parsing only — NO schema, data-model, or draft changes
**Extends:** the per-item radio (`t: radio`) parser; shares its choice-item-block logic

## Problem

The harvester handles single-Likert (`t: scale`), slider (`t: range`), matrix
(`t: multiradio`), and per-item radio (`t: radio`). The remaining common single-page format
is the **multi-select checkbox** (`t: check`) — 1 PsyToolkit page: Children's Happiness Scale.

A `t: check` block is one *multi-select* question: the `q:` is the prompt, and the
`- {score=N} text` lines are independently-checkable options, each carrying a scoring weight.
Confirmed shape (children-happiness, single block, 20 options, no min/max/require directives):

```
l: happinessitems
t: check
q: Here are 20 things children or young people might say about themselves. ... tick all the ones that are right about you. Leave the others blank.
- {score=3.64} Life is good for me at the moment
- {score=3.13} I am treated fairly
... (20 options)
```

The trailing `t: set` / `t: jump` / `t: info` blocks are scoring/feedback control directives,
not question blocks — the parser ignores them (as it already does).

## Decisions (owner-approved)

- **One check block = one multi-select item.** `q:` → that item's prompt (verbatim); the
  options → one `Option` with `selection: "multiple"`.
- **`measurement_type: "nominal"`.** A checklist is an unordered subset of independent
  statements (each with a scoring weight), not a ranked scale.
- **No `min_selected` / `max_selected`.** The source imposes no count constraint ("tick all
  that apply, leave others blank" → 0…N). The schema fields are optional → omitted.
- **Float `values` kept verbatim** from each `{score=N}` (e.g. `3.64`). `OptionChoiceStructural.value`
  accepts numbers, so floats are valid.
- **Per-item prompt, no instruction.** Like `t: radio`: `instruction_text=None`, `scale=None`,
  `shared_prompt_text=None`.

## Parser-only change

A `t: check` block maps to `RawItem(text=<q:>, option=RawOption(input_data_type="choice",
measurement_type="nominal", selection="multiple", anchors=<texts>, values=<scores>))`. The
existing `draft()` already builds per-item choice options (counter ids `opt_<slug>_rating_<n>`,
fingerprint dedup) + per-item prompts + the no-instruction case, and the schema already
allows `selection: "multiple"`. So **`draft.py`, `dedup.py`, `raw.py`, and the schema are
untouched.** Only `psytoolkit.py` changes.

## DRY: shared choice-item-block parser

`_parse_radio_block` and the new check parser are ~90% identical (same `q:` accumulation,
`{score=N}`/positional value parsing, and refusal checks). To avoid verbatim duplication,
extract the shared core:

- New `_parse_choice_item_block(block_lines, *, selection, measurement_type) -> RawItem`:
  the existing radio-block logic, parameterised by `selection` and `measurement_type`.
- `_parse_radio_block(block_lines)` becomes a thin wrapper →
  `_parse_choice_item_block(block_lines, selection="single", measurement_type="ordinal")`.
  Its output is byte-identical to today (regression-guarded by the existing radio tests).
- Check uses `_parse_choice_item_block(block_lines, selection="multiple", measurement_type="nominal")`.

## Parsing (`psytoolkit.py`)

- Refactor as above; add a `check_blocks` detection (`^t:\s*check\b`) and an
  `elif check_blocks:` branch in `parse()`, after `radio_blocks` and before the final `else`.
  Each check block → one multi-select `RawItem`; build a `RawQuestionnaire` with `scale=None`,
  `instruction_text=None`, `shared_prompt_text=None`.
- **Refuse cleanly** (`PsyToolkitParseError` → SKIP, nothing written): a check block with no
  options, an empty option label, or an empty stem (inherited from the shared helper). Never
  fabricate or silently truncate.
- Branch precedence: `t: scale` → `t: range` → `t: multiradio` → `t: radio` → `t: check` →
  error. (`^t:\s*check\b` matches only `t: check`; no overlap with the others.)

## Scope / out of scope

- **In:** `t: check` multi-select pages (children-happiness → ~117 → ~118).
- **Out (unchanged refusals):** `t: textline`, mixed text+radio (demographics), `dsmqr`
  (literal `..` placeholder labels), no-`<pre>` pages.

## Testing (TDD)

- **Unit (`psytoolkit`):** one check block → `RawItem` with `selection="multiple"`,
  `measurement_type="nominal"`, float `values`, all anchors verbatim; refuse a block with no
  options / empty label; full-page parse via the public surface (`scale=None`, one item).
- **Regression:** `_parse_radio_block` still yields `single`/`ordinal` (existing radio tests
  unchanged + green).
- **e2e:** a `t: check` HTML fixture → harvest → validates against `schemas/` at `v26.0618`;
  the minted option has `selection: "multiple"`; the question has no `instruction`.
- Existing harvester suite (65) stays green.
- Then sweep children-happiness; the whole `output/` tree must validate at `v26.0618`.

## Components & boundaries

| Unit | Responsibility | Depends on |
|---|---|---|
| `psytoolkit.py` (`_parse_choice_item_block` + `_parse_radio_block` wrapper + check branch) | parse `t: radio` & `t: check` → `RawItem` | `raw.py` |
| `draft.py` / schema | UNCHANGED — per-item choice option (incl. `selection: multiple`) already supported | — |

## Risks

- **Multi-agent shared checkout** — work in the isolated worktree; commit on HEAD only
  (verify branch + parent before/after each commit); never checkout/reset/switch or `cd`
  elsewhere; do not use the cheapest model tier for implementers (it mis-parented commits
  before). Edit the gitignored `HANDOFF.md` on disk only — never `git add` it.
- **Radio regression** — the shared-helper refactor must leave `t: radio` output identical;
  guarded by the existing radio unit tests + a Likert/slider/matrix spot-check.
