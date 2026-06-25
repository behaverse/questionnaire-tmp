# Editor export: Markdown + SurveyJS

**Date:** 2026-06-25 · **Component:** `editor/` · **Status:** design (pre-implementation)

## Goal

Add two one-way export formats to the Editor's existing **Export ▾** menu, alongside the current
*Export JSON* and *Export bundle*:

1. **Export Markdown** — a human-readable review document of the questionnaire.
2. **Export SurveyJS** — a [SurveyJS](https://surveyjs.io/) survey-JSON file (structure + simple logic).

Both are **one-way** (download only; never re-imported) and render the **locale currently selected**
in the editor's language switcher (`editingLocale`).

## Decisions (settled in brainstorming)

| Question | Decision |
|---|---|
| Markdown purpose | Human-readable review doc (one-way, not round-trippable). |
| Markdown content | Core + metadata (title, instructions, questions, options, + author/license/version/citation header). No logic/scoring internals. |
| SurveyJS fidelity | Structure + simple logic. Map what maps; **drop** scoring + untranslatable logic, surfacing a list of what was dropped. |
| Locale | Current editing locale for both. Re-export after switching to get another language. |
| Placement | Editor only (library-web's public Download is out of scope). |

## Architecture

```
Questionnaire model + entity pool
        │
        ▼
  existing preview projection (editor/src/preview/)   ← single source of truth for
        │   resolved screens / items / options /          reference resolution + widget
        ▼   resolved `content` in the active locale        derivation (reuses web-viewer
  ┌─────────────────┬──────────────────────┐              renderer's deriveWidget, already
  │ toMarkdown(...)  │ toSurveyJS(...)       │              aliased in since ED-B)
  └─────────────────┴──────────────────────┘
        │                      │
   string (.md)        { json, dropped[] }
        │                      │
        ▼                      ▼
   blob download        blob download + DroppedFeaturesDialog(dropped)
```

The serializers are **pure functions** in a new `editor/src/export/` module, mirroring the existing
`editor/src/persistence/file.ts` pattern. They consume the **same resolved projection the live
preview already builds**, so reference resolution and widget derivation are not re-implemented. The
download itself reuses the existing blob-download pattern from `file.ts`.

### Why reuse the preview projection
The preview already resolves the questionnaire model + entity pool into concrete screens with
resolved `content` strings (per locale) and derives the widget kind from each option triple
(`input_data_type` / `measurement_type` / `selection`) via the web-viewer renderer's
`deriveWidget` (`web-viewer/src/renderer/derive.ts`). Exporters consuming that projection stay
correct automatically as the model evolves, and avoid a second, drift-prone resolver.

## Component 1 — Markdown exporter

`editor/src/export/markdown.ts` → `toMarkdown(projection, meta, locale): string`

Output shape (rendered in the active locale):

```markdown
# <title>

> id: <id> · version: <version> · license: <license>
> authors: <author(s)>
> citation: <citation, if present>

<description / top-level instructions>

---

## <page / block title>      (### for nested sections)

**1.** <question prompt text>
   - <option A label>
   - <option B label>

**2.** <free-text question prompt>
   - ____________________ (free text)

**3.** <numeric question prompt>
   - [ number ]
```

Rules:
- Header block lists metadata fields that are present; omit absent ones (no empty `citation:` line).
- Pages/blocks → `##`; within-page sections → `###`.
- Questions numbered sequentially across the whole instrument.
- Choice options → bullet list of their labels; text inputs → an underline placeholder; numeric →
  `[ number ]`. (Widget kind comes from the projection.)
- Logic (show_if/skip/branch), piping, and scoring are **omitted**.
- Filename: `<id>.md`.

## Component 2 — SurveyJS exporter

`editor/src/export/surveyjs.ts` → `toSurveyJS(projection, meta, locale): { json: object; dropped: string[] }`

Emits standard SurveyJS survey JSON:

```jsonc
{
  "title": "<title>",
  "description": "<description>",
  "pages": [
    { "name": "page1", "elements": [ /* questions */ ] }
  ]
}
```

### Widget mapping (from the option triple via `deriveWidget`)

| Our widget kind | SurveyJS `type` | Notes |
|---|---|---|
| `choice.nominal.single` | `radiogroup` | `choices` = `{value, text}` list |
| `choice.ordinal.single` | `rating` | ordered scale; `rateValues` = `{value, text}` |
| `choice.interval.single` | `rating` | ordered scale; `rateValues` = `{value, text}` |
| `choice.ratio.single` | `rating` | ordered scale; `rateValues` = `{value, text}` |
| `choice.nominal.multiple` | `checkbox` | multi-select; `choices` = `{value, text}` |
| `number.ratio` / `number.interval` | `text` | `inputType: "number"` |
| `text.*` | `text` | single-line input. (Upgrade to `comment` only if the model later exposes a multiline/long-form flag — not assumed now.) |
| *(deriveWidget returns null)* | — | dropped (see below) |

### Carried over
- Pages, question titles/descriptions.
- Choices as `{ value, text }` (value = the option's stored value; text = label in the active locale).
- `isRequired` from the question's required flag.
- Simple validators: numeric range → `numeric` validator min/max; text length → `text` validator
  min/max length.
- `visibleIf` **only** when a question's `show_if` is a simple comparison that maps to SurveyJS
  expression syntax (e.g. `{questionName} = <value>`). Anything more complex is dropped.

### Dropped (collected into `dropped[]`, shown to the user)
- Scoring / wasm scorers (no SurveyJS equivalent we attempt).
- Piping (text interpolation).
- Branch / skip navigation rules.
- `show_if` / validation expressions too complex to translate.
- Any question whose widget kind has no SurveyJS mapping.

Each dropped item is a human-readable line, e.g. `Scoring "GAD-7 total" (no SurveyJS equivalent)`
or `Question 4 visibility rule (expression too complex)`. After download, a small
`DroppedFeaturesDialog` lists them so nothing is silently lost. If `dropped[]` is empty, no dialog.

- Filename: `<id>.surveyjs.json`.
- **No new dependency** — we emit a plain JSON object; we do not import `survey-core`.

## UI wiring

`editor/src/app/Topbar.tsx` — add two items to the existing `Menu label="Export"`:
- `Export Markdown` → `exportMarkdown(model, pool, editingLocale)`
- `Export SurveyJS` → `exportSurveyJS(model, pool, editingLocale)` then, if `dropped.length`, open
  `DroppedFeaturesDialog`.

Thin browser-only wrappers (`exportMarkdown` / `exportSurveyJS`) live in `editor/src/export/` and do
the blob download (reusing the `file.ts` download helper), keeping `toMarkdown` / `toSurveyJS` pure.

The existing "not Schema-2-valid — export anyway?" confirm used by *Export JSON* is **not** applied
here (these are lossy review exports by design); invalid-but-resolvable questionnaires still export.

## Testing

- `editor/src/export/markdown.test.ts` — against the editor's built-in BIS/BAS sample: assert the
  header block, a `##` page heading, a numbered question, and its bulleted options appear; assert a
  text/numeric question renders its placeholder.
- `editor/src/export/surveyjs.test.ts` — assert: valid SurveyJS shape (`pages[].elements[]`); a
  single-choice question maps to `radiogroup`/`rating` with the right `choices`; `isRequired` is set;
  a scored questionnaire's `dropped[]` includes the scoring entries; an untranslatable `show_if` is
  dropped rather than mis-emitted.
- Pure functions → no DOM needed. Browser wrappers and the dialog are not unit-tested (DOM
  side-effects), matching the existing `exportToFile` convention.

## Files

| File | Change |
|---|---|
| `editor/src/export/markdown.ts` | NEW — `toMarkdown` + `exportMarkdown` wrapper |
| `editor/src/export/surveyjs.ts` | NEW — `toSurveyJS` + `exportSurveyJS` wrapper |
| `editor/src/export/markdown.test.ts` | NEW |
| `editor/src/export/surveyjs.test.ts` | NEW |
| `editor/src/app/DroppedFeaturesDialog.tsx` | NEW — small modal listing dropped features (reuse existing Modal) |
| `editor/src/app/Topbar.tsx` | EDIT — two new Export-menu items |

No backend, schema, or deployment changes. No new runtime dependencies.

## Out of scope (YAGNI)

- Round-trippable Markdown / a Markdown parser.
- SurveyJS scoring, piping, or full expression translation.
- Multi-locale export in a single file.
- Export from library-web's public catalogue (could follow later if wanted).
