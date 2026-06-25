# Editor Export: Markdown + SurveyJS — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add two one-way export formats — Markdown (human-readable review doc) and SurveyJS survey-JSON (structure + simple logic) — to the editor's existing Export ▾ menu, rendering the current editing locale.

**Architecture:** Two pure serializers in a new `editor/src/export/` module consume the resolved `Runtime` produced by the existing `projectForPreview` (single source of truth for reference resolution + localized content + widget derivation). A shared `walk.ts` normalizes each item into an `ItemView`. Thin browser wrappers build the runtime and trigger the download; the SurveyJS path surfaces a `DroppedFeaturesDialog` listing anything that couldn't be represented.

**Tech Stack:** TypeScript, React 19, Vitest + React Testing Library, the aliased renderer lib `@behaverse/questionnaire-renderer` (exports `deriveWidget`, `mergeOptions`, `isItem/isSection/isMessage`, and the `Runtime`/`ItemElement`/`OptionEntity`/`MergedChoice`/`MessageElement`/`SectionElement` types).

## Global Constraints

- **One-way exports only.** No parser, no re-import. (spec: Out of scope)
- **Current editing locale.** Both exporters take an explicit `locale` string; never hardcode `en`. Source: `editingLocale ?? model.metadata.language ?? 'en'`.
- **No new runtime dependencies.** SurveyJS output is a plain JSON object; do NOT import `survey-core`.
- **No backend / schema / deployment changes.** Editor-only.
- **Pure serializers are unit-tested; DOM wrappers and dialogs are not** (matches the existing `exportToFile` convention in `editor/src/persistence/file.ts`).
- **Localized-text access patterns (canonical, from `ItemRenderer.tsx`):**
  - prompt: `item.question.prompt?.content?.[locale]?.text ?? ''`
  - context: `item.question.context?.content?.[locale]?.text`
  - instruction: `item.question.instruction?.content?.[locale]?.text`
  - choices: `mergeOptions(item.option, locale)` → `{ index, value, text }[]` (throws `RenderError` if the locale's choice texts are missing — callers MUST catch)
  - text-input placeholder: `item.option.content?.[locale]?.label`
- **Widget kinds (from `deriveWidget`):** `choice.{nominal|ordinal|interval|ratio}.single`, `choice.nominal.multiple`, `number.{ratio|interval}`, `text.{nominal|interval|ratio}`, or `null`.

---

## File Structure

| File | Responsibility |
|---|---|
| `editor/src/export/walk.ts` | Pure helpers: `ItemView` type, `itemView(item, locale, fallbackId)`, `flattenElements(elements, sharedOption?)` (recurse sections, apply `shared_option`). |
| `editor/src/export/markdown.ts` | Pure `toMarkdown(runtime, model, locale): string`. |
| `editor/src/export/surveyjs.ts` | Pure `toSurveyJS(runtime, model, locale): { json, dropped }` + the `show_if`→`visibleIf` translator. |
| `editor/src/export/index.ts` | Browser wrappers `exportMarkdown(model, pool, locale)` and `exportSurveyJS(model, pool, locale): string[]`. |
| `editor/src/export/walk.test.ts`, `markdown.test.ts`, `surveyjs.test.ts` | Unit tests. |
| `editor/src/app/DroppedFeaturesDialog.tsx` | Small modal listing dropped features (reuses existing `Modal`). |
| `editor/src/persistence/file.ts` | EDIT — add reusable `downloadText(text, filename, mime)`. |
| `editor/src/app/Topbar.tsx` | EDIT — two new Export-menu items + dialog state. |

---

## Task 1: Shared walk helpers (`walk.ts`)

**Files:**
- Create: `editor/src/export/walk.ts`
- Test: `editor/src/export/walk.test.ts`

**Interfaces:**
- Consumes: from `@behaverse/questionnaire-renderer` — `deriveWidget`, `mergeOptions`, `isItem`, `isSection`, `isMessage`, and types `ItemElement`, `SectionElement`, `MessageElement`, `RuntimeElement`, `OptionEntity`, `MergedChoice`.
- Produces (later tasks rely on these exact names/types):
  - `interface ItemView { id: string; prompt: string; context?: string; instruction?: string; widget: string | null; choices: MergedChoice[]; choicesError?: string; required: boolean; show_if?: string; option: OptionEntity }`
  - `function itemView(item: ItemElement, locale: string, fallbackId: string): ItemView`
  - `interface FlatEntry { item?: ItemElement; message?: MessageElement; sectionTitle?: string }`
  - `function flattenElements(elements: RuntimeElement[], sharedOption?: OptionEntity, sectionTitle?: string): FlatEntry[]`

- [ ] **Step 1: Write the failing test**

```typescript
// editor/src/export/walk.test.ts
import { describe, it, expect } from 'vitest'
import { itemView, flattenElements } from './walk'
import type { ItemElement, SectionElement } from '@behaverse/questionnaire-renderer'

const choiceItem: ItemElement = {
  id: 'it_q1',
  required: true,
  question: { prompt: { content: { en: { text: 'I plan tasks.' }, fr: { text: 'Je planifie.' } } } },
  option: {
    id: 'opt_agree', input_data_type: 'choice', measurement_type: 'nominal', selection: 'single',
    options: [{ index: 0, value: 1 }, { index: 1, value: 2 }],
    content: { en: { options: [{ index: 0, text: 'No' }, { index: 1, text: 'Yes' }] } },
  },
}

describe('itemView', () => {
  it('resolves prompt + choices + widget for the active locale', () => {
    const v = itemView(choiceItem, 'en', 'q1')
    expect(v.id).toBe('it_q1')
    expect(v.prompt).toBe('I plan tasks.')
    expect(v.required).toBe(true)
    expect(v.widget).toBe('choice.nominal.single')
    expect(v.choices).toEqual([
      { index: 0, value: 1, text: 'No' },
      { index: 1, value: 2, text: 'Yes' },
    ])
    expect(v.choicesError).toBeUndefined()
  })

  it('captures choicesError instead of throwing when the locale texts are missing', () => {
    const v = itemView(choiceItem, 'de', 'q1')
    expect(v.choices).toEqual([])
    expect(v.choicesError).toMatch(/de/)
  })

  it('falls back to the provided id when the item has none', () => {
    const v = itemView({ ...choiceItem, id: undefined }, 'en', 'q7')
    expect(v.id).toBe('q7')
  })
})

describe('flattenElements', () => {
  it('recurses sections, tags section titles, and applies shared_option to optionless items', () => {
    const sharedOpt = choiceItem.option
    const section: SectionElement = {
      title: 'Part A',
      shared_option: sharedOpt,
      elements: [
        { id: 'it_a', question: { prompt: { content: { en: { text: 'A?' } } } } } as unknown as ItemElement,
      ],
    }
    const flat = flattenElements([section])
    expect(flat).toHaveLength(1)
    expect(flat[0].sectionTitle).toBe('Part A')
    expect(flat[0].item?.option).toBe(sharedOpt)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd editor && npx vitest run src/export/walk.test.ts`
Expected: FAIL — `Failed to resolve import './walk'` / `itemView is not a function`.

- [ ] **Step 3: Write the implementation**

```typescript
// editor/src/export/walk.ts
import {
  deriveWidget, mergeOptions, isItem, isSection, isMessage,
  type ItemElement, type SectionElement, type MessageElement,
  type RuntimeElement, type OptionEntity, type MergedChoice,
} from '@behaverse/questionnaire-renderer'

export interface ItemView {
  id: string
  prompt: string
  context?: string
  instruction?: string
  widget: string | null
  choices: MergedChoice[]
  choicesError?: string
  required: boolean
  show_if?: string
  option: OptionEntity
}

export function itemView(item: ItemElement, locale: string, fallbackId: string): ItemView {
  const q = item.question
  const prompt = q.prompt?.content?.[locale]?.text ?? ''
  const context = q.context?.content?.[locale]?.text
  const instruction = q.instruction?.content?.[locale]?.text
  const option = item.option
  const widget = deriveWidget(option)
  let choices: MergedChoice[] = []
  let choicesError: string | undefined
  if (widget && widget.startsWith('choice')) {
    try { choices = mergeOptions(option, locale) }
    catch (e) { choicesError = (e as Error).message }
  }
  return {
    id: item.id ?? fallbackId,
    prompt, context, instruction,
    widget, choices, choicesError,
    required: Boolean(item.required),
    show_if: item.show_if,
    option,
  }
}

export interface FlatEntry {
  item?: ItemElement
  message?: MessageElement
  sectionTitle?: string
}

/** Depth-first flatten: sections contribute their title to each child entry, and their
 *  `shared_option` fills in items that don't carry their own `option`. */
export function flattenElements(
  elements: RuntimeElement[],
  sharedOption?: OptionEntity,
  sectionTitle?: string,
): FlatEntry[] {
  const out: FlatEntry[] = []
  for (const el of elements) {
    if (isSection(el)) {
      const sec = el as SectionElement
      out.push(...flattenElements(sec.elements, sec.shared_option ?? sharedOption, sec.title ?? sectionTitle))
    } else if (isItem(el)) {
      const item = el as ItemElement
      const withOption = item.option ? item : ({ ...item, option: sharedOption } as ItemElement)
      out.push({ item: withOption, sectionTitle })
    } else if (isMessage(el)) {
      out.push({ message: el as MessageElement, sectionTitle })
    }
  }
  return out
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd editor && npx vitest run src/export/walk.test.ts`
Expected: PASS (3 + 1 tests).

- [ ] **Step 5: Commit**

```bash
git add editor/src/export/walk.ts editor/src/export/walk.test.ts
git commit -m "feat(editor/export): shared walk helpers (itemView + flattenElements)"
```

---

## Task 2: Markdown serializer (`markdown.ts`)

**Files:**
- Create: `editor/src/export/markdown.ts`
- Test: `editor/src/export/markdown.test.ts`

**Interfaces:**
- Consumes: `itemView`, `flattenElements` from `./walk`; types `Runtime`, `MessageElement` from `@behaverse/questionnaire-renderer`; `Questionnaire` from `../model/types`.
- Produces: `function toMarkdown(runtime: Runtime, model: Questionnaire, locale: string): string`

- [ ] **Step 1: Write the failing test**

```typescript
// editor/src/export/markdown.test.ts
import { describe, it, expect } from 'vitest'
import { toMarkdown } from './markdown'
import type { Runtime } from '@behaverse/questionnaire-renderer'
import type { Questionnaire } from '../model/types'

const model = {
  metadata: { id: 'qst_demo', title: 'Demo Scale', version: 'v26.0625', license: 'CC-BY-4.0', description: 'Rate each item.' },
  pages: [],
} as unknown as Questionnaire

const runtime: Runtime = {
  provenance: { preview: true },
  metadata: { id: 'qst_demo', title: 'Demo Scale', description: 'Rate each item.', language: 'en' },
  locale: 'en',
  pages: [
    {
      id: 'p1', title: 'Section One',
      elements: [
        { content: { en: { text: 'Please answer honestly.' } } },
        {
          id: 'it_q1', required: true,
          question: { prompt: { content: { en: { text: 'I plan tasks.' } } } },
          option: {
            input_data_type: 'choice', measurement_type: 'nominal', selection: 'single',
            options: [{ index: 0, value: 1 }, { index: 1, value: 2 }],
            content: { en: { options: [{ index: 0, text: 'No' }, { index: 1, text: 'Yes' }] } },
          },
        },
        {
          id: 'it_q2',
          question: { prompt: { content: { en: { text: 'Your age?' } } } },
          option: { input_data_type: 'number', measurement_type: 'ratio', min: 0, max: 120 },
        },
      ],
    },
  ],
}

describe('toMarkdown', () => {
  const md = toMarkdown(runtime, model, 'en')

  it('emits a title and a metadata header block', () => {
    expect(md).toContain('# Demo Scale')
    expect(md).toContain('id: qst_demo')
    expect(md).toContain('version: v26.0625')
    expect(md).toContain('license: CC-BY-4.0')
    expect(md).toContain('Rate each item.')
  })

  it('renders a page heading, a message, and numbered questions with options', () => {
    expect(md).toContain('## Section One')
    expect(md).toContain('Please answer honestly.')
    expect(md).toContain('**1.** I plan tasks.')
    expect(md).toContain('- No')
    expect(md).toContain('- Yes')
    expect(md).toContain('**2.** Your age?')
    expect(md).toContain('[ number 0–120 ]')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd editor && npx vitest run src/export/markdown.test.ts`
Expected: FAIL — `Failed to resolve import './markdown'`.

- [ ] **Step 3: Write the implementation**

```typescript
// editor/src/export/markdown.ts
import type { Runtime, MessageElement } from '@behaverse/questionnaire-renderer'
import type { Questionnaire } from '../model/types'
import { itemView, flattenElements } from './walk'

// Metadata fields rendered in the header block, in order, only when present + string-valued.
const HEADER_FIELDS: { key: string; label: string }[] = [
  { key: 'id', label: 'id' },
  { key: 'version', label: 'version' },
  { key: 'instrument_id', label: 'instrument' },
  { key: 'license', label: 'license' },
  { key: 'citation', label: 'citation' },
]

function headerBlock(meta: Record<string, unknown>): string {
  const lines: string[] = []
  for (const { key, label } of HEADER_FIELDS) {
    const v = meta[key]
    if (typeof v === 'string' && v.trim()) lines.push(`> ${label}: ${v}`)
  }
  return lines.join('\n')
}

function optionLines(widget: string | null, choices: { text: string }[], opt: { min?: number; max?: number }): string {
  if (widget && widget.startsWith('choice')) return choices.map((c) => `   - ${c.text}`).join('\n')
  if (widget && widget.startsWith('number')) {
    const range = opt.min != null && opt.max != null ? ` ${opt.min}–${opt.max}` : ''
    return `   - [ number${range} ]`
  }
  if (widget && widget.startsWith('text')) return '   - ____________________ (free text)'
  return '   - _(unsupported input)_'
}

export function toMarkdown(runtime: Runtime, model: Questionnaire, locale: string): string {
  const meta = (model.metadata ?? {}) as Record<string, unknown>
  const title = runtime.metadata.title || (meta.title as string) || (meta.id as string) || 'Questionnaire'
  const parts: string[] = [`# ${title}`]

  const header = headerBlock(meta)
  if (header) parts.push(header)

  const description = runtime.metadata.description
  if (description) parts.push(description)

  let n = 0
  for (const page of runtime.pages) {
    parts.push('---')
    if (page.title) parts.push(`## ${page.title}`)
    let lastSection: string | undefined
    for (const entry of flattenElements(page.elements)) {
      if (entry.sectionTitle && entry.sectionTitle !== lastSection) {
        parts.push(`### ${entry.sectionTitle}`)
        lastSection = entry.sectionTitle
      }
      if (entry.message) {
        const text = (entry.message as MessageElement).content?.[locale]?.text
        if (text) parts.push(`> ${text}`)
      } else if (entry.item) {
        n += 1
        const v = itemView(entry.item, locale, `q${n}`)
        parts.push(`**${n}.** ${v.prompt}`)
        parts.push(optionLines(v.widget, v.choices, v.option))
      }
    }
  }
  return parts.join('\n\n') + '\n'
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd editor && npx vitest run src/export/markdown.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add editor/src/export/markdown.ts editor/src/export/markdown.test.ts
git commit -m "feat(editor/export): Markdown serializer (core + metadata, active locale)"
```

---

## Task 3: SurveyJS serializer (`surveyjs.ts`)

**Files:**
- Create: `editor/src/export/surveyjs.ts`
- Test: `editor/src/export/surveyjs.test.ts`

**Interfaces:**
- Consumes: `itemView`, `flattenElements` from `./walk`; type `Runtime` from `@behaverse/questionnaire-renderer`; `Questionnaire`, `Score`, `LogicRule` from `../model/types`.
- Produces: `function toSurveyJS(runtime: Runtime, model: Questionnaire, locale: string): { json: Record<string, unknown>; dropped: string[] }`

**Logic translation contract (grounded in `questionnaire-expression-evaluator/test_vectors.json`):**
- `show_if === 'true'` or empty/undefined → always visible (omit `visibleIf`).
- `show_if === 'false'` → set `visible: false`.
- A simple binary comparison `^<identifier> (==|!=|<|<=|>|>=) <literal>$` (literal = number, single-quoted string, or bare word) → `visibleIf: "{<identifier>} <op> <literal>"` with `==`→`=`, `!=`→`<>`. The identifier must equal a question's `name` (we name questions by item id), or it still emits but won't resolve — acceptable for simple cases; anything not matching this shape is **dropped**.
- Everything with function calls (`length(...)`, `score(...)`, `count(...)`, `is_empty(...)`), `&&`, `||`, `in`, or arithmetic → does NOT match → **dropped**.

- [ ] **Step 1: Write the failing test**

```typescript
// editor/src/export/surveyjs.test.ts
import { describe, it, expect } from 'vitest'
import { toSurveyJS } from './surveyjs'
import type { Runtime } from '@behaverse/questionnaire-renderer'
import type { Questionnaire } from '../model/types'

const model = {
  metadata: { id: 'qst_demo', title: 'Demo Scale', language: 'en' },
  pages: [],
  scores: [{ id: 'total', scorer: 'scr_demo@v1', path: '/scores/total/value', name: 'Demo total' }],
  logic: [{ type: 'branch', condition: 'total >= 10', action: {} }],
} as unknown as Questionnaire

const runtime: Runtime = {
  provenance: { preview: true },
  metadata: { id: 'qst_demo', title: 'Demo Scale', language: 'en' },
  locale: 'en',
  pages: [
    {
      id: 'p1', title: 'Page One',
      elements: [
        {
          id: 'it_q1', required: true, show_if: 'true',
          question: { prompt: { content: { en: { text: 'I plan tasks.' } } } },
          option: {
            input_data_type: 'choice', measurement_type: 'nominal', selection: 'single',
            options: [{ index: 0, value: 1 }, { index: 1, value: 2 }],
            content: { en: { options: [{ index: 0, text: 'No' }, { index: 1, text: 'Yes' }] } },
          },
        },
        {
          id: 'it_q2', show_if: 'it_q1 == 2',
          question: { prompt: { content: { en: { text: 'Ordinal item.' } } } },
          option: {
            input_data_type: 'choice', measurement_type: 'ordinal', selection: 'single',
            options: [{ index: 0, value: 1 }, { index: 1, value: 2 }],
            content: { en: { options: [{ index: 0, text: 'Low' }, { index: 1, text: 'High' }] } },
          },
        },
        {
          id: 'it_q3', show_if: 'length(it_name) > 0',
          question: { prompt: { content: { en: { text: 'Complex-logic item.' } } } },
          option: {
            input_data_type: 'choice', measurement_type: 'nominal', selection: 'single',
            options: [{ index: 0, value: 1 }],
            content: { en: { options: [{ index: 0, text: 'Only' }] } },
          },
        },
      ],
    },
  ],
}

describe('toSurveyJS', () => {
  const { json, dropped } = toSurveyJS(runtime, model, 'en')
  const page0 = (json.pages as any[])[0]
  const els = page0.elements as any[]

  it('produces a valid SurveyJS shell with a page of elements', () => {
    expect(json.title).toBe('Demo Scale')
    expect(Array.isArray(json.pages)).toBe(true)
    expect(els.length).toBe(3)
  })

  it('maps single nominal → radiogroup with value/text choices and isRequired', () => {
    const q1 = els.find((e) => e.name === 'it_q1')
    expect(q1.type).toBe('radiogroup')
    expect(q1.isRequired).toBe(true)
    expect(q1.choices).toEqual([{ value: 1, text: 'No' }, { value: 2, text: 'Yes' }])
    expect(q1.visibleIf).toBeUndefined() // show_if 'true' → omitted
  })

  it('maps single ordinal → rating and translates a simple equality show_if', () => {
    const q2 = els.find((e) => e.name === 'it_q2')
    expect(q2.type).toBe('rating')
    expect(q2.rateValues).toEqual([{ value: 1, text: 'Low' }, { value: 2, text: 'High' }])
    expect(q2.visibleIf).toBe('{it_q1} = 2')
  })

  it('drops complex logic and scoring with descriptive messages', () => {
    const q3 = els.find((e) => e.name === 'it_q3')
    expect(q3.visibleIf).toBeUndefined()
    expect(dropped.some((d) => /it_q3/.test(d) && /visibility|show_if/i.test(d))).toBe(true)
    expect(dropped.some((d) => /Demo total|scoring/i.test(d))).toBe(true)
    expect(dropped.some((d) => /branch/i.test(d))).toBe(true)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd editor && npx vitest run src/export/surveyjs.test.ts`
Expected: FAIL — `Failed to resolve import './surveyjs'`.

- [ ] **Step 3: Write the implementation**

```typescript
// editor/src/export/surveyjs.ts
import type { Runtime } from '@behaverse/questionnaire-renderer'
import type { Questionnaire, Score, LogicRule } from '../model/types'
import { itemView, flattenElements, type ItemView } from './walk'

const OP_MAP: Record<string, string> = { '==': '=', '!=': '<>', '<': '<', '<=': '<=', '>': '>', '>=': '>=' }
// identifier <op> literal(number | 'quoted' | bareword)
const SIMPLE = /^\s*([A-Za-z_]\w*)\s*(==|!=|<=|>=|<|>)\s*('[^']*'|-?\d+(?:\.\d+)?|[A-Za-z_]\w*)\s*$/

/** Returns { visibleIf?, visible?, dropped? }. `dropped` set means the condition could not be translated. */
function translateShowIf(expr: string | undefined): { visibleIf?: string; visible?: boolean; dropped?: boolean } {
  const e = (expr ?? '').trim()
  if (e === '' || e === 'true') return {}
  if (e === 'false') return { visible: false }
  const m = SIMPLE.exec(e)
  if (!m) return { dropped: true }
  const [, id, op, lit] = m
  return { visibleIf: `{${id}} ${OP_MAP[op]} ${lit}` }
}

function questionFor(v: ItemView, dropped: string[], n: number): Record<string, unknown> | null {
  const base: Record<string, unknown> = { name: v.id, title: v.prompt }
  if (v.required) base.isRequired = true

  if (v.choicesError) dropped.push(`Question ${n} ("${v.prompt}"): no choice texts in this language`)
  const choices = v.choices.map((c) => ({ value: c.value, text: c.text }))

  const w = v.widget
  if (w === 'choice.nominal.single') { base.type = 'radiogroup'; base.choices = choices }
  else if (w && /^choice\.(ordinal|interval|ratio)\.single$/.test(w)) { base.type = 'rating'; base.rateValues = choices }
  else if (w === 'choice.nominal.multiple') { base.type = 'checkbox'; base.choices = choices }
  else if (w && w.startsWith('number')) {
    base.type = 'text'; base.inputType = 'number'
    const validators: Record<string, unknown>[] = []
    if (v.option.min != null || v.option.max != null) {
      const val: Record<string, unknown> = { type: 'numeric' }
      if (v.option.min != null) val.minValue = v.option.min
      if (v.option.max != null) val.maxValue = v.option.max
      validators.push(val)
    }
    if (validators.length) base.validators = validators
  }
  else if (w && w.startsWith('text')) { base.type = 'text' }
  else { dropped.push(`Question ${n} ("${v.prompt}"): input type not supported by SurveyJS`); return null }

  const t = translateShowIf(v.show_if)
  if (t.dropped) dropped.push(`Question ${n} ("${v.prompt}"): visibility rule (show_if) too complex to translate`)
  else if (t.visibleIf) base.visibleIf = t.visibleIf
  else if (t.visible === false) base.visible = false

  return base
}

export function toSurveyJS(runtime: Runtime, model: Questionnaire, locale: string): { json: Record<string, unknown>; dropped: string[] } {
  const dropped: string[] = []
  const pages: Record<string, unknown>[] = []
  let n = 0

  for (const [i, page] of runtime.pages.entries()) {
    const elements: Record<string, unknown>[] = []
    for (const entry of flattenElements(page.elements)) {
      if (entry.message) continue // SurveyJS html could carry these; omitted by design (review export)
      if (!entry.item) continue
      n += 1
      const q = questionFor(itemView(entry.item, locale, `q${n}`), dropped, n)
      if (q) elements.push(q)
    }
    pages.push({ name: page.id || `page${i + 1}`, ...(page.title ? { title: page.title } : {}), elements })
  }

  const json: Record<string, unknown> = {
    title: runtime.metadata.title || model.metadata.id,
    ...(runtime.metadata.description ? { description: runtime.metadata.description } : {}),
    pages,
  }

  for (const s of (model.scores ?? []) as Score[]) dropped.push(`Scoring "${s.name ?? s.id}" (no SurveyJS equivalent)`)
  for (const r of (model.logic ?? []) as LogicRule[]) dropped.push(`Logic rule (${r.type}) — not exported`)

  return { json, dropped }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd editor && npx vitest run src/export/surveyjs.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add editor/src/export/surveyjs.ts editor/src/export/surveyjs.test.ts
git commit -m "feat(editor/export): SurveyJS serializer (structure + simple visibleIf; drops scoring/complex logic)"
```

---

## Task 4: Browser wrappers, dialog, and Topbar wiring

**Files:**
- Modify: `editor/src/persistence/file.ts` (add `downloadText`)
- Create: `editor/src/export/index.ts`
- Create: `editor/src/app/DroppedFeaturesDialog.tsx`
- Test: `editor/src/app/DroppedFeaturesDialog.test.tsx`
- Modify: `editor/src/app/Topbar.tsx`

**Interfaces:**
- Consumes: `toMarkdown` (`./markdown`), `toSurveyJS` (`./surveyjs`), `projectForPreview` (`../preview/project`), `downloadText` (`../persistence/file`); types `Questionnaire`, `EntityBody` from `../model/types`.
- Produces: `exportMarkdown(model, pool, locale): void`, `exportSurveyJS(model, pool, locale): string[]` (returns the `dropped` list for the dialog).

- [ ] **Step 1: Add `downloadText` to `file.ts`**

Append to `editor/src/persistence/file.ts`:

```typescript
/** Browser-only: trigger a download of `text` under `filename` with the given MIME type. */
export function downloadText(text: string, filename: string, mime: string): void {
  const blob = new Blob([text], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
```

- [ ] **Step 2: Write `editor/src/export/index.ts`**

```typescript
// editor/src/export/index.ts
import type { Questionnaire, EntityBody } from '../model/types'
import { projectForPreview } from '../preview/project'
import { downloadText } from '../persistence/file'
import { toMarkdown } from './markdown'
import { toSurveyJS } from './surveyjs'

function buildRuntime(model: Questionnaire, pool: Record<string, EntityBody>) {
  return projectForPreview(model, (ref) => (pool[ref] as EntityBody) ?? null).runtime
}

export function exportMarkdown(model: Questionnaire, pool: Record<string, EntityBody>, locale: string): void {
  const md = toMarkdown(buildRuntime(model, pool), model, locale)
  downloadText(md, `${model.metadata?.id ?? 'questionnaire'}.md`, 'text/markdown')
}

/** Downloads the SurveyJS JSON and returns the list of dropped features (for the dialog). */
export function exportSurveyJS(model: Questionnaire, pool: Record<string, EntityBody>, locale: string): string[] {
  const { json, dropped } = toSurveyJS(buildRuntime(model, pool), model, locale)
  downloadText(JSON.stringify(json, null, 2), `${model.metadata?.id ?? 'questionnaire'}.surveyjs.json`, 'application/json')
  return dropped
}
```

- [ ] **Step 3: Write the failing dialog test**

```tsx
// editor/src/app/DroppedFeaturesDialog.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DroppedFeaturesDialog } from './DroppedFeaturesDialog'

describe('DroppedFeaturesDialog', () => {
  it('lists each dropped feature', () => {
    render(<DroppedFeaturesDialog items={['Scoring "Demo total" (no SurveyJS equivalent)', 'Logic rule (branch) — not exported']} onClose={vi.fn()} />)
    expect(screen.getByText(/Scoring "Demo total"/)).toBeInTheDocument()
    expect(screen.getByText(/Logic rule \(branch\)/)).toBeInTheDocument()
  })
})
```

- [ ] **Step 4: Run it to verify it fails**

Run: `cd editor && npx vitest run src/app/DroppedFeaturesDialog.test.tsx`
Expected: FAIL — cannot resolve `./DroppedFeaturesDialog`.

- [ ] **Step 5: Write `DroppedFeaturesDialog.tsx`**

The accessible `Modal` (commit 8fb40d4d) takes `label` (not `title`), `onClose`, and `children`:

```tsx
// editor/src/app/DroppedFeaturesDialog.tsx
import { Modal } from '../ui/Modal'

export function DroppedFeaturesDialog({ items, onClose }: { items: string[]; onClose: () => void }) {
  return (
    <Modal label="Exported with some features dropped" onClose={onClose}>
      <p className="text-sm text-ed-muted">
        The SurveyJS file was downloaded, but these features have no SurveyJS equivalent and were left out:
      </p>
      <ul className="mt-2 list-disc pl-5 text-sm">
        {items.map((it, i) => <li key={i}>{it}</li>)}
      </ul>
    </Modal>
  )
}
```


- [ ] **Step 6: Run the dialog test to verify it passes**

Run: `cd editor && npx vitest run src/app/DroppedFeaturesDialog.test.tsx`
Expected: PASS.

- [ ] **Step 7: Wire the two menu items into `Topbar.tsx`**

In `editor/src/app/Topbar.tsx`:
1. Add imports:
```tsx
import { FileText, FileCode } from 'lucide-react'
import { exportMarkdown, exportSurveyJS } from '../export'
import { DroppedFeaturesDialog } from './DroppedFeaturesDialog'
import { useState } from 'react'
```
2. Read the locale + dialog state inside the component (alongside the existing `model`/`pool`):
```tsx
const editingLocale = useEditorStore((s) => s.editingLocale)
const [dropped, setDropped] = useState<string[] | null>(null)
const locale = editingLocale ?? model.metadata.language ?? 'en'
```
3. Add two items to the existing `Menu label="Export"` `items={[...]}` array, after "Export bundle":
```tsx
{ label: 'Export Markdown', icon: FileText, title: 'Download a human-readable Markdown document (current language)', onClick: () => exportMarkdown(model, pool, locale) },
{ label: 'Export SurveyJS', icon: FileCode, title: 'Download a SurveyJS survey JSON (structure + simple logic; current language)', onClick: () => { const d = exportSurveyJS(model, pool, locale); if (d.length) setDropped(d) } },
```
4. Render the dialog near the end of the returned JSX:
```tsx
{dropped && <DroppedFeaturesDialog items={dropped} onClose={() => setDropped(null)} />}
```

- [ ] **Step 8: Typecheck + full editor test suite + build**

Run: `cd editor && npx tsc -b && npx vitest run && npm run build`
Expected: tsc clean; all tests pass (existing + new); build succeeds.

- [ ] **Step 9: Manual smoke (browser)**

Run: `cd editor && npm run build:lib && npm run dev` then in the browser: Load sample (BIS/BAS) → Export ▾ → **Export Markdown** (a `.md` downloads with title, header, numbered questions + options) and **Export SurveyJS** (a `.surveyjs.json` downloads; if the sample has logic/scoring, the dropped-features dialog appears). Switch the editing-locale and re-export to confirm the language follows.

- [ ] **Step 10: Commit**

```bash
git add editor/src/persistence/file.ts editor/src/export/index.ts editor/src/app/DroppedFeaturesDialog.tsx editor/src/app/DroppedFeaturesDialog.test.tsx editor/src/app/Topbar.tsx
git commit -m "feat(editor/export): Export Markdown + Export SurveyJS menu items + dropped-features dialog"
```

---

## Self-Review Notes (verification against spec)

- **Markdown: core + metadata, current locale, one-way** → Task 2 (`toMarkdown`, `HEADER_FIELDS`, locale param). ✓
- **SurveyJS: structure + simple logic, dropped list + dialog** → Task 3 (`toSurveyJS`, `translateShowIf`) + Task 4 (dialog). ✓
- **Widget mapping table** → Task 3 `questionFor` (radiogroup/rating/checkbox/text+number). ✓
- **Reuse preview projection + deriveWidget/mergeOptions** → Task 1 (`walk.ts`) + Task 4 (`projectForPreview`). ✓
- **Current editing locale** → `editingLocale ?? metadata.language ?? 'en'` (Task 4 Topbar). ✓
- **No new deps; emit plain object** → Task 3 returns `Record<string, unknown>`; no `survey-core` import. ✓
- **Tests for both serializers incl. dropped flags scoring** → Tasks 1–3. ✓
- **No invalid-export confirm gate** (lossy by design) → wrappers don't call `confirm`. ✓
```
