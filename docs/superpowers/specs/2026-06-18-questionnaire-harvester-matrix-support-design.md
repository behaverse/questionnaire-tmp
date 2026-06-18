# Matrix (`t: multiradio`) support for the questionnaire harvester

**Date:** 2026-06-18
**Status:** approved (brainstorming)
**Scope:** schema `v26.0618` amendment (additive: `OptionBase.randomize`) + harvester `t: multiradio` support
**Extends:** `2026-06-18-questionnaire-harvester-slider-support-design.md` (reuses its per-item-option engine)

## Problem

The harvester imports single-Likert (`t: scale`) and slider (`t: range`) questionnaires. The next
format is the **matrix** (`t: multiradio`) — 4 PsyToolkit pages: Clinical Anger Scale (CAS),
Narcissism NPI-16, Locus of Control (Rotter), Positive Mindset Index (PMI).

A `t: multiradio N` block looks like (PMI, N=5):

```
l: PMI
t: multiradio 5
o: free
q: Please say how much you are feeling the following at this moment in time. Please select one of the options ...
- Very unhappy
- Unhappy
- Moderately happy
- Happy
- Very happy
- Very unconfident
- Unconfident
- Moderately confident
- Confident
- Very confident
... (6 groups of 5)
```

Confirmed structure across all four (`-` lines divisible by N):

| Page | `t: multiradio N` | `-` lines | items | `o:` directives |
|---|---|---|---|---|
| anger-cas | 4 | 84 | 21 | `scores 0 1 2 3` |
| narcism-npi16 | 2 | 16 | 8 | `random`, `scores 0 1` |
| locus-of-control-rotter | 2 | 30 | 15 | `random`, `scores 0 1` |
| pmi | 5 | 30 | 6 | `free` |

Two characteristics make matrix different from scale/range:

1. **Items have no per-item stem.** The `-` lines are the response options; the construct
   (PMI "happiness", a Beck cluster, a forced-choice pair) is implicit in the option text.
   The only text is the block's shared `q:`.
2. **Each item has its own option set** (the N consecutive `-` lines), and `o: random`
   shuffles option display order — a capability the canonical Option schema lacks.

## Decisions (owner-approved)

- **Shared prompt (Option A):** the entire `q:` text, verbatim, becomes **one** Prompt that all
  the block's items reference. No prompt/instruction split (fragile across CAS/NPI/Rotter), no
  fabricated per-item stem. Matrix questions carry no separate Instruction.
- **Option-order randomization:** add a new **`OptionBase.randomize`** boolean (maps `o: random`).
  Item-order randomization already exists (`Block/Page/Section.randomize`) and isn't used by
  multiradio. **No random seed** (deferred, owner decision).
- **Per-item options:** each item is a choice Option (`ordinal`, `single`), anchors = the N
  statements verbatim, values from `o: scores …` else positional `1…N`. Construct/dimension left
  generic — not fabricated.
- **Single multiradio block per page.** A page with >1 multiradio block is refused cleanly
  (out of scope; all four targets are single-block).

## Part 1 — Schema (`schemas/questionnaire`, amend `v26.0618`, additive)

`v26.0618` was created earlier today (slider fields). The matrix change is the same calendar day
and purely additive, so it **amends `v26.0618` in place** rather than minting a second same-day
version — CalVer collapses same-day additive changes into that day's version. The pre-day snapshot
(`versions/v26.0609/`) already captures the prior state; no new snapshot is needed.

### 1.1 New field
Add to `OptionBase.properties` (optional):

```jsonc
"randomize": { "type": "boolean", "default": false }
```

Semantics: when `true`, a viewer shuffles this option's choice order at presentation. Source
order + scores are stored verbatim regardless (faithful); `randomize` is a presentation hint.

### 1.2 Mechanics
- `schema.json` already at `$id`/version `v26.0618`; no `$id` change.
- Extend the existing `## [v26.0618]` CHANGELOG entry with an "option-order randomization" bullet
  (severity stays `additive`).
- Add an example option using `randomize: true` under `examples/library_examples/options/`.
- `python tools/validate_schemas.py` green.

Downstream (denormaliser, viewer, Library): additive, passes through. Viewer shuffle rendering is
out of scope (separate viewer task).

## Part 2 — Harvester (`questionnaire-harvester`)

### 2.1 Data model (`raw.py`)
- `RawQuestionnaire.shared_prompt_text: str | None = None` — the matrix block's `q:`.
- `RawItem.text: str | None` — `None` for matrix items (no per-item stem).
- `RawOption.randomize: bool = False`.

### 2.2 Parsing (`psytoolkit.py`)
- New branch after scale and range. Detect blocks containing `t: multiradio N`.
- If exactly one multiradio block: `q:` → `shared_prompt_text`; group the block's `-` lines into
  consecutive N-chunks; each chunk → a choice `RawOption`:
  - `input_data_type="choice"`, `measurement_type="ordinal"`, `selection="single"`,
    `dimension="rating"`.
  - `anchors` = the N statements verbatim; `values` = the parsed `o: scores …` list (length N)
    if present, else positional `1.0…N`.
  - `randomize=True` if the block has an `o: random` directive.
  - Each item: `RawItem(text=None, option=<RawOption>)`.
- **Refuse cleanly** (`PsyToolkitParseError` → SKIP, nothing written) when: `-` count is not
  divisible by N; a block yields zero items; an `o: scores` list length ≠ N; or the page has
  more than one multiradio block.

### 2.3 Draft (`draft.py`)
- **Shared-prompt path:** when `rq.shared_prompt_text` is set, mint **one** Prompt
  (`pr_<slug>_shared`, content = the `q:` text) and reference it from every element's
  `question.prompt`. Matrix items contribute no per-item prompt and **no instruction**
  (`question` omits the `instruction` ref). The existing per-item-prompt path (Likert/slider)
  is untouched; guard the instruction-minting so it is skipped when there is no instruction text.
- Per-item **choice** options use the counter id scheme `opt_<slug>_<dim>_<n>` (as number options
  do) — the Likert `len(anchors)` scheme would collide when every item has N options. Emit
  `randomize: true` on the option when set.
- Per-item options still flow through `option_fingerprint` dedup; fold `randomize` into the
  fingerprint so an otherwise-identical randomized vs non-randomized option stays distinct.
  (Matrix anchors are distinct per item, so collapse is rare — but PMI-like repeats are handled.)

### 2.4 Validation / sweep
- Harvest at `v26.0618`. After implementation, sweep CAS, NPI-16, Rotter, PMI; the whole
  `output/` tree must validate at `v26.0618` (~110 → ~114).

### 2.5 Out of scope (unchanged refusals)
Per-item `t: radio`, `t: check`, `t: textline`, and stem-less VAS sliders remain refused.
Multi-block multiradio pages are refused (future work).

## Testing (TDD)

- **Unit (`psytoolkit`):** N-chunk grouping; `o: scores` vs positional (`o: free`) values;
  `o: random` → `RawOption.randomize`; refuse non-divisible `-` count; refuse `scores`-length ≠ N;
  refuse multi-block multiradio.
- **Unit (`draft`):** shared prompt minted once and referenced by every element; matrix questions
  omit `instruction`; per-item choice options have counter ids + distinct anchors; `randomize`
  emitted; `option_fingerprint` distinguishes randomize.
- **e2e:** a `t: multiradio` HTML fixture → harvest → validates at `v26.0618`.
- **Schema:** `tools/validate_schemas.py` green; the new randomize example validates.
- Existing harvester suite (47) stays green — scale/slider paths untouched.

## Components & boundaries

| Unit | Responsibility | Depends on |
|---|---|---|
| `schemas/questionnaire` v26.0618 (+`OptionBase.randomize`) | canonical: option-order shuffle | — |
| `raw.py` | shared-prompt + per-item-option model | — |
| `psytoolkit.py` | parse `t: multiradio` → `RawQuestionnaire` | `raw.py` |
| `draft.py` | shared-prompt minting + per-item choice options + `randomize` | schema, `raw.py`, `dedup.py` |

## Risks

- **Multi-agent shared checkout** — work in an isolated worktree; merge via a throwaway master
  worktree (or directly if main dir is on a clean master). Confirm the branch HEAD before every
  commit (a prior agent mis-parented a commit onto master).
- **Draft shared-prompt path must not perturb Likert/slider** — those use per-item prompts; the
  shared path is a new branch gated on `shared_prompt_text`. Guarded by the existing suite.
- **Instruction omission** — matrix questions have no instruction; the drafter must skip
  instruction minting/referencing without breaking the scale/slider paths that always have one.
