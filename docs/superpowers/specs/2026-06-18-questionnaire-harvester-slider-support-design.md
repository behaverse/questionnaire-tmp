# Slider (`t: range`) support for the questionnaire harvester

**Date:** 2026-06-18
**Status:** approved (brainstorming)
**Scope:** schema `v26.0618` (additive) + harvester `t: range` adapter support
**Supersedes/extends:** `2026-06-17-questionnaire-harvester-design.md`

## Problem

The PsyToolkit harvester currently imports only single-Likert (`t: scale`) questionnaires.
The next-largest unlocked format on PsyToolkit is the **slider** (`t: range`) — 6 pages:
Subjective Happiness Scale (SHS), Risk Propensity Scale (RPS), Visual Analogue Mood Scales
(VAMS), Fear of Spiders (FSQ), Leeds Sleep Evaluation Questionnaire (SEQ/lseq), and the
Political Conservatism Scale.

A `t: range` item looks like (SHS item 1):

```
t: range
- {min=1,max=7,left=not a very happy person,right=a very happy person} In general, I consider myself:
```

Each item carries: a **stem** ("In general, I consider myself:"), a numeric **range**
(`min`/`max`, integer `step`), **left/right endpoint labels**, an optional initial handle
position (`start=`), and an optional `reverse` flag. Ranges vary widely — SHS/FSQ are `1–7`,
RPS is `1–9`, **VAMS and Political-Conservatism are `0–100`**.

Two gaps block a faithful import:

1. **No home for the endpoint labels.** The canonical Option's `number` form has `min`/`max`/
   `step` but only a single `label`/`units` — there is no field for a *pair* of endpoint
   anchors (and sometimes a midpoint). Dropping them would be lossy: "1" and "100" would no
   longer say what they mean.
2. **`t: range` is not parsed at all** and is refused as "no `t: scale` block".

A discrete-ordinal modelling of the slider is ruled out by the data: a `0–100` slider would
become 101 options. So sliders are modelled as `input_data_type: number`.

## Decisions (owner-approved)

- **Slider = `number`** with `min`/`max`/`step` + new native display fields. Uniform across
  `1–7` and `0–100`. (Not ordinal-choice.)
- **New native Option fields** (no `x_` prefix): `min_label`, `max_label`, `center_label`
  (strings), `initial_value` (number). First-class in the schema.
- **No `slider` input_data_type.** "Slider" is a *rendering* decision: a viewer renders a
  `number` option that carries `min_label`/`max_label` as a slider; a plain `number`
  (e.g. `opt_hours_per_week`) stays a numeric input.
- **Also relax the schema to allow unlabeled choices in ordinal scales** (bundled into the
  same `v26.0618` bump, per owner). Independent of sliders; see Part 1.2.
- `measurement_type: interval` for sliders (bipolar/agreement/VAS — equal spacing, no true zero).
- `reverse` → `Prompt.reversed` (existing mechanism, viewer auto-applies).

## Part 1 — Schema change (`schemas/questionnaire`, `v26.0618`, additive)

### 1.1 New Option display fields
Add to `OptionBase.properties` (all optional):

```jsonc
"min_label":     { "type": "string", "minLength": 1 },
"max_label":     { "type": "string", "minLength": 1 },
"center_label":  { "type": "string", "minLength": 1 },
"initial_value": { "type": "number" }
```

These are display hints; they have meaning for any `number` option but are required by none.
`additionalProperties:false` on `OptionBase` means they must be declared to be accepted.

### 1.2 Allow unlabeled ordinal choices
Today `OptionChoiceContent` requires `["index","text"]` with `text` `minLength:1`, so a choice
option listed in `content` must be labelled. Relax to make **`text` optional**:

```jsonc
"OptionChoiceContent": {
  "type": "object",
  "required": ["index"],                       // was ["index","text"]
  "properties": {
    "index": { "type": "integer", "minimum": 1 },
    "text":  { "type": "string", "minLength": 1 }   // optional; non-empty when present
  },
  "additionalProperties": false
}
```

This lets an ordinal scale label only the points it wants (e.g. endpoints) and leave the rest
unlabelled. (Fully-unlabelled scales are already expressible by omitting `content.options`.)
Convention — documented in the CHANGELOG — is that **nominal** scales should still label every
choice; we keep the relaxation simple (no JSON-Schema conditional) and rely on convention.

### 1.3 Version bump mechanics (per `schemas/VERSIONING.md`)
1. Snapshot the current live schema into `versions/v26.0609/` (schema.json + context.jsonld) —
   the live `$id` is already `v26.0609` but no snapshot dir exists yet; this bump creates it.
2. Bump live `schema.json` `version` + `$id` to `v26.0618`.
3. Add the four properties to `context.jsonld` (JSON-LD property URIs) so they're addressable.
4. Add a `CHANGELOG.md` entry: **severity `additive`** (new optional fields; `text` relaxed —
   existing instances stay valid).
5. Add examples: a slider Option (`opt_*` number with labels) + an unlabelled-ordinal Option,
   under `examples/library_examples/options/`.
6. Run `python tools/validate_schemas.py` — green.

Downstream (denormaliser, viewer, Library) need no change: additive fields pass through. Viewer
*slider rendering* is explicitly **out of scope** here (separate viewer task) — the harvester's
job is to emit valid canonical JSON.

## Part 2 — Harvester change (`questionnaire-harvester`)

### 2.1 Data model (`raw.py`) — approach A: per-item options
The current model has one shared `scale: RawScale` for all items. Sliders need **per-item**
options (each item has its own endpoint labels). Change:

- New `RawOption` dataclass generalising an option spec: `input_data_type`, `measurement_type`,
  `selection` (optional), `dimension` (optional), and either `anchors`/`values` (choice) **or**
  `min`/`max`/`step` + `min_label`/`max_label`/`center_label`/`initial_value` (number).
- `RawItem` gains `option: RawOption | None`. When set it overrides the shared scale for that item.
- `RawQuestionnaire.scale: RawScale | None` (None for range — no single shared scale).
- `RawScale` retained for the choice-shared case so existing Likert tests stay green.

### 2.2 Parsing (`psytoolkit.py`)
- Detect `t: range` blocks. Per `-` item line, parse the leading `{min=…,max=…,left=…,right=…,
  start=…,reverse}` brace, then the trailing stem text (the Prompt).
- Build a per-item number `RawOption`: `input_data_type="number"`, `measurement_type="interval"`,
  `min`,`max`,`step` (from `step=` if present, else `1`), `min_label=left`, `max_label=right`,
  `initial_value=start` (omit if absent). `reverse` → `RawItem.reversed`.
- `center_label` exists in the schema (owner request, for completeness/future formats) but
  PsyToolkit `t: range` has no midpoint-label syntax, so this parser never populates it.
- `dimension`: range items have no `scale:` name, so default `dimension="rating"` (sanitised,
  matches `^[a-z][a-z0-9_]+$`).
- The shared `q:` line → instruction (existing path); temporal-context split still applies.
- **Refuse cleanly** (`PsyToolkitParseError` → SKIP, nothing written) for: a page mixing `range`
  with other question types, a range block with no parseable item, or a `{…}` missing `min`/`max`.

### 2.3 Draft / option build (`draft.py`)
- `_build_option` gains a `number` branch: emit `min`/`max`/`step`, `min_label`/`max_label`/
  `center_label`/`initial_value` when present, `content.en.label` (e.g. `"{short_title} {min}–{max}"`),
  and **no** `options[]`/`selection`. Id scheme for number options: `opt_{slug}_{dim}_{min}_{max}`
  (e.g. `opt_shs_rating_1_7`).
- Per-item wiring: when `RawItem.option` is set, mint/reuse that option for the item; else the
  shared scale (unchanged Likert path).
- **Dedup:** `option_fingerprint` extended to fold the number fields (min/max/step/labels) so
  identical sliders collapse (RPS's many identical `1–9 totally disagree/agree` items → one
  shared Option) while distinct ones (SHS) stay separate. Reuse + minting logic unchanged.

### 2.4 Validation / sweep
- Harvester `validate_tree` release bumps to `v26.0618`.
- After implementation, sweep the 6 pages; the whole `output/` tree must validate.

### 2.5 Out of scope (unchanged refusals)
`t: multiradio` (matrix) remains refused. Per owner: matrix *is* modellable later (the shared
`q:` line is the prompt for all items; each item is its own option-set; the "at this moment"
context kept verbatim) — captured as future work, not built here.

## Testing (TDD)

- **Unit (`psytoolkit`):** parse a `{min,max,left,right,start,reverse}` item → correct stem +
  number RawOption; `center=` parsed; refuse a brace missing `min`/`max`; refuse a mixed page.
- **Unit (`draft`):** `_build_option` number branch emits the new fields + no `options[]`;
  per-item dedup collapses identical sliders, keeps distinct ones; `reverse` → `Prompt.reversed`.
- **e2e:** a `t: range` HTML fixture → harvest → validates against `schemas/` (`v26.0618`).
- **Schema:** `tools/validate_schemas.py` green; the two new example files validate.
- Existing 38 harvester tests stay green (Likert path untouched).

## Components & boundaries

| Unit | Responsibility | Depends on |
|---|---|---|
| `schemas/questionnaire` v26.0618 | canonical shape: number display fields + unlabelled ordinal choices | — |
| `raw.py` | format-neutral in-memory model (per-item options) | — |
| `psytoolkit.py` | parse `t: range` → `RawQuestionnaire` | `raw.py` |
| `draft.py` | `RawQuestionnaire` → canonical entities (number option build, dedup) | schema, `raw.py` |
| `validate.py` | tree validates at `v26.0618` | schema |

## Risks

- **Multi-agent shared checkout** — schema files may be touched by other agents; work in an
  isolated worktree, merge via a throwaway-master worktree (harvester convention).
- **Snapshot lag** — creating `versions/v26.0609/` retroactively; verify it matches the live
  pre-bump schema exactly.
- **Dedup correctness** — number fields MUST enter the fingerprint or distinct sliders would
  wrongly merge. Covered by a dedicated test.
