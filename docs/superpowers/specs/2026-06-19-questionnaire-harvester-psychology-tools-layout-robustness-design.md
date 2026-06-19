# psychology-tools.com adapter robustness: unlabeled anchors + alternate layout

**Date:** 2026-06-19
**Status:** approved (brainstorming)
**Scope:** harden `PsychologyToolsAdapter` to capture two page shapes it currently refuses — endpoint-only-labelled scales and the alternate `li.question-container` layout. One small `draft.py` tweak for unlabeled choices. NO schema change.
**Extends:** `2026-06-19-questionnaire-harvester-psychology-tools-adapter-design.md`

## Problem

The first psychology-tools adapter captured the standard `div.notable-tr.question` template (28 of 47 `/test/` pages). The other 19 either collided with existing ids (6) or were cleanly refused (13). Investigation categorised the 13:

| Category | Count | Pages | Why refused |
|---|---|---|---|
| std layout, endpoint-only labels | 1 | penn-state-worry-questionnaire | middle anchor `<label>`s are blank → adapter refuses "empty anchor label" |
| **alt layout, real per-item stems** | 9 | altman, dissociative-experiences, epds*, infant-toddler-checklist, kutcher, montgomery-asberg, personality-type-indicator, qchat, young-mania | items are `li.question-container` (not `div.notable-tr.question`) → "no item rows" |
| alt layout, stem-less (Beck-style) | 2 | binge-eating, health-anxiety-inventory | `span.prompt` empty; options carry the content |
| two-dimension (fear×avoidance) | 1 | liebowitz-social-anxiety-scale | 48 radio groups, no `li.question-container` rows |

(*epds parses but its derived id collides with the existing `qst_epds` → SKIP unless `--id`.)

Two targeted changes capture the first two categories (**~9 net-new**); the last two stay cleanly refused (deferred sub-tasks).

## Confirmed page structures

- **Standard, endpoint-only** (penn-state): a `.notable-td.response` cell's `<label class="aria-label">` is `Not at all typical of me` for the first option and **whitespace-only** for the middle options (only the two ends are labelled). Structural radios still carry `value`s (5,4,3,2,1).
- **Alternate layout** (young-mania etc.): each item is `li.question-container` → `span.prompt` (the stem) + `ul.responses` whose entries each hold a `<label>` (anchor text) + `<input type="radio" value="…">`. Same per-item shape as the standard template, different element names.
- **Stem-less alt** (binge-eating): `span.prompt` is empty; the `ul.responses` labels are full statements (the item content). No usable stem.

## Decisions (owner-approved)

- **Unlabeled/partial anchors:** do NOT refuse a blank anchor label. Keep the option's structural `index`+`value`; omit content text for blank cells (the unlabeled-ordinal-choice capability shipped in schema v26.0618). Endpoint-labelled scales import faithfully.
- **Alternate-layout fallback:** when no standard rows are found, parse `li.question-container` rows (`span.prompt` stem + `ul.responses` label+radio options) with the same logic.
- **Defer (clean refusal, unchanged posture):** stem-less alt rows (empty `span.prompt`) and the two-dimension liebowitz layout. Each is a separate future sub-task.

## Design

### Parser (`sources/psychology_tools.py`)

- **Generalise row extraction.** Introduce an internal helper that returns the per-item tuples `[(stem, [(anchor, value), …]), …]` from whichever template is present:
  1. **standard:** `form.select("div.notable-tr.question")`; stem = `.notable-td.prompt` (minus `.num`); option cells = `.notable-td.response` (`label` text + radio `value`).
  2. **alternate (fallback, only if standard yields nothing):** `form.select("li.question-container")`; stem = `span.prompt`; option cells = `ul.responses` direct children (`label` text + radio `value`).
  The existing `parse()` builds `RawItem(text=stem, option=RawOption(choice/ordinal/single, dimension="rating", anchors, values))` from these tuples — unchanged downstream.
- **Anchors may be blank.** Anchor text is kept verbatim, including `""` for unlabeled cells. **Remove the empty-anchor-label refusal.** (Structural `value` is still required and still must be numeric — that refusal stays.)
- **Stem still required.** An item row with an empty stem raises `PsychologyToolsParseError` → SKIP. This is what defers the stem-less alt pages (binge-eating, health-anxiety): every row has an empty `span.prompt`, so the page refuses cleanly, nothing written.
- **Refusals (clean SKIP):** no `<form>`; neither template yields rows (e.g. liebowitz); an item with no response cells; a non-numeric radio value; an empty stem. Never fabricate.

### Drafter (`draft.py`) — one tweak

- `_build_choice_option`: build `content.options` only for **non-empty** anchors:
  `"options": [{"index": i + 1, "text": t} for i, t in enumerate(spec.anchors) if t]`.
  The structural `options[]` (index+value) still lists **all** anchors. Blank anchors thus become unlabeled ordinal choices (valid per v26.0618). Existing all-labelled scales (Likert/radio/check/matrix/standard psychtools) are unaffected — no blank anchors there.

### Re-sweep
After the changes, re-harvest the affected `/test/` pages. Expected new: penn-state (1) + the 9 alt-stemful (epds collides → SKIP or `--id`). Stem-less (2) + liebowitz (1) stay refused. Whole `output/` tree must validate at `v26.0618`.

## Scope / out of scope

- **In:** unlabeled-anchor support; alternate `li.question-container` fallback (stemful); the `_build_choice_option` content-omit tweak; re-sweep.
- **Out (deferred, each its own sub-task):** stem-less Beck-style alt pages (binge-eating, health-anxiety-inventory) — need a shared-prompt/no-stem model like the matrix case; liebowitz two-dimension (fear×avoidance) layout.

## Testing (TDD)

- **Unit (`psychology_tools`):** standard endpoint-only-labelled fixture → option with all `values` but `content.options` only for the labelled ends; alternate-layout fixture (`li.question-container`/`span.prompt`/`ul.responses`) → items parsed identically to standard; alt stem-less fixture → refuse (empty stem); no-rows fixture → refuse; non-numeric value → refuse. Regression: the existing standard all-labelled fixture still parses unchanged.
- **Unit (`draft`):** `_build_choice_option` with a blank anchor omits that content option but keeps all structural `options[]`; an all-labelled spec is byte-identical to before.
- **e2e:** a synthetic endpoint-only-labelled `/test/` fixture and a synthetic alt-layout fixture → harvest → validate at `v26.0618`.
- Existing harvester suite stays green.
- Re-sweep the alt-stemful + penn-state pages; tree validates; report counts.

## Components & boundaries

| Unit | Responsibility | Depends on |
|---|---|---|
| `sources/psychology_tools.py` | parse both templates; tolerate blank anchors; refuse stem-less / no-rows | `raw.py`, `bs4` |
| `draft.py` `_build_choice_option` | omit content text for blank anchors (unlabeled choices) | schema v26.0618 |

## Risks

- **Multi-agent shared checkout** — isolated worktree; commit on HEAD only (verify branch + parent before/after each commit); never checkout/reset/switch or `cd` elsewhere; do not use the cheapest model tier; edit the gitignored `HANDOFF.md` on disk only.
- **`_build_choice_option` is shared** — the content-omit change must not alter all-labelled output; guarded by a regression test (blank-only behaviour is new; non-blank is byte-identical).
- **HTML drift** — synthetic fixtures mirror the two live templates; the re-sweep is the integration check. Unrecognised shapes refuse cleanly rather than mis-parse.
- **Copyright** — same posture: `needs-review` / `license: unknown`, staging only; tests use synthetic fixtures.
