# library-web Export: Markdown + SurveyJS — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Add Export Markdown + Export SurveyJS to the library-web catalogue detail page, beside Download JSON, rendering the detail page's current language.

**Architecture:** Both serializers consume library-web's existing per-language `RenderModel` (enriched with a derived `widget` and a carried `showIf` per item). Thin wrappers build the model from the fetched `ResolvedDefinition` and trigger a text download; the SurveyJS path surfaces a list of dropped features in an inline notice on the detail page.

**Tech Stack:** TypeScript, React 19, Vitest + React Testing Library. No new runtime dependencies.

## Global Constraints

- One-way exports only; no parser/re-import.
- Render the detail page's current language (`effectiveLang`); the wrapper passes it to `buildRenderModel`. The serializers consume the already-resolved `RenderModel`, so they take NO `lang` param.
- No new runtime dependency — SurveyJS output is a plain object; do NOT import `survey-core`.
- No backend / schema / deployment changes.
- Pure serializers are unit-tested; the DOM wrappers + DetailPage notice are not (matches `downloadJson` convention in `src/lib/download.ts`).
- SurveyJS widget map: `choice.nominal.single`→`radiogroup`(choices); `choice.{ordinal,interval,ratio}.single`→`rating`(rateValues); `choice.nominal.multiple`→`checkbox`(choices); `number.*`→`text` inputType `number` (NO validators — `ResolvedOption` has no min/max); `text.*`→`text`; null widget→drop.
- show_if→visibleIf contract: `'true'`/empty→omit; `'false'`→`visible:false`; simple `<identifier> <op> <literal>` (op ∈ == != < <= > >=; literal = number | single-quoted string | bareword)→`visibleIf:"{id} <op'> literal"` with `==`→`=`, `!=`→`<>`; anything else→drop.
- Every `def.scores` entry → `dropped`. Choice item with no resolvable options → drop the question. Filenames: `<id>.md`, `<id>.surveyjs.json`.

---

## Task 1: Foundation — RenderModel widget/showIf, type, downloadText

**Files:**
- Modify: `library-web/src/api/types.ts` (add `show_if?` to `DefElement`)
- Modify: `library-web/src/definition/renderModel.ts` (`deriveWidget`, `widget`/`showIf` on `ItemBlock`)
- Modify: `library-web/src/definition/renderModel.test.ts` (cover widget + showIf)
- Modify: `library-web/src/lib/download.ts` (add `downloadText`)

**Interfaces produced (later tasks rely on these):**
- `ItemBlock` gains `widget: string | null` and `showIf?: string`.
- `downloadText(text: string, filename: string, mime: string): void`

- [ ] **Step 1: Add `show_if?` to `DefElement`** in `src/api/types.ts`. Find `export interface DefElement {` and add the field near `required?`:

```typescript
  required?: boolean
  show_if?: string
```

- [ ] **Step 2: Write failing renderModel test additions** in `src/definition/renderModel.test.ts`. Add a new `it` inside the existing `describe('buildRenderModel', ...)`. Use the file's existing `def` fixture shape; add an element with a single-choice option and a `show_if`. Append this test (adapt the fixture inline so it is self-contained):

```typescript
  it('derives an item widget from the option triple and carries show_if', () => {
    const d = {
      metadata: { id: 'q', title: 'T', version: 'v1', language: 'en' },
      pages: [{ elements: [
        {
          id: 'it_a', required: true, show_if: 'it_b == 2',
          question: { prompt: { content: { en: { text: 'Q?' } } } },
          option: {
            input_data_type: 'choice', measurement_type: 'nominal', selection: 'single',
            options: [{ index: 0, value: 1 }],
            content: { en: { options: [{ index: 0, text: 'Yes' }] } },
          },
        },
      ] }],
    }
    const m = buildRenderModel(d as never, 'en')
    const item = m.pages[0].blocks[0] as { widget: string | null; showIf?: string }
    expect(item.widget).toBe('choice.nominal.single')
    expect(item.showIf).toBe('it_b == 2')
  })
```

- [ ] **Step 3: Run it to verify it fails**

Run: `cd library-web && npx vitest run src/definition/renderModel.test.ts`
Expected: FAIL — `item.widget` is `undefined` (property doesn't exist yet).

- [ ] **Step 4: Implement in `src/definition/renderModel.ts`**

(a) Add the `widget`/`showIf` fields to the `ItemBlock` interface (after `unresolved: boolean`):

```typescript
  unresolved: boolean
  widget: string | null
  showIf?: string
```

(b) Add a `deriveWidget` helper above `buildRenderModel` (mirrors the renderer lib's rules):

```typescript
const CHOICE_M = new Set(['nominal', 'ordinal', 'interval', 'ratio'])
const NUMBER_M = new Set(['ratio', 'interval'])
const TEXT_M = new Set(['nominal', 'interval', 'ratio'])

/** design/05a §13 widget table, mirrored locally for export. Null for undefined combos. */
function deriveWidget(option: ResolvedOption | undefined): string | null {
  if (!option) return null
  const i = option.input_data_type
  const m = option.measurement_type ?? ''
  const s = option.selection
  if (i === 'choice' && CHOICE_M.has(m) && s === 'single') return `choice.${m}.single`
  if (i === 'choice' && m === 'nominal' && s === 'multiple') return 'choice.nominal.multiple'
  if (i === 'number' && NUMBER_M.has(m)) return `number.${m}`
  if (i === 'text' && TEXT_M.has(m)) return `text.${m}`
  return null
}
```

(c) In the `item(el, sharedOption?)` function, the local `const option = el.option ?? sharedOption` already exists. Add `widget` and `showIf` to the returned object (after `unresolved: ...`):

```typescript
      unresolved: prompt?._unresolved === true,
      widget: deriveWidget(option),
      showIf: el.show_if,
```

- [ ] **Step 5: Run it to verify it passes**

Run: `cd library-web && npx vitest run src/definition/renderModel.test.ts`
Expected: PASS (existing tests + the new one).

- [ ] **Step 6: Add `downloadText` to `src/lib/download.ts`** (after the existing `downloadJson`):

```typescript
/** Trigger a download of `text` under `filename` with the given MIME type. */
export function downloadText(text: string, filename: string, mime: string): void {
  const blob = new Blob([text], { type: mime })
  const url = URL.createObjectURL(blob)
  try {
    downloadUrl(url, filename)
  } finally {
    URL.revokeObjectURL(url)
  }
}
```

- [ ] **Step 7: Typecheck + commit**

Run: `cd library-web && npx tsc -b && npx vitest run src/definition/renderModel.test.ts`
Expected: tsc clean; tests pass.

```bash
git add library-web/src/api/types.ts library-web/src/definition/renderModel.ts library-web/src/definition/renderModel.test.ts library-web/src/lib/download.ts
git commit -m "feat(library-web/export): derive item widget + carry show_if in RenderModel; add downloadText"
```

---

## Task 2: Markdown serializer

**Files:**
- Create: `library-web/src/export/markdown.ts`
- Test: `library-web/src/export/markdown.test.ts`

**Interfaces:**
- Consumes: `RenderModel`, `ItemBlock`, `MessageBlock`, `SectionBlock` from `../definition/renderModel`; `DefMetadata` from `../api/types`.
- Produces: `function toMarkdown(model: RenderModel, meta: DefMetadata): string`

- [ ] **Step 1: Write the failing test**

```typescript
// library-web/src/export/markdown.test.ts
import { describe, it, expect } from 'vitest'
import { toMarkdown } from './markdown'
import type { RenderModel } from '../definition/renderModel'
import type { DefMetadata } from '../api/types'

const meta = {
  id: 'qst_demo', title: 'Demo Scale', version: 'v26.0625', license: 'CC-BY-4.0',
  description: 'Rate each item.', authors: [{ name: 'Ada L.' }],
  publication: { citation: 'Lovelace 1843' },
} as unknown as DefMetadata

const model: RenderModel = {
  pages: [{
    id: 'p1', title: 'Section One',
    blocks: [
      { kind: 'message', text: 'Please answer honestly.', unresolved: false },
      { kind: 'item', number: 1, stem: 'I plan tasks.', required: true, unresolved: false,
        widget: 'choice.nominal.single',
        options: [{ index: 0, text: 'No', value: 1 }, { index: 1, text: 'Yes', value: 2 }] },
      { kind: 'item', number: 2, stem: 'Your age?', required: false, unresolved: false,
        widget: 'number.ratio', options: [] },
    ],
  }],
}

describe('toMarkdown', () => {
  const md = toMarkdown(model, meta)
  it('emits title + metadata header', () => {
    expect(md).toContain('# Demo Scale')
    expect(md).toContain('id: qst_demo')
    expect(md).toContain('version: v26.0625')
    expect(md).toContain('license: CC-BY-4.0')
    expect(md).toContain('authors: Ada L.')
    expect(md).toContain('citation: Lovelace 1843')
    expect(md).toContain('Rate each item.')
  })
  it('renders page heading, message, numbered questions + options', () => {
    expect(md).toContain('## Section One')
    expect(md).toContain('> Please answer honestly.')
    expect(md).toContain('**1.** I plan tasks.')
    expect(md).toContain('- No')
    expect(md).toContain('- Yes')
    expect(md).toContain('**2.** Your age?')
    expect(md).toContain('[ number ]')
  })
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd library-web && npx vitest run src/export/markdown.test.ts`
Expected: FAIL — cannot resolve `./markdown`.

- [ ] **Step 3: Implement `src/export/markdown.ts`**

```typescript
import type { RenderModel, ItemBlock, MessageBlock, SectionBlock } from '../definition/renderModel'
import type { DefMetadata } from '../api/types'

const HEADER: { key: keyof DefMetadata; label: string; fmt?: (v: never) => string }[] = [
  { key: 'id', label: 'id' },
  { key: 'version', label: 'version' },
  { key: 'license', label: 'license' },
]

function headerBlock(meta: DefMetadata): string {
  const lines: string[] = []
  for (const { key, label } of HEADER) {
    const v = meta[key]
    if (typeof v === 'string' && v.trim()) lines.push(`> ${label}: ${v}`)
  }
  const authors = meta.authors?.map((a) => a.name).filter(Boolean).join(', ')
  if (authors) lines.push(`> authors: ${authors}`)
  const citation = meta.publication?.citation
  if (typeof citation === 'string' && citation.trim()) lines.push(`> citation: ${citation}`)
  return lines.join('\n')
}

function optionLines(item: ItemBlock): string {
  const w = item.widget
  if (w && w.startsWith('choice')) {
    if (item.options.length === 0) return '   - _(choices unavailable in this language)_'
    return item.options.map((o) => `   - ${o.text}`).join('\n')
  }
  if (w && w.startsWith('number')) return '   - [ number ]'
  if (w && w.startsWith('text')) return '   - ____________________ (free text)'
  return '   - _(unsupported input)_'
}

function renderItem(item: ItemBlock, parts: string[]): void {
  parts.push(`**${item.number}.** ${item.stem}`)
  parts.push(optionLines(item))
}

export function toMarkdown(model: RenderModel, meta: DefMetadata): string {
  const parts: string[] = [`# ${meta.title || meta.id || 'Questionnaire'}`]
  const header = headerBlock(meta)
  if (header) parts.push(header)
  if (meta.description) parts.push(meta.description)

  for (const page of model.pages) {
    parts.push('---')
    if (page.title) parts.push(`## ${page.title}`)
    for (const block of page.blocks) {
      if (block.kind === 'message') {
        const text = (block as MessageBlock).text
        if (text) parts.push(`> ${text}`)
      } else if (block.kind === 'section') {
        const sec = block as SectionBlock
        if (sec.id) parts.push(`### ${sec.id}`)
        for (const it of sec.items) renderItem(it, parts)
      } else {
        renderItem(block as ItemBlock, parts)
      }
    }
  }
  return parts.join('\n\n') + '\n'
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `cd library-web && npx vitest run src/export/markdown.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add library-web/src/export/markdown.ts library-web/src/export/markdown.test.ts
git commit -m "feat(library-web/export): Markdown serializer (core + metadata)"
```

---

## Task 3: SurveyJS serializer

**Files:**
- Create: `library-web/src/export/surveyjs.ts`
- Test: `library-web/src/export/surveyjs.test.ts`

**Interfaces:**
- Consumes: `RenderModel`, `ItemBlock`, `SectionBlock` from `../definition/renderModel`; `ScoreDecl` from `../api/types`.
- Produces: `function toSurveyJS(model: RenderModel, scores: ScoreDecl[]): { json: Record<string, unknown>; dropped: string[] }`

- [ ] **Step 1: Write the failing test**

```typescript
// library-web/src/export/surveyjs.test.ts
import { describe, it, expect } from 'vitest'
import { toSurveyJS } from './surveyjs'
import type { RenderModel } from '../definition/renderModel'
import type { ScoreDecl } from '../api/types'

const model: RenderModel = {
  pages: [{
    id: 'p1', title: 'Page One',
    blocks: [
      { kind: 'item', number: 1, stem: 'I plan tasks.', required: true, unresolved: false,
        widget: 'choice.nominal.single', showIf: 'true',
        options: [{ index: 0, text: 'No', value: 1 }, { index: 1, text: 'Yes', value: 2 }] },
      { kind: 'item', number: 2, stem: 'Ordinal item.', required: false, unresolved: false,
        widget: 'choice.ordinal.single', showIf: 'q1 == 2',
        options: [{ index: 0, text: 'Low', value: 1 }, { index: 1, text: 'High', value: 2 }] },
      { kind: 'item', number: 3, stem: 'Complex.', required: false, unresolved: false,
        widget: 'choice.nominal.single', showIf: 'length(name) > 0',
        options: [{ index: 0, text: 'Only', value: 1 }] },
    ],
  }],
}
const scores: ScoreDecl[] = [{ id: 'total', scorer: 'scr_demo@v1', path: '/x', name: 'Demo total' }]

describe('toSurveyJS', () => {
  const { json, dropped } = toSurveyJS(model, scores)
  const els = (json.pages as any[])[0].elements as any[]

  it('builds a page of elements with the title', () => {
    expect(json.title).toBe(undefined) // title comes from meta in the wrapper; serializer omits it
    expect(els.length).toBe(3)
  })
  it('maps nominal-single → radiogroup with value/text choices + isRequired; show_if true omitted', () => {
    const q1 = els.find((e) => e.name === 'q1')
    expect(q1.type).toBe('radiogroup')
    expect(q1.isRequired).toBe(true)
    expect(q1.choices).toEqual([{ value: 1, text: 'No' }, { value: 2, text: 'Yes' }])
    expect(q1.visibleIf).toBeUndefined()
  })
  it('maps ordinal-single → rating and translates a simple equality show_if', () => {
    const q2 = els.find((e) => e.name === 'q2')
    expect(q2.type).toBe('rating')
    expect(q2.rateValues).toEqual([{ value: 1, text: 'Low' }, { value: 2, text: 'High' }])
    expect(q2.visibleIf).toBe('{q1} = 2')
  })
  it('drops complex show_if and scoring with messages', () => {
    const q3 = els.find((e) => e.name === 'q3')
    expect(q3.visibleIf).toBeUndefined()
    expect(dropped.some((d) => /q3/.test(d) && /show_if|visibility/i.test(d))).toBe(true)
    expect(dropped.some((d) => /Demo total|scoring/i.test(d))).toBe(true)
  })
})
```

Note: `json.title` is intentionally left to the wrapper (which has `DefMetadata`); the serializer sets only `description?` if you pass it — here it sets neither, so `json.title` is `undefined`. Keep the serializer's `json` as `{ pages }` plus an optional `description` only if you choose to thread it; the test above asserts `title` is `undefined`.

- [ ] **Step 2: Run to verify it fails**

Run: `cd library-web && npx vitest run src/export/surveyjs.test.ts`
Expected: FAIL — cannot resolve `./surveyjs`.

- [ ] **Step 3: Implement `src/export/surveyjs.ts`**

```typescript
import type { RenderModel, ItemBlock, SectionBlock } from '../definition/renderModel'
import type { ScoreDecl } from '../api/types'

const OP_MAP: Record<string, string> = { '==': '=', '!=': '<>', '<': '<', '<=': '<=', '>': '>', '>=': '>=' }
const SIMPLE = /^\s*([A-Za-z_]\w*)\s*(==|!=|<=|>=|<|>)\s*('[^']*'|-?\d+(?:\.\d+)?|[A-Za-z_]\w*)\s*$/

function translateShowIf(expr: string | undefined): { visibleIf?: string; visible?: boolean; dropped?: boolean } {
  const e = (expr ?? '').trim()
  if (e === '' || e === 'true') return {}
  if (e === 'false') return { visible: false }
  const m = SIMPLE.exec(e)
  if (!m) return { dropped: true }
  const [, id, op, lit] = m
  return { visibleIf: `{${id}} ${OP_MAP[op]} ${lit}` }
}

function questionFor(item: ItemBlock, dropped: string[]): Record<string, unknown> | null {
  const name = `q${item.number}`
  const base: Record<string, unknown> = { name, title: item.stem }
  if (item.required) base.isRequired = true
  const choices = item.options.map((o) => ({ value: o.value ?? o.index, text: o.text }))
  const w = item.widget

  if (w === 'choice.nominal.single') {
    if (choices.length === 0) { dropped.push(`Question ${item.number} ("${name}"): no choices in this language`); return null }
    base.type = 'radiogroup'; base.choices = choices
  } else if (w && /^choice\.(ordinal|interval|ratio)\.single$/.test(w)) {
    if (choices.length === 0) { dropped.push(`Question ${item.number} ("${name}"): no choices in this language`); return null }
    base.type = 'rating'; base.rateValues = choices
  } else if (w === 'choice.nominal.multiple') {
    if (choices.length === 0) { dropped.push(`Question ${item.number} ("${name}"): no choices in this language`); return null }
    base.type = 'checkbox'; base.choices = choices
  } else if (w && w.startsWith('number')) {
    base.type = 'text'; base.inputType = 'number'
  } else if (w && w.startsWith('text')) {
    base.type = 'text'
  } else {
    dropped.push(`Question ${item.number} ("${name}"): input type not supported by SurveyJS`); return null
  }

  const t = translateShowIf(item.showIf)
  if (t.dropped) dropped.push(`Question ${item.number} ("${name}"): visibility rule (show_if) too complex to translate`)
  else if (t.visibleIf) base.visibleIf = t.visibleIf
  else if (t.visible === false) base.visible = false

  return base
}

export function toSurveyJS(model: RenderModel, scores: ScoreDecl[]): { json: Record<string, unknown>; dropped: string[] } {
  const dropped: string[] = []
  const pages: Record<string, unknown>[] = []

  for (const [i, page] of model.pages.entries()) {
    const elements: Record<string, unknown>[] = []
    for (const block of page.blocks) {
      if (block.kind === 'message') continue
      if (block.kind === 'section') {
        for (const it of (block as SectionBlock).items) {
          const q = questionFor(it, dropped); if (q) elements.push(q)
        }
      } else {
        const q = questionFor(block as ItemBlock, dropped); if (q) elements.push(q)
      }
    }
    pages.push({ name: page.id || `page${i + 1}`, ...(page.title ? { title: page.title } : {}), elements })
  }

  for (const s of scores) dropped.push(`Scoring "${s.name ?? s.id}" (no SurveyJS equivalent)`)

  return { json: { pages }, dropped }
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `cd library-web && npx vitest run src/export/surveyjs.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add library-web/src/export/surveyjs.ts library-web/src/export/surveyjs.test.ts
git commit -m "feat(library-web/export): SurveyJS serializer (structure + simple visibleIf; drops scoring/complex logic)"
```

---

## Task 4: Wrappers + header buttons + DetailPage notice

**Files:**
- Create: `library-web/src/export/index.ts`
- Modify: `library-web/src/detail/MetadataHeader.tsx` + `library-web/src/detail/MetadataHeader.test.tsx`
- Modify: `library-web/src/routes/DetailPage.tsx`

**Interfaces:**
- Consumes: `buildRenderModel` (`../definition/renderModel`), `toMarkdown` (`./markdown`), `toSurveyJS` (`./surveyjs`), `downloadText` (`../lib/download`), `ResolvedDefinition` (`../api/types`).
- Produces: `exportMarkdown(def, lang): void`, `exportSurveyJS(def, lang): string[]`.

- [ ] **Step 1: Write `src/export/index.ts`**

```typescript
import type { ResolvedDefinition } from '../api/types'
import { buildRenderModel } from '../definition/renderModel'
import { downloadText } from '../lib/download'
import { toMarkdown } from './markdown'
import { toSurveyJS } from './surveyjs'

export function exportMarkdown(def: ResolvedDefinition, lang: string): void {
  const md = toMarkdown(buildRenderModel(def, lang), def.metadata)
  downloadText(md, `${def.metadata.id}.md`, 'text/markdown')
}

/** Downloads the SurveyJS JSON; returns the list of dropped features (for the inline notice). */
export function exportSurveyJS(def: ResolvedDefinition, lang: string): string[] {
  const { json, dropped } = toSurveyJS(buildRenderModel(def, lang), def.scores ?? [])
  const withTitle = { title: def.metadata.title, ...(def.metadata.description ? { description: def.metadata.description } : {}), ...json }
  downloadText(JSON.stringify(withTitle, null, 2), `${def.metadata.id}.surveyjs.json`, 'application/json')
  return dropped
}
```

- [ ] **Step 2: Add buttons to `MetadataHeader.tsx`.** Add two props to `MetadataHeaderProps`:

```typescript
  onExportMarkdown: () => void
  onExportSurveyJS: () => void
```

Destructure them in the component signature alongside `onDownload`. Then, immediately after the existing `Download JSON` `<button>...</button>` (around line 99), add two sibling buttons using the SAME className as the Download JSON button (copy its `className` verbatim so styling matches):

```tsx
        <button type="button" className={/* same className as Download JSON */ ''} onClick={onExportMarkdown}>
          Markdown
        </button>
        <button type="button" className={/* same className as Download JSON */ ''} onClick={onExportSurveyJS}>
          SurveyJS
        </button>
```

Replace the `className={''}` placeholders with the exact class string the Download JSON `<button>` uses.

- [ ] **Step 3: Extend `MetadataHeader.test.tsx`** — add a test that the two buttons render and fire callbacks:

```tsx
it('renders Markdown + SurveyJS export buttons and fires their callbacks', async () => {
  const onMd = vi.fn(); const onSjs = vi.fn()
  // render MetadataHeader with the same required props the other tests use, plus:
  //   onExportMarkdown={onMd} onExportSurveyJS={onSjs}
  // then:
  await userEvent.click(screen.getByRole('button', { name: 'Markdown' }))
  await userEvent.click(screen.getByRole('button', { name: 'SurveyJS' }))
  expect(onMd).toHaveBeenCalled(); expect(onSjs).toHaveBeenCalled()
})
```

Match the existing test file's render setup (props, imports of `vi`, `userEvent`/`screen`). If the existing tests use a render helper, reuse it and add the two new props.

- [ ] **Step 4: Wire `DetailPage.tsx`.** It already has the fetched definition (the same object passed to `buildRenderModel` for `previewHref`/render) and `effectiveLang`, and passes `onDownload` to `MetadataHeader`. Add:

```tsx
import { exportMarkdown, exportSurveyJS } from '../export'
import { useState } from 'react' // if not already imported
// inside the component, where `def` (ResolvedDefinition) and `effectiveLang` are in scope:
const [dropped, setDropped] = useState<string[] | null>(null)
```

Pass two handlers to `MetadataHeader` (use the actual in-scope variable name for the resolved definition — likely `def` or `definition`):

```tsx
onExportMarkdown={() => exportMarkdown(def, effectiveLang)}
onExportSurveyJS={() => { const d = exportSurveyJS(def, effectiveLang); setDropped(d.length ? d : null) }}
```

And render an inline notice near the top of the detail content (only when `dropped`):

```tsx
{dropped && (
  <div role="status" className="my-3 rounded border border-amber-300 bg-amber-50 p-3 text-sm">
    <div className="flex items-start justify-between gap-3">
      <div>
        <strong>SurveyJS exported with some features dropped:</strong>
        <ul className="mt-1 list-disc pl-5">{dropped.map((d, i) => <li key={i}>{d}</li>)}</ul>
      </div>
      <button type="button" className="shrink-0 underline" onClick={() => setDropped(null)}>Dismiss</button>
    </div>
  </div>
)}
```

If the resolved-definition variable in `DetailPage.tsx` is not literally `def`, use whatever it is named (inspect the file). If `def` could be loading/undefined, guard the handlers so they only run when it is present (the buttons live under the same loaded branch as Download JSON, so it is in scope there).

- [ ] **Step 5: Full check**

Run: `cd library-web && npx tsc -b && npx vitest run && npm run build`
Expected: tsc clean; ALL tests pass; build succeeds.

- [ ] **Step 6: Manual smoke**

Run `cd library-web && VITE_API_BASE_URL=http://localhost:8000 npm run dev -- --port 5175` (Library API on :8000 with `LIBRARY_CORS_ORIGINS=http://localhost:5175`), open a questionnaire detail page → click **Markdown** (a `.md` downloads) and **SurveyJS** (a `.surveyjs.json` downloads; the dropped notice appears if the instrument declares scores). Switch the detail-page language and re-export to confirm it follows.

- [ ] **Step 7: Commit**

```bash
git add library-web/src/export/index.ts library-web/src/detail/MetadataHeader.tsx library-web/src/detail/MetadataHeader.test.tsx library-web/src/routes/DetailPage.tsx
git commit -m "feat(library-web/export): Markdown + SurveyJS buttons on detail page + dropped-features notice"
```

---

## Self-Review Notes (against spec)

- Markdown core+metadata, current locale (RenderModel pre-resolved), one-way → Task 2. ✓
- SurveyJS widget map + simple visibleIf + dropped list (scores, complex show_if, unsupported widgets, empty choices) → Task 3. ✓
- Enrich RenderModel with widget+showIf (single source of truth) → Task 1. ✓
- UI = buttons (no Menu) + inline notice (no Modal) beside Download JSON → Task 4. ✓
- No new dependency; plain object; `title`/`description` added in the wrapper from `DefMetadata` → Task 4. ✓
- No min/max validators, no branch/skip logic (not served) — documented constraint. ✓
```
