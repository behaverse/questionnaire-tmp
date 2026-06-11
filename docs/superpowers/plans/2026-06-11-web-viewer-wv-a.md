# Web Viewer WV-A Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `web-viewer/` — the participant-facing SPA shell + session bootstrap + Schema 3 renderer with Typeform-class focus presentation (one question per view), per the approved spec [2026-06-11-web-viewer-wv-a-design.md](../specs/2026-06-11-web-viewer-wv-a-design.md).

**Architecture:** A Vite + React 19 + TS + Tailwind SPA (mirrors `library-web/`). Pure logic (option merge, widget derivation, step flattening, theme vars, param parsing) lives in small tested modules; presentation splits into a reusable `src/renderer/` library (OD-03 boundary — no app imports) and an `src/app/` shell (reducer, bootstrap, chrome, transitions). The runtime is flattened into `steps[]` (focus = one element per step; classic = one page per step); a reducer drives navigation with required-gating and auto-advance.

**Tech Stack:** Vite 6, React 19, TypeScript 5.7, Tailwind 3.4, vitest + React Testing Library + vitest-axe, Ajv (manifest validation). One additive FastAPI change in `viewer-service/` (CORS).

**Branch:** create `wv-a-web-viewer` from `master` before Task 1; merge to master locally + push at the end (no PRs — owner preference).

**Conventions for every task:** run commands from `web-viewer/` unless stated; tests are colocated `*.test.ts(x)` next to sources (library-web pattern); commit after each green task.

---

## File map (what gets created)

| Path | Responsibility |
|---|---|
| `web-viewer/package.json`, `vite.config.ts`, `tailwind.config.ts`, `postcss.config.js`, `tsconfig*.json`, `index.html`, `src/vitest.setup.ts`, `src/index.css`, `src/main.tsx` | Scaffold (Task 1) |
| `src/renderer/types.ts` | Faithful-projection Schema 3 TS types + `AnswerValue` + `RenderError` |
| `src/renderer/guards.ts` | `isItem` / `isSection` / `isMessage` shape guards |
| `src/renderer/keys.ts` | Stable answer-key derivation (`elementKey`, fallbacks) |
| `src/renderer/merge.ts` | `mergeOptions(option, locale)` |
| `src/renderer/derive.ts` | `deriveWidget(option)` |
| `src/renderer/widgets/*.tsx` | RadioGroup, CheckboxGroup, NumberInput, TextInput, MessageBlock, UnsupportedElement, MatrixGroup |
| `src/renderer/ItemRenderer.tsx`, `SectionRenderer.tsx`, `StepRenderer.tsx` | Element dispatch + prompt/context/instruction layout |
| `src/renderer/index.ts` | Renderer public API |
| `src/app/steps.ts` | `flattenSteps`, `requiredUnanswered`, `isSingleChoiceItem` |
| `src/app/theme.ts` | `themeToCssVars`, `applyTheme` |
| `src/app/bootstrap.ts` | `parseParams`, `mintSession` (typed errors) |
| `src/app/session.ts` | `SessionState` reducer |
| `src/app/chrome/strings.ts`, `ErrorScreen.tsx`, `ProgressBar.tsx`, `NavButtons.tsx`, `StepTransition.tsx` | Chrome |
| `src/app/App.tsx` | State machine: boot → error \| ready(step i) → finished; fixture mode; Enter/auto-advance |
| `src/fixtures/{mini,matrix,widgets}.json` | Dev/test runtimes (denormaliser-true shape) |
| `web-viewer/manifest.json` + `scripts/validate-manifest.mjs` | Schema 7 manifest + CI validation |
| `web-viewer/README.md`, `FOLLOWUPS.md` | Docs |
| `viewer-service/src/viewer_service/api/app.py` (modify) | Additive CORS middleware (`VS_CORS_ORIGINS`) |

---

### Task 1: Scaffold `web-viewer/`

**Files:** Create everything in the Scaffold row above.

- [ ] **Step 1: Branch + scaffold configs.** `git checkout -b wv-a-web-viewer` (repo root). Create `web-viewer/` and copy the build/test scaffolding pattern from `library-web/` (read each file there first):
  - `package.json` — name `questionnaire-web-viewer`, same script set (`dev`, `build` = `tsc -b && vite build`, `typecheck`, `test` = `vitest run && node scripts/validate-manifest.mjs`, `test:watch`, `preview`), same dependency versions as `library-web/package.json` but **drop** `@tanstack/react-query`, `react-router-dom`, `react-markdown`, `rehype-*`, `remark-gfm`, `@playwright/test`; **add** devDeps `vitest-axe@^0.1.0`, `axe-core@^4.10.0`, `ajv@^8.17.0`, `ajv-formats@^3.0.0`.
  - `vite.config.ts` — copy library-web's verbatim (vitest merged config, jsdom, `setupFiles: ['./src/vitest.setup.ts']`, `css: false`).
  - `tsconfig.json` / `tsconfig.node.json` / `tsconfig.test.json` — copy from library-web, adjust include paths if they reference library-web-specific dirs.
  - `postcss.config.js` — copy verbatim.
  - `src/vitest.setup.ts`:

```ts
import '@testing-library/jest-dom/vitest'
import * as matchers from 'vitest-axe/matchers'
import { expect } from 'vitest'
expect.extend(matchers)
```

- [ ] **Step 2: Tailwind config aliased to theme vars.** `tailwind.config.ts`:

```ts
import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: 'var(--qv-primary)',
        secondary: 'var(--qv-secondary)',
        success: 'var(--qv-success)',
        warning: 'var(--qv-warning)',
        error: 'var(--qv-error)',
        surface: 'var(--qv-background)',
      },
      fontFamily: { theme: ['var(--qv-font-family)'] },
    },
  },
  plugins: [],
} satisfies Config
```

- [ ] **Step 3: `src/index.css`** — Tailwind directives + theme-var defaults (mirroring the VS built-in `default` theme) + step animations:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --qv-primary: #1a5fb4;
  --qv-secondary: #613583;
  --qv-success: #26734d;
  --qv-warning: #8f6000;
  --qv-error: #a51d2d;
  --qv-background: #ffffff;
  --qv-font-family: Inter, system-ui, sans-serif;
  --qv-base-size: 16px;
  --qv-space-unit: 8px;
}
html { font-size: var(--qv-base-size); }
body { font-family: var(--qv-font-family); background: var(--qv-background); }

@keyframes qv-step-in  { from { opacity: 0; transform: translateY(1.25rem) } to { opacity: 1; transform: none } }
@keyframes qv-step-out { to   { opacity: 0; transform: translateY(-1.25rem) } }
.qv-step-enter { animation: qv-step-in 220ms ease-out both; }
.qv-step-leave { animation: qv-step-out 200ms ease-in both; }
@media (prefers-reduced-motion: reduce) {
  .qv-step-enter, .qv-step-leave { animation: none; }
}
```

- [ ] **Step 4: `index.html`** (root div + `/src/main.tsx` module script, `lang="en"` placeholder, title "Questionnaire"), `src/main.tsx`:

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { App } from './app/App'

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>)
```

and a placeholder `src/app/App.tsx`:

```tsx
export function App() {
  return <main className="min-h-screen grid place-items-center font-theme">questionnaire-web-viewer</main>
}
```

plus a smoke test `src/app/App.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { App } from './App'

test('renders', () => {
  render(<App />)
  expect(screen.getByRole('main')).toBeInTheDocument()
})
```

- [ ] **Step 5: stub manifest script** so `npm test` passes before Task 13 — `scripts/validate-manifest.mjs` containing `console.log('manifest validation: no manifest yet (Task 13)')`.
- [ ] **Step 6: Install + verify.** Run: `cd web-viewer && npm install && npm test && npm run build`. Expected: 1 test passes, clean build.
- [ ] **Step 7: Commit.** `git add web-viewer && git commit -m "feat(web-viewer): scaffold WV-A SPA (Vite+React19+TS+Tailwind, theme-var styling)"` (repo root; `node_modules`/`dist` are covered by the root `.gitignore` — verify with `git status`, add `web-viewer/.gitignore` with `node_modules/`+`dist/` if not).

---

### Task 2: Renderer types, guards, keys + `mergeOptions`

**Files:** Create `src/renderer/types.ts`, `src/renderer/guards.ts`, `src/renderer/keys.ts`, `src/renderer/merge.ts`, `src/renderer/merge.test.ts`, `src/renderer/guards.test.ts`.

- [ ] **Step 1: Write `types.ts`** (no test — exercised by everything else):

```ts
/** Faithful-projection Schema 3 shapes (ground truth:
 *  questionnaire-runtime-denormaliser/tests/fixtures/mini_phq.py — NOT schemas/runtime/examples/). */
export type LocaleContent = {
  status?: string
  text?: string
  label?: string
  units?: string
  options?: { index: number; text: string }[]
}
export type ContentMap = Record<string, LocaleContent>
export type ContentEntity = { id?: string; name?: string; content?: ContentMap }

export type OptionEntity = {
  id?: string
  input_data_type: string
  measurement_type: string
  selection?: string
  min?: number
  max?: number
  step?: number
  options?: { index: number; value: number | string }[]
  content?: ContentMap
}

export type Question = { prompt?: ContentEntity; context?: ContentEntity; instruction?: ContentEntity }
export type ItemElement = {
  id?: string
  question: Question
  option: OptionEntity
  required?: boolean
  show_if?: string
}
export type SectionElement = {
  id?: string
  title?: string
  shared_option?: OptionEntity
  elements: RuntimeElement[]
  show_if?: string
}
export type MessageElement = ContentEntity
export type RuntimeElement = ItemElement | SectionElement | MessageElement | Record<string, unknown>

export type RuntimePage = { id: string; title?: string; elements: RuntimeElement[] }
export type Runtime = {
  provenance: Record<string, unknown>
  metadata: { id: string; title: string; description?: string; language: string }
  locale?: string
  available_locales?: string[]
  style?: Record<string, unknown>
  flow?: Record<string, unknown>
  pages: RuntimePage[]
  scores?: unknown[]
  logic?: unknown[]
}

export type AnswerValue = number | string | (number | string)[] | null
export type MergedChoice = { index: number; value: number | string; text: string }

export class RenderError extends Error {}
```

- [ ] **Step 2: Write failing tests for guards + merge.** `guards.test.ts`:

```ts
import { isItem, isSection, isMessage } from './guards'

const item = { question: { prompt: { content: { en: { text: 'P' } } } }, option: { input_data_type: 'choice', measurement_type: 'ordinal', selection: 'single' } }
const section = { id: 'sec_1', elements: [item] }
const message = { id: 'msg_1', content: { en: { text: 'Welcome' } } }

test('isItem matches question+option shape only', () => {
  expect(isItem(item)).toBe(true)
  expect(isItem(section)).toBe(false)
  expect(isItem(message)).toBe(false)
})
test('isSection matches elements-array shape (and items/messages are not sections)', () => {
  expect(isSection(section)).toBe(true)
  expect(isSection(item)).toBe(false)
})
test('isMessage matches content-bearing non-item non-section', () => {
  expect(isMessage(message)).toBe(true)
  expect(isMessage(item)).toBe(false)
  expect(isMessage(section)).toBe(false)
})
```

`merge.test.ts`:

```ts
import { mergeOptions } from './merge'
import { RenderError, type OptionEntity } from './types'

const opt: OptionEntity = {
  input_data_type: 'choice', measurement_type: 'ordinal', selection: 'single',
  options: [{ index: 1, value: 0 }, { index: 2, value: 1 }],
  content: { en: { options: [{ index: 1, text: 'Not at all' }, { index: 2, text: 'Several days' }] } },
}

test('joins structural options with locale texts on index', () => {
  expect(mergeOptions(opt, 'en')).toEqual([
    { index: 1, value: 0, text: 'Not at all' },
    { index: 2, value: 1, text: 'Several days' },
  ])
})
test('throws RenderError when a choice has no text for the locale', () => {
  const broken = { ...opt, content: { en: { options: [{ index: 1, text: 'Only one' }] } } }
  expect(() => mergeOptions(broken, 'en')).toThrow(RenderError)
})
test('throws RenderError when the locale is absent entirely', () => {
  expect(() => mergeOptions(opt, 'pt')).toThrow(RenderError)
})
test('non-choice options merge to empty list', () => {
  expect(mergeOptions({ input_data_type: 'number', measurement_type: 'ratio' }, 'en')).toEqual([])
})
```

- [ ] **Step 3: Run to verify failure.** Run: `npx vitest run src/renderer`. Expected: FAIL (modules not found).
- [ ] **Step 4: Implement.** `guards.ts`:

```ts
import type { ItemElement, MessageElement, RuntimeElement, SectionElement } from './types'

export function isItem(el: RuntimeElement): el is ItemElement {
  return typeof el === 'object' && el !== null && 'question' in el && 'option' in el
}
export function isSection(el: RuntimeElement): el is SectionElement {
  return typeof el === 'object' && el !== null && 'elements' in el && Array.isArray((el as SectionElement).elements)
}
export function isMessage(el: RuntimeElement): el is MessageElement {
  return typeof el === 'object' && el !== null && 'content' in el && !isItem(el) && !isSection(el)
}
```

`keys.ts`:

```ts
import type { RuntimeElement } from './types'

/** Stable answer key: the element's own id when present, else a positional fallback. */
export function elementKey(el: RuntimeElement, fallback: string): string {
  const id = (el as { id?: unknown }).id
  return typeof id === 'string' && id.length > 0 ? id : fallback
}
export const pageElementFallback = (pageId: string, i: number) => `${pageId}__el${i}`
export const sectionChildFallback = (sectionKey: string, j: number) => `${sectionKey}__r${j}`
```

`merge.ts`:

```ts
import { RenderError, type MergedChoice, type OptionEntity } from './types'

export function mergeOptions(option: OptionEntity, locale: string): MergedChoice[] {
  const structural = option.options ?? []
  if (structural.length === 0) return []
  const texts = option.content?.[locale]?.options
  if (!texts) throw new RenderError(`option ${option.id ?? '<inline>'}: no '${locale}' choice texts`)
  const byIndex = new Map(texts.map((t) => [t.index, t.text]))
  return structural.map(({ index, value }) => {
    const text = byIndex.get(index)
    if (text === undefined) throw new RenderError(`option ${option.id ?? '<inline>'}: no '${locale}' text for choice index ${index}`)
    return { index, value, text }
  })
}
```

- [ ] **Step 5: Run to verify pass.** Run: `npx vitest run src/renderer`. Expected: PASS (7 tests).
- [ ] **Step 6: Commit.** `git add web-viewer/src/renderer && git commit -m "feat(web-viewer): renderer types, shape guards, answer keys, option merge"`

---

### Task 3: `deriveWidget`

**Files:** Create `src/renderer/derive.ts`, `src/renderer/derive.test.ts`.

- [ ] **Step 1: Failing test** (`derive.test.ts`) — the full design/05a §13 table + rejections:

```ts
import { deriveWidget } from './derive'

const o = (input_data_type: string, measurement_type: string, selection?: string) =>
  ({ input_data_type, measurement_type, selection })

test.each([
  ['choice', 'nominal', 'single', 'choice.nominal.single'],
  ['choice', 'ordinal', 'single', 'choice.ordinal.single'],
  ['choice', 'interval', 'single', 'choice.interval.single'],
  ['choice', 'ratio', 'single', 'choice.ratio.single'],
  ['choice', 'nominal', 'multiple', 'choice.nominal.multiple'],
])('%s/%s/%s → %s', (i, m, s, expected) => {
  expect(deriveWidget(o(i, m, s))).toBe(expected)
})
test.each([
  ['number', 'ratio', 'number.ratio'],
  ['number', 'interval', 'number.interval'],
  ['text', 'nominal', 'text.nominal'],
  ['text', 'interval', 'text.interval'],
  ['text', 'ratio', 'text.ratio'],
])('%s/%s → %s', (i, m, expected) => {
  expect(deriveWidget(o(i, m))).toBe(expected)
})
test.each([
  ['choice', 'ordinal', 'multiple'],   // not in the §13 table
  ['choice', 'ordinal', undefined],    // choice requires selection
  ['number', 'nominal', undefined],
  ['date', 'interval', undefined],     // unknown input type
])('rejects %s/%s/%s', (i, m, s) => {
  expect(deriveWidget(o(i, m, s))).toBeNull()
})
```

- [ ] **Step 2: Run to verify fail.** `npx vitest run src/renderer/derive.test.ts` → FAIL.
- [ ] **Step 3: Implement** (`derive.ts`):

```ts
import type { OptionEntity } from './types'

export type WidgetKind = string

const CHOICE_M = new Set(['nominal', 'ordinal', 'interval', 'ratio'])
const NUMBER_M = new Set(['ratio', 'interval'])
const TEXT_M = new Set(['nominal', 'interval', 'ratio'])

/** design/05a_reusable_entities.md §13. Returns null for combinations the table doesn't define. */
export function deriveWidget(option: OptionEntity): WidgetKind | null {
  const { input_data_type: i, measurement_type: m, selection: s } = option
  if (i === 'choice' && CHOICE_M.has(m) && s === 'single') return `choice.${m}.single`
  if (i === 'choice' && m === 'nominal' && s === 'multiple') return 'choice.nominal.multiple'
  if (i === 'number' && NUMBER_M.has(m)) return `number.${m}`
  if (i === 'text' && TEXT_M.has(m)) return `text.${m}`
  return null
}
```

- [ ] **Step 4: Run to verify pass.** `npx vitest run src/renderer/derive.test.ts` → PASS (14).
- [ ] **Step 5: Commit.** `git commit -am "feat(web-viewer): widget derivation from the Option triple (design/05a §13)"`

---

### Task 4: `flattenSteps` + `requiredUnanswered` + `isSingleChoiceItem`

**Files:** Create `src/app/steps.ts`, `src/app/steps.test.ts`.

- [ ] **Step 1: Failing tests** (`steps.test.ts`):

```ts
import { flattenSteps, requiredUnanswered, isSingleChoiceItem } from './steps'
import type { Runtime } from '../renderer/types'

const opt = {
  input_data_type: 'choice', measurement_type: 'ordinal', selection: 'single',
  options: [{ index: 1, value: 0 }],
  content: { en: { options: [{ index: 1, text: 'A' }] } },
}
const item = (id?: string, required = false) =>
  ({ ...(id ? { id } : {}), question: { prompt: { content: { en: { text: 'P' } } } }, option: opt, required })
const message = { id: 'msg_intro', content: { en: { text: 'Welcome' } } }
const section = { id: 'sec_m', shared_option: opt, elements: [item('it_a', true), item(undefined, true)] }

const runtime = (style: Record<string, unknown> = {}): Runtime => ({
  provenance: {}, metadata: { id: 'qst_x', title: 'T', language: 'en' }, locale: 'en', style,
  pages: [
    { id: 'page_1', elements: [message, item('it_1', true)] },
    { id: 'page_2', elements: [section, item(undefined)] },
  ],
})

test('focus mode (default): one step per element; sections stay whole; page_id retained', () => {
  const steps = flattenSteps(runtime())
  expect(steps.map((s) => s.pageId)).toEqual(['page_1', 'page_1', 'page_2', 'page_2'])
  expect(steps.map((s) => s.elements.length)).toEqual([1, 1, 1, 1])
  expect(steps[1].elements[0].key).toBe('it_1')
  expect(steps[2].elements[0].key).toBe('sec_m')
  expect(steps[3].elements[0].key).toBe('page_2__el1') // positional fallback for id-less element
})
test('classic mode: one step per page', () => {
  const steps = flattenSteps(runtime({ x_presentation: 'classic' }))
  expect(steps).toHaveLength(2)
  expect(steps[0].elements.map((e) => e.key)).toEqual(['msg_intro', 'it_1'])
})
test('requiredUnanswered: items + matrix rows individually; messages never block', () => {
  const steps = flattenSteps(runtime())
  expect(requiredUnanswered(steps[0], {})).toEqual([])               // message step
  expect(requiredUnanswered(steps[1], {})).toEqual(['it_1'])
  expect(requiredUnanswered(steps[1], { it_1: 0 })).toEqual([])
  expect(requiredUnanswered(steps[2], { it_a: 0 })).toEqual(['sec_m__r1'])
  expect(requiredUnanswered(steps[1], { it_1: '' })).toEqual(['it_1'])  // empty string ≠ answered
  expect(requiredUnanswered(steps[1], { it_1: [] })).toEqual(['it_1'])  // empty array ≠ answered
})
test('isSingleChoiceItem: true for choice.*.single item steps only', () => {
  const steps = flattenSteps(runtime())
  expect(isSingleChoiceItem(steps[1])).toBe(true)   // radio item
  expect(isSingleChoiceItem(steps[0])).toBe(false)  // message
  expect(isSingleChoiceItem(steps[2])).toBe(false)  // section
})
```

- [ ] **Step 2: Run to verify fail.** `npx vitest run src/app/steps.test.ts` → FAIL.
- [ ] **Step 3: Implement** (`steps.ts`):

```ts
import { deriveWidget } from '../renderer/derive'
import { isItem, isSection } from '../renderer/guards'
import { elementKey, pageElementFallback, sectionChildFallback } from '../renderer/keys'
import type { AnswerValue, Runtime, RuntimeElement } from '../renderer/types'

export type StepElement = { key: string; element: RuntimeElement }
export type Step = { pageId: string; elements: StepElement[] }
export type PresentationMode = 'focus' | 'classic'

export function presentationMode(runtime: Runtime): PresentationMode {
  return runtime.style?.x_presentation === 'classic' ? 'classic' : 'focus'
}

export function flattenSteps(runtime: Runtime): Step[] {
  const mode = presentationMode(runtime)
  if (mode === 'classic') {
    return runtime.pages.map((p) => ({
      pageId: p.id,
      elements: p.elements.map((el, i) => ({ key: elementKey(el, pageElementFallback(p.id, i)), element: el })),
    }))
  }
  return runtime.pages.flatMap((p) =>
    p.elements.map((el, i) => ({
      pageId: p.id,
      elements: [{ key: elementKey(el, pageElementFallback(p.id, i)), element: el }],
    })),
  )
}

function answered(v: AnswerValue | undefined): boolean {
  if (v === undefined || v === null || v === '') return false
  return !(Array.isArray(v) && v.length === 0)
}

export function requiredUnanswered(step: Step, answers: Record<string, AnswerValue>): string[] {
  const missing: string[] = []
  const visit = (el: RuntimeElement, key: string) => {
    if (isSection(el)) {
      el.elements.forEach((c, j) => visit(c, elementKey(c, sectionChildFallback(key, j))))
    } else if (isItem(el) && el.required && !answered(answers[key])) {
      missing.push(key)
    }
  }
  for (const { key, element } of step.elements) visit(element, key)
  return missing
}

export function isSingleChoiceItem(step: Step): boolean {
  if (step.elements.length !== 1) return false
  const el = step.elements[0].element
  return isItem(el) && (deriveWidget(el.option)?.endsWith('.single') ?? false)
}
```

- [ ] **Step 4: Run to verify pass.** `npx vitest run src/app/steps.test.ts` → PASS.
- [ ] **Step 5: Commit.** `git commit -am "feat(web-viewer): step flattening (focus/classic), required gating, single-choice detection"`

---

### Task 5: `themeToCssVars` + `parseParams` + `mintSession`

**Files:** Create `src/app/theme.ts`, `src/app/theme.test.ts`, `src/app/bootstrap.ts`, `src/app/bootstrap.test.ts`.

- [ ] **Step 1: Failing tests.** `theme.test.ts`:

```ts
import { themeToCssVars } from './theme'

const vsTheme = {
  theme_id: 'default', name: 'Behaverse Default',
  palette: { primary: '#1a5fb4', secondary: '#613583', success: '#26734d', warning: '#8f6000', error: '#a51d2d', background: '#ffffff' },
  typography: { font_family: 'Georgia, serif', base_size: 18 },
  spacing: { unit: 8 }, logo_url: null, custom_css: null,
}

test('maps the VS theme bundle onto --qv-* vars', () => {
  expect(themeToCssVars(vsTheme)).toEqual({
    '--qv-primary': '#1a5fb4', '--qv-secondary': '#613583', '--qv-success': '#26734d',
    '--qv-warning': '#8f6000', '--qv-error': '#a51d2d', '--qv-background': '#ffffff',
    '--qv-font-family': 'Georgia, serif', '--qv-base-size': '18px', '--qv-space-unit': '8px',
  })
})
test('null theme → no overrides (index.css defaults stand)', () => {
  expect(themeToCssVars(null)).toEqual({})
})
test('partial theme maps only what it has', () => {
  expect(themeToCssVars({ palette: { primary: '#000000' } })).toEqual({ '--qv-primary': '#000000' })
})
```

`bootstrap.test.ts`:

```ts
import { mintSession, parseParams } from './bootstrap'

test('parseParams reads deployment/locale/viewer_url/fixture', () => {
  expect(parseParams('?deployment=dpl_1&locale=pt&viewer_url=http://vs:9&fixture=mini')).toEqual({
    deploymentId: 'dpl_1', locale: 'pt', vsBaseUrl: 'http://vs:9', fixture: 'mini',
  })
  expect(parseParams('')).toEqual({ deploymentId: null, locale: null, vsBaseUrl: 'http://localhost:8001', fixture: null })
})

const ok = { session_id: 's1', session_token: 't1', runtime: { metadata: {} }, theme: null }

test('mintSession posts viewer identity and returns the bundle', async () => {
  const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(ok), { status: 200 }))
  vi.stubGlobal('fetch', fetchMock)
  const res = await mintSession('http://vs:9', 'dpl_1', 'pt')
  expect(res).toEqual({ ok: true, ...ok })
  const [url, init] = fetchMock.mock.calls[0]
  expect(url).toBe('http://vs:9/v1/sessions/new')
  expect(JSON.parse((init as RequestInit).body as string)).toEqual({
    deployment_id: 'dpl_1', viewer_id: 'behaverse-web-viewer', viewer_version: 'v26.0611', locale: 'pt',
  })
})
test.each([
  [404, 'invalid_link'], [409, 'not_open'], [410, 'closed'], [422, 'failed'], [500, 'failed'],
])('HTTP %i → %s', async (status, kind) => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
    new Response(JSON.stringify({ error: { code: 'x', message: 'm' } }), { status })))
  const res = await mintSession('http://vs:9', 'dpl_1', null)
  expect(res).toEqual({ ok: false, kind, code: 'x' })
})
test('network failure → failed/network', async () => {
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('fetch failed')))
  expect(await mintSession('http://vs:9', 'dpl_1', null)).toEqual({ ok: false, kind: 'failed', code: 'network' })
})
```

- [ ] **Step 2: Run to verify fail.** `npx vitest run src/app/theme.test.ts src/app/bootstrap.test.ts` → FAIL.
- [ ] **Step 3: Implement.** `theme.ts`:

```ts
export type Theme = {
  theme_id?: string
  name?: string
  palette?: Record<string, string>
  typography?: { font_family?: string; base_size?: number }
  spacing?: { unit?: number }
  logo_url?: string | null
  custom_css?: string | null
} | null

const PALETTE = ['primary', 'secondary', 'success', 'warning', 'error', 'background'] as const

export function themeToCssVars(theme: Theme): Record<string, string> {
  if (!theme) return {}
  const vars: Record<string, string> = {}
  for (const key of PALETTE) {
    const v = theme.palette?.[key]
    if (v) vars[`--qv-${key}`] = v
  }
  if (theme.typography?.font_family) vars['--qv-font-family'] = theme.typography.font_family
  if (theme.typography?.base_size) vars['--qv-base-size'] = `${theme.typography.base_size}px`
  if (theme.spacing?.unit) vars['--qv-space-unit'] = `${theme.spacing.unit}px`
  return vars
}

export function applyTheme(theme: Theme): void {
  for (const [k, v] of Object.entries(themeToCssVars(theme))) document.documentElement.style.setProperty(k, v)
}
```

`bootstrap.ts` (the viewer's identity constants live here; `VIEWER_VERSION` must match `manifest.json`):

```ts
import type { Runtime } from '../renderer/types'
import type { Theme } from './theme'

export const VIEWER_ID = 'behaverse-web-viewer'
export const VIEWER_VERSION = 'v26.0611'

export type Params = { deploymentId: string | null; locale: string | null; vsBaseUrl: string; fixture: string | null }

export function parseParams(search: string): Params {
  const q = new URLSearchParams(search)
  return {
    deploymentId: q.get('deployment'),
    locale: q.get('locale'),
    vsBaseUrl: q.get('viewer_url') ?? import.meta.env.VITE_VS_BASE_URL ?? 'http://localhost:8001',
    fixture: q.get('fixture'),
  }
}

export type MintOk = { ok: true; session_id: string; session_token: string; runtime: Runtime; theme: Theme }
export type MintErr = { ok: false; kind: 'invalid_link' | 'not_open' | 'closed' | 'failed'; code: string }
export type MintResult = MintOk | MintErr

const KIND_BY_STATUS: Record<number, MintErr['kind']> = { 404: 'invalid_link', 409: 'not_open', 410: 'closed' }

export async function mintSession(vsBaseUrl: string, deploymentId: string, locale: string | null): Promise<MintResult> {
  let resp: Response
  try {
    resp = await fetch(`${vsBaseUrl}/v1/sessions/new`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        deployment_id: deploymentId, viewer_id: VIEWER_ID, viewer_version: VIEWER_VERSION,
        ...(locale ? { locale } : {}),
      }),
    })
  } catch {
    return { ok: false, kind: 'failed', code: 'network' }
  }
  if (resp.ok) {
    const body = await resp.json()
    return { ok: true, session_id: body.session_id, session_token: body.session_token, runtime: body.runtime, theme: body.theme ?? null }
  }
  const code = await resp.json().then((b) => b?.error?.code ?? String(resp.status)).catch(() => String(resp.status))
  return { ok: false, kind: KIND_BY_STATUS[resp.status] ?? 'failed', code }
}
```

Note: `parseParams('')` test expects the default VS URL — run vitest without `VITE_VS_BASE_URL` set (it is unset in this repo; do not add an `.env`).

- [ ] **Step 4: Run to verify pass.** `npx vitest run src/app` → PASS.
- [ ] **Step 5: Commit.** `git commit -am "feat(web-viewer): theme CSS vars + URL params + typed session mint"`

---### Task 6: Chrome (strings, ErrorScreen, ProgressBar, NavButtons, StepTransition)

**Files:** Create `src/app/chrome/strings.ts`, `ErrorScreen.tsx`, `ProgressBar.tsx`, `NavButtons.tsx`, `StepTransition.tsx`, `chrome.test.tsx` (one colocated test file for the four components).

- [ ] **Step 1: Failing tests** (`src/app/chrome/chrome.test.tsx`):

```tsx
import { render, screen } from '@testing-library/react'
import { t } from './strings'
import { ErrorScreen } from './ErrorScreen'
import { ProgressBar } from './ProgressBar'
import { NavButtons } from './NavButtons'

test('strings: pt resolves, unknown locale falls back to en', () => {
  expect(t('pt', 'next')).toBe('Seguinte')
  expect(t('xx', 'next')).toBe('Next')
  expect(t('en', 'progress', { i: 2, n: 9 })).toBe('Question 2 of 9')
})
test('ErrorScreen shows localised copy + code fine print; retry only when retryable', () => {
  const retry = vi.fn()
  const { rerender } = render(<ErrorScreen locale="en" kind="closed" code="gone" onRetry={retry} />)
  expect(screen.getByRole('heading')).toHaveTextContent(/closed/i)
  expect(screen.getByText(/gone/)).toBeInTheDocument()
  expect(screen.queryByRole('button')).not.toBeInTheDocument()
  rerender(<ErrorScreen locale="en" kind="failed" code="network" onRetry={retry} />)
  screen.getByRole('button', { name: /try again/i }).click()
  expect(retry).toHaveBeenCalled()
})
test('ProgressBar exposes progressbar semantics + polite live region', () => {
  render(<ProgressBar locale="en" current={3} total={9} />)
  const bar = screen.getByRole('progressbar')
  expect(bar).toHaveAttribute('aria-valuenow', '3')
  expect(bar).toHaveAttribute('aria-valuemax', '9')
  expect(screen.getByText('Question 3 of 9')).toBeInTheDocument()
})
test('NavButtons: Back hidden on first step; Next prominent with Enter hint', () => {
  const next = vi.fn()
  render(<NavButtons locale="en" canBack={false} onBack={vi.fn()} onNext={next} />)
  expect(screen.queryByRole('button', { name: /back/i })).not.toBeInTheDocument()
  screen.getByRole('button', { name: /next/i }).click()
  expect(next).toHaveBeenCalled()
})
```

- [ ] **Step 2: Run to verify fail**, then implement. `strings.ts`:

```ts
const STRINGS = {
  en: {
    next: 'Next', back: 'Back', enter_hint: 'press Enter ↵',
    progress: 'Question {i} of {n}',
    required_error: 'Please answer this question to continue.',
    error_invalid_link_title: 'This link is not valid',
    error_invalid_link_body: 'Check that the address was copied completely, or contact the study team.',
    error_not_open_title: 'Not currently accepting responses',
    error_not_open_body: 'This questionnaire is not open right now. Please try again later or contact the study team.',
    error_closed_title: 'This questionnaire has closed',
    error_closed_body: 'The collection period for this study has ended. Thank you for your interest.',
    error_failed_title: 'Something went wrong',
    error_failed_body: 'We could not start your session. Please check your connection and try again.',
    retry: 'Try again',
    finished_title: 'Thank you!',
    finished_body: 'You have reached the end of this questionnaire.',
    unsupported: 'This element cannot be displayed by this viewer.',
  },
  pt: {
    next: 'Seguinte', back: 'Voltar', enter_hint: 'prima Enter ↵',
    progress: 'Pergunta {i} de {n}',
    required_error: 'Por favor responda a esta pergunta para continuar.',
    error_invalid_link_title: 'Esta ligação não é válida',
    error_invalid_link_body: 'Verifique se o endereço foi copiado na íntegra ou contacte a equipa do estudo.',
    error_not_open_title: 'De momento não aceita respostas',
    error_not_open_body: 'Este questionário não está aberto neste momento. Tente novamente mais tarde.',
    error_closed_title: 'Este questionário foi encerrado',
    error_closed_body: 'O período de recolha deste estudo terminou. Obrigado pelo seu interesse.',
    error_failed_title: 'Algo correu mal',
    error_failed_body: 'Não foi possível iniciar a sessão. Verifique a ligação e tente novamente.',
    retry: 'Tentar novamente',
    finished_title: 'Obrigado!',
    finished_body: 'Chegou ao fim deste questionário.',
    unsupported: 'Este elemento não pode ser apresentado por este visualizador.',
  },
} as const

export type StringKey = keyof (typeof STRINGS)['en']

export function t(locale: string, key: StringKey, vars: Record<string, string | number> = {}): string {
  const lang = locale.split('-')[0]
  const table: Record<StringKey, string> = (STRINGS as Record<string, never>)[lang] ?? STRINGS.en
  let s: string = table[key] ?? STRINGS.en[key]
  for (const [k, v] of Object.entries(vars)) s = s.replace(`{${k}}`, String(v))
  return s
}
```

`ErrorScreen.tsx`:

```tsx
import { t } from './strings'
import type { MintErr } from '../bootstrap'

const TITLE_KEY = { invalid_link: 'error_invalid_link_title', not_open: 'error_not_open_title', closed: 'error_closed_title', failed: 'error_failed_title' } as const
const BODY_KEY = { invalid_link: 'error_invalid_link_body', not_open: 'error_not_open_body', closed: 'error_closed_body', failed: 'error_failed_body' } as const

export function ErrorScreen({ locale, kind, code, onRetry }: { locale: string; kind: MintErr['kind']; code: string; onRetry: () => void }) {
  return (
    <main className="min-h-screen grid place-items-center px-6 font-theme text-center">
      <div className="max-w-md space-y-4">
        <h1 className="text-2xl font-semibold">{t(locale, TITLE_KEY[kind])}</h1>
        <p className="text-slate-600">{t(locale, BODY_KEY[kind])}</p>
        {kind === 'failed' && (
          <button onClick={onRetry} className="rounded-lg bg-primary px-5 py-2.5 text-white font-medium">
            {t(locale, 'retry')}
          </button>
        )}
        <p className="text-xs text-slate-400">{code}</p>
      </div>
    </main>
  )
}
```

`ProgressBar.tsx`:

```tsx
import { t } from './strings'

export function ProgressBar({ locale, current, total }: { locale: string; current: number; total: number }) {
  const label = t(locale, 'progress', { i: current, n: total })
  return (
    <div className="fixed inset-x-0 top-0">
      <div role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={current} aria-label={label} className="h-1 bg-slate-200">
        <div className="h-full bg-primary transition-[width] duration-300" style={{ width: `${(current / total) * 100}%` }} />
      </div>
      <p aria-live="polite" className="px-4 pt-2 text-right text-xs text-slate-400">{label}</p>
    </div>
  )
}
```

`NavButtons.tsx`:

```tsx
import { t } from './strings'

export function NavButtons({ locale, canBack, onBack, onNext }: { locale: string; canBack: boolean; onBack: () => void; onNext: () => void }) {
  return (
    <div className="mt-10 flex items-center gap-4">
      {canBack && (
        <button onClick={onBack} className="rounded-lg px-4 py-2.5 text-slate-500 hover:text-slate-800">
          {t(locale, 'back')}
        </button>
      )}
      <button onClick={onNext} className="rounded-lg bg-primary px-6 py-2.5 text-lg font-medium text-white shadow-sm hover:opacity-90">
        {t(locale, 'next')}
      </button>
      <span className="hidden sm:inline text-xs text-slate-400">{t(locale, 'enter_hint')}</span>
    </div>
  )
}
```

`StepTransition.tsx` (leave → swap → enter; ~200 ms, CSS handles reduced-motion):

```tsx
import { type ReactNode, useEffect, useState } from 'react'

export function StepTransition({ stepKey, children }: { stepKey: number | string; children: ReactNode }) {
  const [shown, setShown] = useState({ key: stepKey, children })
  const [leaving, setLeaving] = useState(false)
  useEffect(() => {
    if (stepKey === shown.key) {
      setShown({ key: stepKey, children })
      return
    }
    setLeaving(true)
    const timer = window.setTimeout(() => {
      setShown({ key: stepKey, children })
      setLeaving(false)
    }, 200)
    return () => window.clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepKey, children])
  return (
    <div key={String(shown.key)} className={leaving ? 'qv-step-leave' : 'qv-step-enter'}>
      {shown.children}
    </div>
  )
}
```

- [ ] **Step 3: Run to verify pass.** `npx vitest run src/app/chrome` → PASS.
- [ ] **Step 4: Commit.** `git commit -am "feat(web-viewer): localised chrome (strings en/pt, error screens, progress, nav, step transition)"`

---

### Task 7: RadioGroup (choice cards + letter key hints)

**Files:** Create `src/renderer/widgets/RadioGroup.tsx`, `src/renderer/widgets/RadioGroup.test.tsx`.

- [ ] **Step 1: Failing tests:**

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'vitest-axe'
import { RadioGroup } from './RadioGroup'

const choices = [
  { index: 1, value: 0, text: 'Not at all' },
  { index: 2, value: 1, text: 'Several days' },
]

test('renders one radio per choice inside a named group; selecting reports the value', async () => {
  const onChange = vi.fn()
  render(<RadioGroup name="it_1" label="Little interest" choices={choices} value={null} onChange={onChange} />)
  expect(screen.getByRole('radiogroup', { name: 'Little interest' })).toBeInTheDocument()
  await userEvent.click(screen.getByRole('radio', { name: /Several days/ }))
  expect(onChange).toHaveBeenCalledWith(1)
})
test('shows letter hints and selects via keyboard letter when keyHints is on', async () => {
  const onChange = vi.fn()
  render(<RadioGroup name="it_1" label="L" choices={choices} value={null} onChange={onChange} keyHints />)
  expect(screen.getByText('A')).toBeInTheDocument()
  expect(screen.getByText('B')).toBeInTheDocument()
  await userEvent.keyboard('b')
  expect(onChange).toHaveBeenCalledWith(1)
})
test('letter keys ignored without keyHints and when typing in a text input', async () => {
  const onChange = vi.fn()
  render(
    <>
      <input type="text" aria-label="other" />
      <RadioGroup name="it_1" label="L" choices={choices} value={null} onChange={onChange} keyHints />
    </>,
  )
  await userEvent.type(screen.getByLabelText('other'), 'a')
  expect(onChange).not.toHaveBeenCalled()
})
test('selected card reflects value; no axe violations', async () => {
  const { container } = render(<RadioGroup name="it_1" label="L" choices={choices} value={1} onChange={vi.fn()} />)
  expect(screen.getByRole('radio', { name: /Several days/ })).toBeChecked()
  expect(await axe(container)).toHaveNoViolations()
})
```

- [ ] **Step 2: Run to verify fail**, then implement (`RadioGroup.tsx`) — native inputs visually hidden inside large card labels, letter badge, primary-colour selected state:

```tsx
import { useEffect } from 'react'
import type { AnswerValue, MergedChoice } from '../types'

type Props = {
  name: string
  label: string
  choices: MergedChoice[]
  value: AnswerValue
  onChange: (value: number | string) => void
  keyHints?: boolean
}

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

export function RadioGroup({ name, label, choices, value, onChange, keyHints = false }: Props) {
  useEffect(() => {
    if (!keyHints) return
    function onKey(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const target = e.target as HTMLElement
      if (target instanceof HTMLInputElement && ['text', 'number', 'email'].includes(target.type)) return
      if (target instanceof HTMLTextAreaElement) return
      const i = e.key.length === 1 ? LETTERS.indexOf(e.key.toUpperCase()) : -1
      if (i >= 0 && i < choices.length) onChange(choices[i].value)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [keyHints, choices, onChange])

  return (
    <div role="radiogroup" aria-label={label} className="flex flex-col gap-2.5">
      {choices.map((c, i) => {
        const selected = value === c.value
        return (
          <label
            key={c.index}
            className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 px-4 py-3 text-lg transition-colors ${
              selected ? 'border-primary bg-primary/5 text-primary' : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <input
              type="radio"
              name={name}
              checked={selected}
              onChange={() => onChange(c.value)}
              className="sr-only"
            />
            {keyHints && (
              <span aria-hidden className={`grid h-6 w-6 shrink-0 place-items-center rounded border text-xs font-semibold ${selected ? 'border-primary' : 'border-slate-300 text-slate-500'}`}>
                {LETTERS[i]}
              </span>
            )}
            <span>{c.text}</span>
          </label>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 3: Run to verify pass.** `npx vitest run src/renderer/widgets/RadioGroup.test.tsx` → PASS. (jsdom note: `sr-only` inputs remain in the accessibility tree — `getByRole('radio')` works.)
- [ ] **Step 4: Commit.** `git commit -am "feat(web-viewer): RadioGroup choice cards with letter key hints"`

---

### Task 8: CheckboxGroup, NumberInput, TextInput

**Files:** Create `src/renderer/widgets/CheckboxGroup.tsx`, `NumberInput.tsx`, `TextInput.tsx`, `inputs.test.tsx`.

- [ ] **Step 1: Failing tests** (`inputs.test.tsx`):

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'vitest-axe'
import { CheckboxGroup } from './CheckboxGroup'
import { NumberInput } from './NumberInput'
import { TextInput } from './TextInput'

const choices = [
  { index: 1, value: 'a', text: 'Alpha' },
  { index: 2, value: 'b', text: 'Beta' },
]

test('CheckboxGroup toggles values into an array', async () => {
  const onChange = vi.fn()
  const { rerender } = render(<CheckboxGroup label="L" choices={choices} value={null} onChange={onChange} />)
  await userEvent.click(screen.getByRole('checkbox', { name: /Alpha/ }))
  expect(onChange).toHaveBeenCalledWith(['a'])
  rerender(<CheckboxGroup label="L" choices={choices} value={['a']} onChange={onChange} />)
  await userEvent.click(screen.getByRole('checkbox', { name: /Beta/ }))
  expect(onChange).toHaveBeenLastCalledWith(['a', 'b'])
  rerender(<CheckboxGroup label="L" choices={choices} value={['a', 'b']} onChange={onChange} />)
  await userEvent.click(screen.getByRole('checkbox', { name: /Alpha/ }))
  expect(onChange).toHaveBeenLastCalledWith(['b'])
})
test('NumberInput honours min/max/step and reports number or null', async () => {
  const onChange = vi.fn()
  render(<NumberInput label="Hours" min={0} max={24} step={1} value={null} onChange={onChange} />)
  const input = screen.getByRole('spinbutton', { name: 'Hours' })
  expect(input).toHaveAttribute('min', '0')
  expect(input).toHaveAttribute('max', '24')
  await userEvent.type(input, '7')
  expect(onChange).toHaveBeenLastCalledWith(7)
  await userEvent.clear(input)
  expect(onChange).toHaveBeenLastCalledWith(null)
})
test('TextInput reports text and shows placeholder', async () => {
  const onChange = vi.fn()
  render(<TextInput label="Name" placeholder="Type here…" value="" onChange={onChange} />)
  const input = screen.getByRole('textbox', { name: 'Name' })
  expect(input).toHaveAttribute('placeholder', 'Type here…')
  await userEvent.type(input, 'hi')
  expect(onChange).toHaveBeenLastCalledWith('hi')
})
test('no axe violations', async () => {
  const { container } = render(
    <>
      <CheckboxGroup label="C" choices={choices} value={['a']} onChange={vi.fn()} />
      <NumberInput label="N" value={3} onChange={vi.fn()} />
      <TextInput label="T" value="x" onChange={vi.fn()} />
    </>,
  )
  expect(await axe(container)).toHaveNoViolations()
})
```

- [ ] **Step 2: Run to verify fail**, then implement. `CheckboxGroup.tsx` (same card styling as RadioGroup, no letter hints):

```tsx
import type { AnswerValue, MergedChoice } from '../types'

type Props = { label: string; choices: MergedChoice[]; value: AnswerValue; onChange: (value: (number | string)[]) => void }

export function CheckboxGroup({ label, choices, value, onChange }: Props) {
  const selected = Array.isArray(value) ? value : []
  const toggle = (v: number | string) =>
    onChange(selected.includes(v) ? selected.filter((x) => x !== v) : [...selected, v])
  return (
    <div role="group" aria-label={label} className="flex flex-col gap-2.5">
      {choices.map((c) => {
        const isOn = selected.includes(c.value)
        return (
          <label key={c.index} className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 px-4 py-3 text-lg transition-colors ${isOn ? 'border-primary bg-primary/5 text-primary' : 'border-slate-200 hover:border-slate-300'}`}>
            <input type="checkbox" checked={isOn} onChange={() => toggle(c.value)} className="h-5 w-5 accent-[var(--qv-primary)]" />
            <span>{c.text}</span>
          </label>
        )
      })}
    </div>
  )
}
```

`NumberInput.tsx`:

```tsx
type Props = { label: string; min?: number; max?: number; step?: number; value: number | string | (number | string)[] | null; onChange: (value: number | null) => void }

export function NumberInput({ label, min, max, step, value, onChange }: Props) {
  return (
    <input
      type="number"
      aria-label={label}
      min={min}
      max={max}
      step={step}
      value={typeof value === 'number' ? value : ''}
      onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
      className="w-40 rounded-xl border-2 border-slate-200 px-4 py-3 text-lg focus:border-primary focus:outline-none"
    />
  )
}
```

`TextInput.tsx`:

```tsx
type Props = { label: string; placeholder?: string; value: unknown; onChange: (value: string) => void }

export function TextInput({ label, placeholder, value, onChange }: Props) {
  return (
    <input
      type="text"
      aria-label={label}
      placeholder={placeholder}
      value={typeof value === 'string' ? value : ''}
      onChange={(e) => onChange(e.target.value)}
      className="w-full max-w-md rounded-xl border-2 border-slate-200 px-4 py-3 text-lg focus:border-primary focus:outline-none"
    />
  )
}
```

- [ ] **Step 3: Run to verify pass.** `npx vitest run src/renderer/widgets/inputs.test.tsx` → PASS.
- [ ] **Step 4: Commit.** `git commit -am "feat(web-viewer): CheckboxGroup, NumberInput, TextInput widgets"`

---

### Task 9: MessageBlock, UnsupportedElement, ItemRenderer

**Files:** Create `src/renderer/widgets/MessageBlock.tsx`, `src/renderer/widgets/UnsupportedElement.tsx`, `src/renderer/ItemRenderer.tsx`, `src/renderer/ItemRenderer.test.tsx`.

- [ ] **Step 1: Failing tests** (`ItemRenderer.test.tsx`):

```tsx
import { render, screen } from '@testing-library/react'
import { ItemRenderer } from './ItemRenderer'
import type { ItemElement } from './types'

const radioItem: ItemElement = {
  id: 'it_1',
  question: {
    prompt: { content: { en: { text: 'Little interest or pleasure in doing things' } } },
    context: { content: { en: { text: 'Over the last 2 weeks' } } },
    instruction: { content: { en: { text: 'Pick one' } } },
  },
  option: {
    input_data_type: 'choice', measurement_type: 'ordinal', selection: 'single',
    options: [{ index: 1, value: 0 }],
    content: { en: { options: [{ index: 1, text: 'Not at all' }] } },
  },
}

test('renders prompt as heading, context + instruction beneath, then the widget', () => {
  render(<ItemRenderer answerKey="it_1" element={radioItem} locale="en" value={null} onAnswer={vi.fn()} />)
  expect(screen.getByRole('heading', { name: /Little interest/ })).toBeInTheDocument()
  expect(screen.getByText('Over the last 2 weeks')).toBeInTheDocument()
  expect(screen.getByText('Pick one')).toBeInTheDocument()
  expect(screen.getByRole('radio', { name: /Not at all/ })).toBeInTheDocument()
})
test('reports answers under the answer key', () => {
  const onAnswer = vi.fn()
  render(<ItemRenderer answerKey="k9" element={radioItem} locale="en" value={null} onAnswer={onAnswer} />)
  screen.getByRole('radio', { name: /Not at all/ }).click()
  expect(onAnswer).toHaveBeenCalledWith('k9', 0)
})
test('unknown widget triple renders UnsupportedElement naming the triple', () => {
  const weird = { ...radioItem, option: { ...radioItem.option, input_data_type: 'date' } }
  render(<ItemRenderer answerKey="it_1" element={weird} locale="en" value={null} onAnswer={vi.fn()} />)
  expect(screen.getByText(/date\/ordinal\/single/)).toBeInTheDocument()
})
test('missing locale text renders UnsupportedElement, not a crash or blank', () => {
  render(<ItemRenderer answerKey="it_1" element={radioItem} locale="pt" value={null} onAnswer={vi.fn()} />)
  expect(screen.getByText(/no 'pt'/)).toBeInTheDocument()
})
test('required item shows error text when flagged', () => {
  render(<ItemRenderer answerKey="it_1" element={{ ...radioItem, required: true }} locale="en" value={null} onAnswer={vi.fn()} showRequiredError requiredErrorText="Please answer this question to continue." />)
  expect(screen.getByText('Please answer this question to continue.')).toBeInTheDocument()
})
```

- [ ] **Step 2: Run to verify fail**, then implement. `MessageBlock.tsx`:

```tsx
import type { ContentEntity } from '../types'

export function MessageBlock({ element, locale }: { element: ContentEntity; locale: string }) {
  const text = element.content?.[locale]?.text ?? ''
  return <div className="whitespace-pre-line text-xl leading-relaxed text-slate-700">{text}</div>
}
```

`UnsupportedElement.tsx`:

```tsx
export function UnsupportedElement({ id, reason, notice }: { id: string; reason: string; notice: string }) {
  return (
    <div role="note" className="rounded-xl border-2 border-dashed border-warning/60 bg-warning/5 p-4 text-sm text-slate-600">
      <p>{notice}</p>
      <p className="mt-1 font-mono text-xs text-slate-400">{id}: {reason}</p>
    </div>
  )
}
```

`ItemRenderer.tsx`:

```tsx
import { deriveWidget } from './derive'
import { mergeOptions } from './merge'
import { RenderError, type AnswerValue, type ItemElement } from './types'
import { CheckboxGroup } from './widgets/CheckboxGroup'
import { NumberInput } from './widgets/NumberInput'
import { RadioGroup } from './widgets/RadioGroup'
import { TextInput } from './widgets/TextInput'
import { UnsupportedElement } from './widgets/UnsupportedElement'

export type ItemRendererProps = {
  answerKey: string
  element: ItemElement
  locale: string
  value: AnswerValue
  onAnswer: (key: string, value: AnswerValue) => void
  keyHints?: boolean
  showRequiredError?: boolean
  requiredErrorText?: string
  unsupportedNotice?: string
}

export function ItemRenderer({ answerKey, element, locale, value, onAnswer, keyHints = false, showRequiredError = false, requiredErrorText = '', unsupportedNotice = '' }: ItemRendererProps) {
  const prompt = element.question.prompt?.content?.[locale]?.text ?? ''
  const context = element.question.context?.content?.[locale]?.text
  const instruction = element.question.instruction?.content?.[locale]?.text
  const kind = deriveWidget(element.option)

  let widget: React.ReactNode
  if (!kind) {
    const triple = `${element.option.input_data_type}/${element.option.measurement_type}/${element.option.selection ?? '—'}`
    widget = <UnsupportedElement id={answerKey} reason={triple} notice={unsupportedNotice} />
  } else {
    try {
      if (kind.startsWith('choice.') && kind.endsWith('.single')) {
        widget = <RadioGroup name={answerKey} label={prompt} choices={mergeOptions(element.option, locale)} value={value} onChange={(v) => onAnswer(answerKey, v)} keyHints={keyHints} />
      } else if (kind === 'choice.nominal.multiple') {
        widget = <CheckboxGroup label={prompt} choices={mergeOptions(element.option, locale)} value={value} onChange={(v) => onAnswer(answerKey, v)} />
      } else if (kind.startsWith('number.')) {
        widget = <NumberInput label={prompt} min={element.option.min} max={element.option.max} step={element.option.step} value={value} onChange={(v) => onAnswer(answerKey, v)} />
      } else {
        widget = <TextInput label={prompt} placeholder={element.option.content?.[locale]?.label} value={value} onChange={(v) => onAnswer(answerKey, v)} />
      }
    } catch (err) {
      if (!(err instanceof RenderError)) throw err
      widget = <UnsupportedElement id={answerKey} reason={err.message} notice={unsupportedNotice} />
    }
  }

  const errorId = `${answerKey}-error`
  return (
    <fieldset aria-describedby={showRequiredError ? errorId : undefined} className="space-y-5">
      <legend className="sr-only">{prompt}</legend>
      <div className="space-y-2">
        <h2 tabIndex={-1} className="text-2xl font-semibold leading-snug sm:text-3xl">{prompt}</h2>
        {context && <p className="text-base text-slate-500">{context}</p>}
        {instruction && <p className="text-sm italic text-slate-500">{instruction}</p>}
      </div>
      {widget}
      {showRequiredError && (
        <p id={errorId} className="font-medium text-error" role="alert">{requiredErrorText}</p>
      )}
    </fieldset>
  )
}
```

- [ ] **Step 3: Run to verify pass.** `npx vitest run src/renderer/ItemRenderer.test.tsx` → PASS.
- [ ] **Step 4: Commit.** `git commit -am "feat(web-viewer): ItemRenderer (prompt/context/instruction + widget dispatch), Message + Unsupported blocks"`

---

### Task 10: SectionRenderer + MatrixGroup + StepRenderer

**Files:** Create `src/renderer/widgets/MatrixGroup.tsx`, `src/renderer/SectionRenderer.tsx`, `src/renderer/StepRenderer.tsx`, `src/renderer/StepRenderer.test.tsx`, `src/renderer/index.ts`.

- [ ] **Step 1: Failing tests** (`StepRenderer.test.tsx`):

```tsx
import { render, screen, within } from '@testing-library/react'
import { axe } from 'vitest-axe'
import { StepRenderer } from './StepRenderer'

const opt = {
  input_data_type: 'choice', measurement_type: 'ordinal', selection: 'single',
  options: [{ index: 1, value: 0 }, { index: 2, value: 1 }],
  content: { en: { options: [{ index: 1, text: 'No' }, { index: 2, text: 'Yes' }] } },
}
const row = (id: string, text: string) => ({ id, question: { prompt: { content: { en: { text } } } }, option: opt })
const matrixSection = { id: 'sec_m', title: 'How often…', shared_option: opt, elements: [row('it_a', 'Row A'), row('it_b', 'Row B')] }
const message = { id: 'msg_1', content: { en: { text: 'Welcome to the study' } } }

test('dispatches message / item / section; unknown shape → unsupported card', () => {
  render(
    <StepRenderer
      elements={[
        { key: 'msg_1', element: message },
        { key: 'it_1', element: row('it_1', 'Standalone') },
        { key: 'mystery', element: { bogus: true } },
      ]}
      locale="en" answers={{}} onAnswer={vi.fn()} requiredErrors={[]} strings={{ required: 'req', unsupported: 'unsupported' }}
    />,
  )
  expect(screen.getByText('Welcome to the study')).toBeInTheDocument()
  expect(screen.getByRole('heading', { name: 'Standalone' })).toBeInTheDocument()
  expect(screen.getByText(/unsupported/)).toBeInTheDocument()
})
test('matrix: table with choice-text column headers and one radio row per item', async () => {
  const onAnswer = vi.fn()
  const { container } = render(
    <StepRenderer elements={[{ key: 'sec_m', element: matrixSection }]} locale="en" answers={{}} onAnswer={onAnswer} requiredErrors={[]} strings={{ required: 'req', unsupported: 'u' }} />,
  )
  const table = screen.getByRole('table')
  expect(within(table).getAllByRole('columnheader').map((h) => h.textContent)).toEqual(['', 'No', 'Yes'])
  expect(within(table).getAllByRole('rowheader').map((h) => h.textContent)).toEqual(['Row A', 'Row B'])
  const rowA = within(table).getAllByRole('row')[1]
  within(rowA).getAllByRole('radio')[1].click()
  expect(onAnswer).toHaveBeenCalledWith('it_a', 1)
  expect(await axe(container)).toHaveNoViolations()
})
test('matrix required errors mark the failing rows', () => {
  render(
    <StepRenderer elements={[{ key: 'sec_m', element: matrixSection }]} locale="en" answers={{ it_a: 0 }} onAnswer={vi.fn()} requiredErrors={['it_b']} strings={{ required: 'Answer all rows', unsupported: 'u' }} />,
  )
  expect(screen.getByText('Answer all rows')).toBeInTheDocument()
})
test('plain section (no shared_option) renders a titled group of items', () => {
  const plain = { id: 'sec_p', title: 'About you', elements: [row('it_c', 'Row C')] }
  render(<StepRenderer elements={[{ key: 'sec_p', element: plain }]} locale="en" answers={{}} onAnswer={vi.fn()} requiredErrors={[]} strings={{ required: 'r', unsupported: 'u' }} />)
  expect(screen.getByRole('heading', { name: 'About you' })).toBeInTheDocument()
  expect(screen.getByRole('heading', { name: 'Row C' })).toBeInTheDocument()
})
```

- [ ] **Step 2: Run to verify fail**, then implement. `MatrixGroup.tsx`:

```tsx
import { mergeOptions } from '../merge'
import { isItem } from '../guards'
import { elementKey, sectionChildFallback } from '../keys'
import type { AnswerValue, SectionElement } from '../types'
import { UnsupportedElement } from './UnsupportedElement'

type Props = {
  sectionKey: string
  section: SectionElement
  locale: string
  answers: Record<string, AnswerValue>
  onAnswer: (key: string, value: AnswerValue) => void
  requiredErrors: string[]
  requiredText: string
  unsupportedNotice: string
}

export function MatrixGroup({ sectionKey, section, locale, answers, onAnswer, requiredErrors, requiredText, unsupportedNotice }: Props) {
  let choices
  try {
    choices = mergeOptions(section.shared_option!, locale)
  } catch (err) {
    return <UnsupportedElement id={sectionKey} reason={(err as Error).message} notice={unsupportedNotice} />
  }
  const rows = section.elements.map((el, j) => ({ key: elementKey(el, sectionChildFallback(sectionKey, j)), el }))
  const failing = rows.some((r) => requiredErrors.includes(r.key))
  return (
    <div className="space-y-3">
      {section.title && <h2 tabIndex={-1} className="text-2xl font-semibold leading-snug sm:text-3xl">{section.title}</h2>}
      <div className="overflow-x-auto">
        <table className="w-full min-w-max border-separate border-spacing-y-1">
          <thead>
            <tr>
              <th scope="col" className="min-w-48"></th>
              {choices.map((c) => (
                <th key={c.index} scope="col" className="px-3 pb-2 text-center text-sm font-medium text-slate-500">{c.text}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(({ key, el }) => {
              if (!isItem(el)) return null
              const prompt = el.question.prompt?.content?.[locale]?.text ?? ''
              const rowFails = requiredErrors.includes(key)
              return (
                <tr key={key} className={rowFails ? 'bg-error/5' : undefined}>
                  <th scope="row" className="py-2 pr-4 text-left text-base font-normal">{prompt}</th>
                  {choices.map((c) => (
                    <td key={c.index} className="px-3 text-center">
                      <input
                        type="radio"
                        name={key}
                        aria-label={`${prompt}: ${c.text}`}
                        checked={answers[key] === c.value}
                        onChange={() => onAnswer(key, c.value)}
                        className="h-5 w-5 accent-[var(--qv-primary)]"
                      />
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {failing && <p role="alert" className="font-medium text-error">{requiredText}</p>}
    </div>
  )
}
```

`SectionRenderer.tsx`:

```tsx
import { ItemRenderer } from './ItemRenderer'
import { MatrixGroup } from './widgets/MatrixGroup'
import { MessageBlock } from './widgets/MessageBlock'
import { UnsupportedElement } from './widgets/UnsupportedElement'
import { isItem, isMessage } from './guards'
import { elementKey, sectionChildFallback } from './keys'
import type { AnswerValue, SectionElement } from './types'
import type { RendererStrings } from './StepRenderer'

type Props = {
  sectionKey: string
  section: SectionElement
  locale: string
  answers: Record<string, AnswerValue>
  onAnswer: (key: string, value: AnswerValue) => void
  requiredErrors: string[]
  strings: RendererStrings
}

export function SectionRenderer({ sectionKey, section, locale, answers, onAnswer, requiredErrors, strings }: Props) {
  if (section.shared_option) {
    return (
      <MatrixGroup sectionKey={sectionKey} section={section} locale={locale} answers={answers} onAnswer={onAnswer} requiredErrors={requiredErrors} requiredText={strings.required} unsupportedNotice={strings.unsupported} />
    )
  }
  return (
    <section className="space-y-8">
      {section.title && <h2 tabIndex={-1} className="text-2xl font-semibold leading-snug sm:text-3xl">{section.title}</h2>}
      {section.elements.map((el, j) => {
        const key = elementKey(el, sectionChildFallback(sectionKey, j))
        if (isItem(el)) {
          return <ItemRenderer key={key} answerKey={key} element={el} locale={locale} value={answers[key] ?? null} onAnswer={onAnswer} showRequiredError={requiredErrors.includes(key)} requiredErrorText={strings.required} unsupportedNotice={strings.unsupported} />
        }
        if (isMessage(el)) return <MessageBlock key={key} element={el} locale={locale} />
        return <UnsupportedElement key={key} id={key} reason="unknown section element shape" notice={strings.unsupported} />
      })}
    </section>
  )
}
```

`StepRenderer.tsx`:

```tsx
import { ItemRenderer } from './ItemRenderer'
import { SectionRenderer } from './SectionRenderer'
import { MessageBlock } from './widgets/MessageBlock'
import { UnsupportedElement } from './widgets/UnsupportedElement'
import { isItem, isMessage, isSection } from './guards'
import type { AnswerValue, RuntimeElement } from './types'

export type RendererStrings = { required: string; unsupported: string }
export type StepRendererProps = {
  elements: { key: string; element: RuntimeElement }[]
  locale: string
  answers: Record<string, AnswerValue>
  onAnswer: (key: string, value: AnswerValue) => void
  requiredErrors: string[]
  strings: RendererStrings
  keyHints?: boolean
}

export function StepRenderer({ elements, locale, answers, onAnswer, requiredErrors, strings, keyHints = false }: StepRendererProps) {
  return (
    <div className="space-y-10">
      {elements.map(({ key, element }) => {
        if (isItem(element)) {
          return <ItemRenderer key={key} answerKey={key} element={element} locale={locale} value={answers[key] ?? null} onAnswer={onAnswer} keyHints={keyHints} showRequiredError={requiredErrors.includes(key)} requiredErrorText={strings.required} unsupportedNotice={strings.unsupported} />
        }
        if (isSection(element)) {
          return <SectionRenderer key={key} sectionKey={key} section={element} locale={locale} answers={answers} onAnswer={onAnswer} requiredErrors={requiredErrors} strings={strings} />
        }
        if (isMessage(element)) return <MessageBlock key={key} element={element} locale={locale} />
        return <UnsupportedElement key={key} id={key} reason="unknown element shape" notice={strings.unsupported} />
      })}
    </div>
  )
}
```

`index.ts` (renderer public API):

```ts
export { StepRenderer, type StepRendererProps, type RendererStrings } from './StepRenderer'
export { ItemRenderer } from './ItemRenderer'
export { mergeOptions } from './merge'
export { deriveWidget } from './derive'
export { isItem, isMessage, isSection } from './guards'
export { elementKey, pageElementFallback, sectionChildFallback } from './keys'
export * from './types'
```

- [ ] **Step 3: Run to verify pass.** `npx vitest run src/renderer` → PASS.
- [ ] **Step 4: Commit.** `git commit -am "feat(web-viewer): StepRenderer dispatch, sections, shared_option matrix"`

---

### Task 11: Session reducer

**Files:** Create `src/app/session.ts`, `src/app/session.test.ts`.

- [ ] **Step 1: Failing tests** (`session.test.ts`):

```ts
import { initialState, reducer } from './session'
import { flattenSteps } from './steps'
import type { Runtime } from '../renderer/types'

const opt = {
  input_data_type: 'choice', measurement_type: 'ordinal', selection: 'single',
  options: [{ index: 1, value: 0 }],
  content: { en: { options: [{ index: 1, text: 'A' }] } },
}
const runtime: Runtime = {
  provenance: {}, metadata: { id: 'qst_x', title: 'T', language: 'en' }, locale: 'en',
  pages: [
    { id: 'p1', elements: [{ id: 'it_1', question: { prompt: { content: { en: { text: 'Q1' } } } }, option: opt, required: true }] },
    { id: 'p2', elements: [{ id: 'it_2', question: { prompt: { content: { en: { text: 'Q2' } } } }, option: opt }] },
  ],
}
const booted = reducer(initialState, {
  type: 'boot_success',
  session: { id: 's1', token: 't1' }, runtime, theme: null, steps: flattenSteps(runtime),
})

test('boot_success → ready at step 0', () => {
  expect(booted.phase).toBe('ready')
  expect(booted.stepIndex).toBe(0)
})
test('next blocked by required gating, records stepErrors', () => {
  const s = reducer(booted, { type: 'next' })
  expect(s.stepIndex).toBe(0)
  expect(s.stepErrors).toEqual(['it_1'])
})
test('answer clears that error; next then advances', () => {
  let s = reducer(booted, { type: 'next' })
  s = reducer(s, { type: 'answer', key: 'it_1', value: 0 })
  expect(s.stepErrors).toEqual([])
  s = reducer(s, { type: 'next' })
  expect(s.stepIndex).toBe(1)
})
test('next past the last step → finished', () => {
  let s = reducer(booted, { type: 'answer', key: 'it_1', value: 0 })
  s = reducer(s, { type: 'next' })
  s = reducer(s, { type: 'next' })   // it_2 not required
  expect(s.phase).toBe('finished')
})
test('back preserves answers and never goes below 0', () => {
  let s = reducer(booted, { type: 'answer', key: 'it_1', value: 0 })
  s = reducer(s, { type: 'next' })
  s = reducer(s, { type: 'back' })
  expect(s.stepIndex).toBe(0)
  expect(s.answers).toEqual({ it_1: 0 })
  expect(reducer(s, { type: 'back' }).stepIndex).toBe(0)
})
test('boot_error → error phase with kind/code', () => {
  const s = reducer(initialState, { type: 'boot_error', kind: 'closed', code: 'gone' })
  expect(s.phase).toBe('error')
  expect(s.error).toEqual({ kind: 'closed', code: 'gone' })
})
```

- [ ] **Step 2: Run to verify fail**, then implement (`session.ts`):

```ts
import type { AnswerValue, Runtime } from '../renderer/types'
import type { MintErr } from './bootstrap'
import type { Theme } from './theme'
import { requiredUnanswered, type Step } from './steps'

export type SessionState = {
  phase: 'booting' | 'error' | 'ready' | 'finished'
  session: { id: string; token: string } | null
  runtime: Runtime | null
  theme: Theme
  steps: Step[]
  stepIndex: number
  answers: Record<string, AnswerValue>
  stepErrors: string[]
  error: { kind: MintErr['kind']; code: string } | null
}

export const initialState: SessionState = {
  phase: 'booting', session: null, runtime: null, theme: null,
  steps: [], stepIndex: 0, answers: {}, stepErrors: [], error: null,
}

export type Action =
  | { type: 'boot_success'; session: { id: string; token: string }; runtime: Runtime; theme: Theme; steps: Step[] }
  | { type: 'boot_error'; kind: MintErr['kind']; code: string }
  | { type: 'retry' }
  | { type: 'answer'; key: string; value: AnswerValue }
  | { type: 'next' }
  | { type: 'back' }

export function reducer(state: SessionState, action: Action): SessionState {
  switch (action.type) {
    case 'boot_success':
      return { ...state, phase: 'ready', session: action.session, runtime: action.runtime, theme: action.theme, steps: action.steps, stepIndex: 0 }
    case 'boot_error':
      return { ...state, phase: 'error', error: { kind: action.kind, code: action.code } }
    case 'retry':
      return { ...initialState }
    case 'answer': {
      const answers = { ...state.answers, [action.key]: action.value }
      return { ...state, answers, stepErrors: state.stepErrors.filter((k) => k !== action.key) }
    }
    case 'next': {
      const step = state.steps[state.stepIndex]
      if (!step) return state
      const missing = requiredUnanswered(step, state.answers)
      if (missing.length > 0) return { ...state, stepErrors: missing }
      if (state.stepIndex >= state.steps.length - 1) return { ...state, phase: 'finished', stepErrors: [] }
      return { ...state, stepIndex: state.stepIndex + 1, stepErrors: [] }
    }
    case 'back':
      return { ...state, stepIndex: Math.max(0, state.stepIndex - 1), stepErrors: [] }
  }
}
```

- [ ] **Step 3: Run to verify pass.** `npx vitest run src/app/session.test.ts` → PASS.
- [ ] **Step 4: Commit.** `git commit -am "feat(web-viewer): session reducer (boot, gated next, back, finished)"`

---

### Task 12: App (boot flow, focus navigation, auto-advance, fixture mode)

**Files:** Create `src/fixtures/mini.json`, `src/fixtures/matrix.json`, `src/fixtures/widgets.json`, rewrite `src/app/App.tsx`, rewrite `src/app/App.test.tsx`.

- [ ] **Step 1: Fixtures** (denormaliser-true shape). `mini.json` (used by most tests):

```json
{
  "provenance": { "source_questionnaire_id": "qst_mini", "source_questionnaire_version": "v26.0609", "locale": "en", "viewer_conformance_hash": "0000000000000000000000000000000000000000000000000000000000000000", "deployment_runtime_policy_hash": "0000000000000000000000000000000000000000000000000000000000000000", "generated_at": "2026-06-11T00:00:00Z", "denormaliser_version": "v26.0610" },
  "metadata": { "id": "qst_mini", "title": "Mini PHQ", "language": "en" },
  "locale": "en",
  "pages": [
    { "id": "page_1", "elements": [
      { "id": "msg_intro", "content": { "en": { "text": "Welcome. Answer honestly." } } },
      { "id": "it_1", "required": true,
        "question": { "prompt": { "content": { "en": { "text": "Little interest or pleasure in doing things" } } } },
        "option": { "input_data_type": "choice", "measurement_type": "ordinal", "selection": "single",
          "options": [ { "index": 1, "value": 0 }, { "index": 2, "value": 1 } ],
          "content": { "en": { "options": [ { "index": 1, "text": "Not at all" }, { "index": 2, "text": "Several days" } ] } } } }
    ] },
    { "id": "page_2", "elements": [
      { "id": "it_2",
        "question": { "prompt": { "content": { "en": { "text": "How many hours do you sleep?" } } } },
        "option": { "input_data_type": "number", "measurement_type": "ratio", "min": 0, "max": 24 } }
    ] }
  ]
}
```

`matrix.json` — one page, one Section with `shared_option` + two required rows (copy the matrix shapes from Task 10's tests, with provenance/metadata like mini). `widgets.json` — one page with one element per supported widget kind + one `input_data_type: "date"` element (renders the Unsupported card) + a `style: { "x_presentation": "classic" }` variant is NOT needed (classic is covered by unit tests).

- [ ] **Step 2: Failing App tests** (`App.test.tsx`; jsdom URL via `window.history.replaceState`):

```tsx
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { App } from './App'
import mini from '../fixtures/mini.json'

function setUrl(qs: string) { window.history.replaceState(null, '', `/${qs}`) }
const mintOk = { session_id: 's1', session_token: 't1', runtime: mini, theme: { palette: { primary: '#112233' } } }

afterEach(() => vi.unstubAllGlobals())

test('boots a session, applies the theme, renders step 1 (message) then navigates', async () => {
  setUrl('?deployment=dpl_1')
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify(mintOk), { status: 200 })))
  render(<App />)
  expect(await screen.findByText(/Welcome\. Answer honestly\./)).toBeInTheDocument()
  expect(document.documentElement.style.getPropertyValue('--qv-primary')).toBe('#112233')
  await userEvent.click(screen.getByRole('button', { name: /next/i }))
  expect(await screen.findByRole('heading', { name: /Little interest/ })).toBeInTheDocument()
})
test('required gating blocks Next and announces the error', async () => {
  setUrl('?deployment=dpl_1')
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify(mintOk), { status: 200 })))
  render(<App />)
  await userEvent.click(await screen.findByRole('button', { name: /next/i }))   // past message
  await screen.findByRole('heading', { name: /Little interest/ })
  await userEvent.click(screen.getByRole('button', { name: /next/i }))          // blocked
  expect(await screen.findByRole('alert')).toHaveTextContent(/please answer/i)
})
test('single-choice answer auto-advances after the confirmation beat', async () => {
  setUrl('?deployment=dpl_1')
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify(mintOk), { status: 200 })))
  render(<App />)
  await userEvent.click(await screen.findByRole('button', { name: /next/i }))
  await userEvent.click(await screen.findByRole('radio', { name: /Not at all/ }))
  expect(await screen.findByRole('heading', { name: /How many hours/ }, { timeout: 2000 })).toBeInTheDocument()
})
test('finishing shows the thank-you screen', async () => {
  setUrl('?deployment=dpl_1')
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify(mintOk), { status: 200 })))
  render(<App />)
  await userEvent.click(await screen.findByRole('button', { name: /next/i }))
  await userEvent.click(await screen.findByRole('radio', { name: /Not at all/ }))
  await screen.findByRole('heading', { name: /How many hours/ }, { timeout: 2000 })
  await userEvent.click(screen.getByRole('button', { name: /next/i }))
  expect(await screen.findByRole('heading', { name: /Thank you/i })).toBeInTheDocument()
})
test.each([
  [410, /closed/i], [409, /not currently accepting/i], [404, /not valid/i],
])('mint HTTP %i shows its error screen', async (status, title) => {
  setUrl('?deployment=dpl_1')
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: { code: 'c' } }), { status })))
  render(<App />)
  expect(await screen.findByRole('heading', { name: title })).toBeInTheDocument()
})
test('missing deployment param → config error, no fetch', async () => {
  setUrl('')
  const fetchMock = vi.fn()
  vi.stubGlobal('fetch', fetchMock)
  render(<App />)
  expect(await screen.findByRole('heading', { name: /not valid/i })).toBeInTheDocument()
  expect(fetchMock).not.toHaveBeenCalled()
})
test('fixture mode renders without network (dev only)', async () => {
  setUrl('?fixture=mini')
  const fetchMock = vi.fn()
  vi.stubGlobal('fetch', fetchMock)
  render(<App />)
  expect(await screen.findByText(/Welcome\. Answer honestly\./)).toBeInTheDocument()
  expect(fetchMock).not.toHaveBeenCalled()
})
```

- [ ] **Step 3: Run to verify fail**, then implement `App.tsx`:

```tsx
import { useEffect, useReducer, useRef } from 'react'
import { StepRenderer } from '../renderer'
import type { AnswerValue, Runtime } from '../renderer/types'
import { mintSession, parseParams } from './bootstrap'
import { ErrorScreen } from './chrome/ErrorScreen'
import { NavButtons } from './chrome/NavButtons'
import { ProgressBar } from './chrome/ProgressBar'
import { StepTransition } from './chrome/StepTransition'
import { t } from './chrome/strings'
import { initialState, reducer } from './session'
import { flattenSteps, isSingleChoiceItem, presentationMode } from './steps'
import { applyTheme } from './theme'
import type { Theme } from './theme'

const FIXTURES: Record<string, () => Promise<{ default: unknown }>> = {
  mini: () => import('../fixtures/mini.json'),
  matrix: () => import('../fixtures/matrix.json'),
  widgets: () => import('../fixtures/widgets.json'),
}
const AUTO_ADVANCE_MS = 400

export function App() {
  const [state, dispatch] = useReducer(reducer, initialState)
  const autoTimer = useRef<number | null>(null)
  const params = parseParams(window.location.search)
  const locale = state.runtime?.locale ?? params.locale ?? 'en'

  useEffect(() => {
    if (state.phase !== 'booting') return
    let cancelled = false
    async function boot() {
      if (import.meta.env.DEV && params.fixture && FIXTURES[params.fixture]) {
        const runtime = (await FIXTURES[params.fixture]()).default as Runtime
        if (!cancelled) dispatch({ type: 'boot_success', session: { id: 'fixture', token: 'fixture' }, runtime, theme: null, steps: flattenSteps(runtime) })
        return
      }
      if (!params.deploymentId) {
        dispatch({ type: 'boot_error', kind: 'invalid_link', code: 'missing_deployment_param' })
        return
      }
      const res = await mintSession(params.vsBaseUrl, params.deploymentId, params.locale)
      if (cancelled) return
      if (res.ok) {
        applyTheme(res.theme as Theme)
        dispatch({ type: 'boot_success', session: { id: res.session_id, token: res.session_token }, runtime: res.runtime, theme: res.theme as Theme, steps: flattenSteps(res.runtime) })
        document.title = res.runtime.metadata.title
        document.documentElement.lang = res.runtime.locale ?? 'en'
      } else {
        dispatch({ type: 'boot_error', kind: res.kind, code: res.code })
      }
    }
    void boot()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.phase])

  // Enter advances (except inside a textarea)
  useEffect(() => {
    if (state.phase !== 'ready') return
    function onKey(e: KeyboardEvent) {
      if (e.key !== 'Enter' || e.target instanceof HTMLTextAreaElement) return
      clearAuto()
      dispatch({ type: 'next' })
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [state.phase])

  function clearAuto() {
    if (autoTimer.current !== null) { window.clearTimeout(autoTimer.current); autoTimer.current = null }
  }

  function handleAnswer(key: string, value: AnswerValue) {
    dispatch({ type: 'answer', key, value })
    const step = state.steps[state.stepIndex]
    const focus = state.runtime ? presentationMode(state.runtime) === 'focus' : false
    const autoOn = state.runtime?.style?.x_auto_advance !== false
    if (focus && autoOn && step && isSingleChoiceItem(step)) {
      clearAuto()
      autoTimer.current = window.setTimeout(() => dispatch({ type: 'next' }), AUTO_ADVANCE_MS)
    }
  }

  if (state.phase === 'booting') return <main className="min-h-screen font-theme" aria-busy="true" />
  if (state.phase === 'error' && state.error) {
    return <ErrorScreen locale={locale} kind={state.error.kind} code={state.error.code} onRetry={() => dispatch({ type: 'retry' })} />
  }
  if (state.phase === 'finished') {
    return (
      <main className="min-h-screen grid place-items-center px-6 font-theme text-center">
        <div className="qv-step-enter max-w-md space-y-3">
          <h1 className="text-3xl font-semibold">{t(locale, 'finished_title')}</h1>
          <p className="text-lg text-slate-600">{t(locale, 'finished_body')}</p>
        </div>
      </main>
    )
  }

  const step = state.steps[state.stepIndex]
  const keyHints = isSingleChoiceItem(step)
  return (
    <main className="min-h-screen font-theme">
      <ProgressBar locale={locale} current={state.stepIndex + 1} total={state.steps.length} />
      <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col justify-center px-6 py-24">
        <StepTransition stepKey={state.stepIndex}>
          <StepRenderer
            elements={step.elements}
            locale={locale}
            answers={state.answers}
            onAnswer={handleAnswer}
            requiredErrors={state.stepErrors}
            keyHints={keyHints}
            strings={{ required: t(locale, 'required_error'), unsupported: t(locale, 'unsupported') }}
          />
          <NavButtons
            locale={locale}
            canBack={state.stepIndex > 0}
            onBack={() => { clearAuto(); dispatch({ type: 'back' }) }}
            onNext={() => { clearAuto(); dispatch({ type: 'next' }) }}
          />
        </StepTransition>
      </div>
    </main>
  )
}
```

Implementation notes for the engineer: (a) the `state.steps[state.stepIndex]` read inside `handleAnswer` uses the **pre-answer** state — fine, the step identity doesn't change on answer; (b) StrictMode double-invokes the boot effect — the `cancelled` flag plus `phase !== 'booting'` guard keeps it single-shot per boot; if the double-mint still occurs in tests (two fetch calls), gate with a `bootStarted` ref instead and assert `fetchMock` called once.

- [ ] **Step 4: Run to verify pass.** `npx vitest run src/app/App.test.tsx` → PASS. Then full suite `npm test` → all green.
- [ ] **Step 5: Manual look (dev-only, no VS needed).** Run `npm run dev` and open `http://localhost:5173/?fixture=mini`, `?fixture=matrix`, `?fixture=widgets`. Walk through with keyboard only. Check: focus layout centred, cards look polished (this is the moment to adjust Tailwind classes — typography scale, spacing, card hover — while keeping tests green), matrix scrolls horizontally when the window is narrow.
- [ ] **Step 6: Commit.** `git commit -am "feat(web-viewer): App shell — boot, focus navigation, auto-advance, fixtures, finished screen"`

---

### Task 13: Schema 7 manifest + validation script

**Files:** Create `web-viewer/manifest.json`, replace `web-viewer/scripts/validate-manifest.mjs`.

- [ ] **Step 1: Write `manifest.json`** (must agree with `derive.ts` widgets and `bootstrap.ts` VIEWER_ID/VIEWER_VERSION):

```json
{
  "viewer_id": "behaverse-web-viewer",
  "viewer_version": "v26.0611",
  "schema_support": {
    "questionnaire": ["v26.0609"],
    "instrument": ["v26.0609"],
    "runtime": ["v26.0603"],
    "response": ["v26.0603"],
    "session": ["v26.0603"]
  },
  "evaluator": { "language_version": "none", "functions": [] },
  "widgets": [
    "choice.nominal.single", "choice.ordinal.single", "choice.interval.single", "choice.ratio.single",
    "choice.nominal.multiple",
    "number.ratio", "number.interval",
    "text.nominal", "text.interval", "text.ratio"
  ],
  "scorer_impl_kinds": ["wasm"],
  "behavioural_channels": [],
  "locale_switching": false,
  "resume": false
}
```

- [ ] **Step 2: Replace the stub `scripts/validate-manifest.mjs`:**

```js
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import Ajv2020 from 'ajv/dist/2020.js'
import addFormats from 'ajv-formats'

const here = dirname(fileURLToPath(import.meta.url))
const manifest = JSON.parse(readFileSync(join(here, '..', 'manifest.json'), 'utf8'))
const schema = JSON.parse(readFileSync(join(here, '..', '..', 'schemas', 'viewer_conformance', 'schema.json'), 'utf8'))

const ajv = new Ajv2020({ strict: false })
addFormats(ajv)
if (!ajv.validate(schema, manifest)) {
  console.error('manifest.json does NOT validate against Schema 7:')
  console.error(ajv.errors)
  process.exit(1)
}
const { VIEWER_ID, VIEWER_VERSION } = await import('../src/app/bootstrap.ts').catch(() => ({}))
if (VIEWER_ID && (manifest.viewer_id !== VIEWER_ID || manifest.viewer_version !== VIEWER_VERSION)) {
  console.error(`manifest identity ${manifest.viewer_id}@${manifest.viewer_version} != bootstrap.ts ${VIEWER_ID}@${VIEWER_VERSION}`)
  process.exit(1)
}
console.log('manifest.json: valid Schema 7 ✓')
```

Note: node can't import `.ts` directly — if the dynamic import fails it silently skips the identity check (the `catch`); that's acceptable (the Schema 7 validation is the hard gate). Alternatively grep: read `src/app/bootstrap.ts` as text and assert it contains `'${manifest.viewer_id}'` and `'${manifest.viewer_version}'` — implement the grep variant, it always runs:

```js
const bootstrap = readFileSync(join(here, '..', 'src', 'app', 'bootstrap.ts'), 'utf8')
for (const [name, val] of [['VIEWER_ID', manifest.viewer_id], ['VIEWER_VERSION', manifest.viewer_version]]) {
  if (!bootstrap.includes(`'${val}'`)) {
    console.error(`bootstrap.ts does not contain ${name} value '${val}' from manifest.json`)
    process.exit(1)
  }
}
```

(Use the grep variant INSTEAD of the dynamic-import block.)

- [ ] **Step 3: Verify.** Run: `node scripts/validate-manifest.mjs` → `manifest.json: valid Schema 7 ✓`; then break a field temporarily to confirm it exits 1; restore. Run `npm test` → all green including the manifest step.
- [ ] **Step 4: Commit.** `git commit -am "feat(web-viewer): Schema 7 conformance manifest + validation in npm test"`

---

### Task 14: Additive CORS on the Viewer Service

**Files:** Modify `viewer-service/src/viewer_service/api/app.py` (read it first; add middleware in `create_app`), `viewer-service/src/viewer_service/config.py` (add the env var alongside the existing ones, matching its style). Test: `viewer-service/tests/test_cors.py`.

- [ ] **Step 1: Failing test** (`viewer-service/tests/test_cors.py`; follow the existing VS test fixtures — check `viewer-service/tests/conftest.py` for the app/client pattern and reuse it):

```python
def test_cors_preflight_allows_configured_origin(monkeypatch, client_factory):
    monkeypatch.setenv("VS_CORS_ORIGINS", "http://localhost:5173")
    client = client_factory()
    r = client.options(
        "/v1/sessions/new",
        headers={"Origin": "http://localhost:5173",
                 "Access-Control-Request-Method": "POST",
                 "Access-Control-Request-Headers": "content-type,authorization"},
    )
    assert r.status_code == 200
    assert r.headers["access-control-allow-origin"] == "http://localhost:5173"


def test_no_cors_headers_when_unconfigured(client):
    r = client.get("/healthz", headers={"Origin": "http://localhost:5173"})
    assert "access-control-allow-origin" not in r.headers
```

Adapt fixture names to what `conftest.py` actually provides (if there's no `client_factory`, build the app inline the way other tests do after setting the env var).

- [ ] **Step 2: Run to verify fail.** `cd viewer-service && DOCKER_CONFIG=/tmp/lib_docker pytest tests/test_cors.py -q` → FAIL.
- [ ] **Step 3: Implement** — in `create_app` (mirror how `library/` consumes `LIBRARY_CORS_ORIGINS`; check `library/src/library/api/app.py` and copy its pattern):

```python
from starlette.middleware.cors import CORSMiddleware

# inside create_app(), after the app is constructed:
origins = [o.strip() for o in os.environ.get("VS_CORS_ORIGINS", "").split(",") if o.strip()]
if origins:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_methods=["*"],
        allow_headers=["*"],
    )
```

- [ ] **Step 4: Run the full VS suite.** `DOCKER_CONFIG=/tmp/lib_docker pytest viewer-service/ -q` (own invocation — never combined with `library/`) → 118 passed (116 + 2).
- [ ] **Step 5: Document** — add a line to `viewer-service/README.md` Development section: `export VS_CORS_ORIGINS=http://localhost:5173   # for the web-viewer dev server`.
- [ ] **Step 6: Commit.** `git add viewer-service && git commit -m "feat(viewer-service): additive CORS middleware via VS_CORS_ORIGINS (web-viewer dev)"`

---

### Task 15: README, FOLLOWUPS, final verification

**Files:** Create `web-viewer/README.md`, `web-viewer/FOLLOWUPS.md`.

- [ ] **Step 1: `README.md`** — cover: what WV-A is (+ link to spec); dev quickstart (`npm install`, `npm run dev`, fixture URLs); running against a live VS (start Library + VS per `viewer-service/README.md`, `export VS_CORS_ORIGINS=http://localhost:5173`, register the manifest `curl -X POST http://localhost:8001/v1/viewers -H 'content-type: application/json' -d @manifest.json`, create an `anonymous_link` deployment, open `http://localhost:5173/?deployment=<id>`); the URL contract table from the spec §3.1; presentation modes (`focus` default / `style.x_presentation: "classic"` / `x_auto_advance: false`); the in-memory-token caveat (refresh restarts until WV-E); test commands.
- [ ] **Step 2: `FOLLOWUPS.md`** — seed with spec §13 verbatim (hand-written types vs regenerated examples; `style.layout` refinements; narrow-viewport matrix; token-in-memory; viewer_version bump check; design/08 presentation-modes note at merge; auto-advance a11y revisit + Godot `x_presentation` parity).
- [ ] **Step 3: Full verification** (repo root):

```bash
( cd web-viewer && npm test && npm run typecheck && npm run build )
DOCKER_CONFIG=/tmp/lib_docker pytest viewer-service/ -q
```

Expected: all web-viewer tests + manifest validation green, clean build, 118 VS tests green.

- [ ] **Step 4: Live smoke (manual, best-effort).** If Docker/Postgres are healthy in this env, follow the README live-VS steps end-to-end and fill the mini questionnaire in a real browser via the dev server; record the outcome honestly in the final report (skip if the env can't run it — note that instead).
- [ ] **Step 5: Commit.** `git add web-viewer && git commit -m "docs(web-viewer): README + FOLLOWUPS; WV-A complete"`

---

### Task 16: design/08 note + merge to master

- [ ] **Step 1:** Add a short paragraph to `design/08_viewer.md` §"Web Viewer" (after "Required features") documenting presentation modes: focus (one-question-per-view, default; auto-advance on single-choice, `style.x_auto_advance: false` disables) vs classic (authored page-at-a-time, `style.x_presentation: "classic"`); declared/deterministic, so within the cross-viewer contract; Native Viewer must match or declare non-support. Commit: `git commit -am "docs(design): Web Viewer presentation modes (focus default, classic opt-out)"`.
- [ ] **Step 2:** Use superpowers:finishing-a-development-branch — merge `wv-a-web-viewer` to `master` locally + push (**no PR** — owner preference). Before merging re-run the Task 15 verification block.

---

## Self-review notes (done at planning time)

- **Spec coverage:** §1.1 bullets map to Tasks 1 (scaffold), 5 (URL contract + bootstrap + errors), 2–3+7–10 (renderer incl. matrix + unsupported), 4+11–12 (steps/nav/gating/state), 1+5+12 (theming), 7–10+12 (a11y), 6 (chrome strings), 13 (manifest), 12 (fixture mode), 14 (CORS — implied by "calls the VS from a browser"), 15–16 (docs + merge). Spec §11 testing list: units (T2–5, 11), widget RTL+axe (T7–10), renderer integration (T10, T12 fixtures), app flow (T12), manifest validation (T13), live smoke (T15).
- **Type consistency:** `AnswerValue`/`MergedChoice`/`RuntimeElement` defined once in Task 2 and imported everywhere; `Step`/`StepElement` from Task 4 used in 11–12; `MintErr['kind']` strings match ErrorScreen keys (`invalid_link|not_open|closed|failed`); `VIEWER_ID/VIEWER_VERSION` cross-checked against `manifest.json` by the Task 13 script.
- **Known judgment calls:** StepTransition keeps stale children for 200 ms during leave (intended); auto-advance reads pre-answer step (safe — identity unchanged); StrictMode double-boot mitigation documented in Task 12 step 3.
