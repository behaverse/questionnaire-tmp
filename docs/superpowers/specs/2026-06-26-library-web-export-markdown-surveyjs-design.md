# library-web export: Markdown + SurveyJS

**Date:** 2026-06-26 · **Component:** `library-web/` · **Status:** design (pre-implementation)

## Goal

Add **Export Markdown** and **Export SurveyJS** to the library-web catalogue **detail page**, next to the
existing **Download JSON** / **Try it** actions, so a catalogue visitor can download a published
questionnaire as a human-readable doc or a SurveyJS survey-JSON. One-way; renders the **language
currently selected on the detail page** (`effectiveLang`).

This ports the editor feature ([2026-06-25-editor-export-markdown-surveyjs-design.md](2026-06-25-editor-export-markdown-surveyjs-design.md))
to library-web. The format decisions are identical; this doc records only the library-web-specific deltas.
The editor version stays (authors export drafts; catalogue users export published instruments).

## Data source

library-web's detail page already builds a per-language `RenderModel` from the fetched
`ResolvedDefinition` via `buildRenderModel(def, lang)` (`src/definition/renderModel.ts`). Both
serializers consume that `RenderModel` — resolution stays in one place. Two small enrichments to
`ItemBlock` are needed so the serializers don't re-resolve:

- `widget?: string` — derived from the option triple (`input_data_type`/`measurement_type`/`selection`)
  of the item's own `option` or its section `shared_option`, via a local `deriveWidget` (the 4 rules
  from the renderer lib: `choice.{m}.single`, `choice.nominal.multiple`, `number.{m}`, `text.{m}`, or null).
- `showIf?: string` — from `DefElement.show_if` (present in canonical Schema-2; add `show_if?: string`
  to the `DefElement` type, which currently omits it).

Scores come from `def.scores` (`ScoreDecl[]`), passed alongside the model.

## Component 1 — Markdown (`src/export/markdown.ts`)

`toMarkdown(model: RenderModel, meta: DefMetadata, lang: string): string`

Same layout as the editor: `# title`; a `>`-quoted metadata header emitting only present fields in order
**id, version, license, authors, citation** (authors = `meta.authors?.map(a => a.name).join(', ')`;
citation = `meta.publication?.citation`); the description; then per page a `---` + `## <page title>`,
`### <section id>` per section, `>`-quoted message text, and questions numbered continuously as
`**N.** <stem>` with option lines (bulleted choice texts; `[ number ]` for numeric; underline
placeholder for free text; `_(choices unavailable in this language)_` when a choice item has no
resolved options; `_(unsupported input)_` for a null widget). No logic/scoring. Filename `<id>.md`.

## Component 2 — SurveyJS (`src/export/surveyjs.ts`)

`toSurveyJS(model: RenderModel, scores: ScoreDecl[], lang: string): { json: Record<string, unknown>; dropped: string[] }`

Standard SurveyJS survey-JSON (`{ title, description, pages: [{ name, title?, elements }] }`). Widget map:

| Widget | SurveyJS `type` |
|---|---|
| `choice.nominal.single` | `radiogroup` (`choices` = `{value,text}`) |
| `choice.{ordinal,interval,ratio}.single` | `rating` (`rateValues` = `{value,text}`) |
| `choice.nominal.multiple` | `checkbox` (`choices` = `{value,text}`) |
| `number.*` | `text` (`inputType: 'number'`) |
| `text.*` | `text` |
| null / unmapped | dropped |

- `value` for a choice = `option.value ?? index`. `name` = the item's number-stable id; SurveyJS question
  `name` = `q<number>` (library-web `ItemBlock` has no element id, so use the continuous item number).
- `isRequired` from `ItemBlock.required`.
- `showIf` → `visibleIf` via the same conservative translator as the editor: `'true'`/empty → omit;
  `'false'` → `visible:false`; simple `<identifier> <op> <literal>` → `{id} <op'> literal`
  (`==`→`=`, `!=`→`<>`); anything else (function calls, `&&`, `||`, `in`, arithmetic) → **dropped**.
  (Note: SurveyJS `visibleIf` references questions by `name`; library-web names questions `q<number>`,
  so a `show_if` referencing an item id will not resolve — acceptable best-effort, same caveat as the editor.)
- **Dropped** (collected, shown to the user): every `def.scores` entry; unmapped widgets; choice items
  with no resolvable options; complex `show_if`.
- **Difference from the editor:** library-web's `ResolvedOption` carries no `min`/`max`, so number
  questions get **no numeric validators**; and the catalogue body exposes no separate `logic[]` array,
  so only per-item `show_if` is considered (no branch/skip/piping drop entries). Filename
  `<id>.surveyjs.json`. No `survey-core` dependency.

## UI

- `src/lib/download.ts` — add `downloadText(text, filename, mime)` (mirrors the editor helper).
- `src/export/index.ts` — wrappers `exportMarkdown(def, lang)` and `exportSurveyJS(def, lang): string[]`
  that call `buildRenderModel(def, lang)`, serialize, trigger `downloadText`, and (SurveyJS) return `dropped`.
- `src/detail/MetadataHeader.tsx` — add two buttons **Export Markdown** and **Export SurveyJS** beside
  **Download JSON** (library-web has no Menu component; plain buttons match the current header and are
  accessible by default). New props `onExportMarkdown` / `onExportSurveyJS`.
- `src/routes/DetailPage.tsx` — wire the two handlers (it already holds the fetched `def` and
  `effectiveLang`); hold `dropped: string[] | null` state and render an **inline dismissible notice**
  listing dropped features when SurveyJS export drops anything (no modal — library-web has none, and an
  inline `role="status"` notice is simpler and accessible).

## Testing

- `src/export/markdown.test.ts`, `src/export/surveyjs.test.ts` — pure-function unit tests against a small
  `RenderModel` fixture (radiogroup item, numeric item, a score, a simple `show_if`, a complex `show_if`):
  assert Markdown structure + SurveyJS shape (`pages[].elements[]`, `radiogroup`/`rating` mapping,
  `isRequired`, `visibleIf` for the simple case, `dropped` includes scoring + the complex condition).
- `src/definition/renderModel.test.ts` — extend: assert `ItemBlock.widget` is derived (e.g. a
  single-choice item → `choice.nominal.single`) and `showIf` is carried through.
- `src/detail/MetadataHeader.test.tsx` — extend: the two new buttons render and fire their callbacks.
- Pure functions → no DOM; the wrappers + DetailPage notice are exercised via the header test + manual smoke.

## Files

| File | Change |
|---|---|
| `src/api/types.ts` | EDIT — add `show_if?: string` to `DefElement` |
| `src/definition/renderModel.ts` | EDIT — `deriveWidget` helper; `widget?`/`showIf?` on `ItemBlock`; populate in `item()` |
| `src/definition/renderModel.test.ts` | EDIT — cover widget + showIf |
| `src/lib/download.ts` | EDIT — add `downloadText` |
| `src/export/markdown.ts` | NEW |
| `src/export/surveyjs.ts` | NEW |
| `src/export/index.ts` | NEW — wrappers |
| `src/export/markdown.test.ts`, `src/export/surveyjs.test.ts` | NEW |
| `src/detail/MetadataHeader.tsx` | EDIT — two buttons + props |
| `src/detail/MetadataHeader.test.tsx` | EDIT |
| `src/routes/DetailPage.tsx` | EDIT — wire handlers + dropped notice |

No backend, schema, or deployment changes. No new runtime dependencies.

## Out of scope (YAGNI)

- Round-trippable Markdown / a parser.
- Numeric validators in SurveyJS (data not served) and branch/skip/piping logic.
- A dropdown menu / modal component (use buttons + inline notice).
- Multi-locale single-file export.
