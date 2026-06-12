# Web Viewer WV-D (Logic, Validation, In-Session Scoring) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Embed the WV-C expression evaluator into the Web Viewer to drive `show_if` visibility, `skip`/`branch` navigation, `piping`, per/cross-question validation, and the deterministic scoring helpers (`reversed_value` → `scored_value`, Solution `correct`); flip the Schema 7 manifest to declare logic support so the VS stops stripping logic. Spec: [2026-06-12-web-viewer-wv-d-design.md](../specs/2026-06-12-web-viewer-wv-d-design.md) (all F1–F5 accepted).

**Architecture:** A new `web-viewer/src/logic/` of **pure functions over `(runtime, answers, evaluator, resolver)`** — compile-once program bundle, visibility, a graph-walk navigator (replacing the static `stepIndex+1`), piping, validation, scoring. The evaluator is injected behind a tiny `LogicEvaluator` port: production lazy-loads the real `--target web` WASM; engine tests inject a deterministic fake (WASM correctness is already proven by WV-C's `test_vectors.json`). The reducer stays pure — `App.advance()` computes the next-step target via the navigator and dispatches a `goto`; the reducer maintains a visited-stack for Back.

**Tech Stack:** existing web-viewer (Vite/React19/TS/vitest/RTL); the `questionnaire-expression-evaluator/` web package (built `--target web`) as a local build dependency. Rust toolchain installed (`. "$HOME/.cargo/env"`).

**Branch:** create `wv-d-web-viewer` from `master` before Task 1; merge `--no-ff` + push at the end (no PRs).

**Conventions (every task):** run JS tests from `web-viewer/` with `npx vitest run`; NEVER bare `tsc` (only `npm run typecheck`); commit per task. Logic modules are React-free and injected-evaluator; only `App.tsx` wires state. Reuse WV-A/B helpers (`flattenSteps`/`Step`/`StepEntry`/`stepEntries`/`requiredUnanswered` from `steps.ts`; `isItem`/`isSection`/`isMessage` from `../renderer/guards`; `mergeOptions` from `../renderer/merge`; `elementKey`/`sectionChildFallback` from `../renderer/keys`).

---

## File map

| Path | Responsibility |
|---|---|
| `web-viewer/src/logic/types.ts` | `LogicEvaluator`, `Bindings`, `EvalContext`, `ScoreResolver`, `CompiledRule`, `Programs` |
| `web-viewer/src/logic/evaluator.ts` | `loadEvaluator()` (prod: lazy WASM adapter), `makeFakeEvaluator(table)`, `wasmAdapter(exports)` |
| `web-viewer/src/logic/bindings.ts` | `makeBindings(answers, runtime, resolver)` → `Bindings` (answer→value map; var fallthrough to score) |
| `web-viewer/src/logic/compile.ts` | `collectPrograms(runtime, evaluator)` → `Programs` (fail-open show_if / fail-safe rules) |
| `web-viewer/src/logic/visibility.ts` | `isElementVisible(key, programs, ctx)`; `stepHasVisibleElement(step, …)`; `visibleEntries(step, …)` |
| `web-viewer/src/logic/navigation.ts` | `nextStepIndex(...)` (graph walk, forward-only skip/branch), `pageFirstStepIndex` |
| `web-viewer/src/logic/piping.ts` | `pipedText(elementKey, field, original, programs, ctx)` |
| `web-viewer/src/logic/validation.ts` | `validateStep(step, programs, ctx, locale)` → `{ key, message }[]` |
| `web-viewer/src/logic/scoring.ts` | `ScoreResolver` default (null), `scoredValueFor(option, prompt, value, evaluator)`, `solutionCorrect(item, value, locale, evaluator)` |
| `web-viewer/src/app/responses.ts` (modify) | `buildItemRow` gains `scored_value` + `correct` (injected) |
| `web-viewer/src/app/session.ts` (modify) | `visited: number[]`; `goto`/`back` maintain it; `validationErrors` channel |
| `web-viewer/src/app/App.tsx` (modify) | load evaluator at boot; build programs; render visible+piped elements; advance via navigator; validation block |
| `web-viewer/manifest.json` (modify) | `logic_actions` + `evaluator` + version bump |
| `web-viewer/scripts/build-evaluator.mjs` (new) | build `--target web` + copy into `src/logic/wasm/` (gitignored) |
| `web-viewer/package.json` (modify) | `predev`/`prebuild` run build-evaluator; VIEWER_VERSION-linked |
| `design/08_viewer.md` (modify, Task 11) | one-line note: viewer now supports the 4 logic actions + evaluator |
| `questionnaire-expression-evaluator/.gitignore` + root `.gitignore` (modify, Task 1) | broaden `web/pkg/` → `web/pkg*/` |

---

### Task 1: Evaluator port, fake, adapter + build wiring

**Files:** create `web-viewer/src/logic/types.ts`, `web-viewer/src/logic/evaluator.ts`, `web-viewer/src/logic/evaluator.test.ts`, `web-viewer/scripts/build-evaluator.mjs`; modify `questionnaire-expression-evaluator/.gitignore`, root `.gitignore`, `web-viewer/.gitignore`, `web-viewer/package.json`.

- [ ] **Step 1: Branch + gitignore.** From repo root `git checkout -b wv-d-web-viewer`. Broaden the evaluator gitignores so the `--target web` build dir is ignored: in `questionnaire-expression-evaluator/.gitignore` change `web/pkg/` → `web/pkg*/`; in root `.gitignore` change `questionnaire-expression-evaluator/web/pkg/` → `questionnaire-expression-evaluator/web/pkg*/`. Add to `web-viewer/.gitignore`: `src/logic/wasm/`.
- [ ] **Step 2: types.ts:**

```ts
export type EvalValue = number | string | boolean | null | (number | string)[]
export interface Bindings { var(id: string): unknown; score(id: string): unknown }
export interface LogicEvaluator {
  condition(expr: string, bindings: Bindings): boolean
  reversedValue(value: number, min: number, max: number): number
  compareSolution(cmp: 'equals' | 'set_equals' | 'matches_regex', response: unknown, expected: unknown): boolean
  check(expr: string): string | null          // null = valid; message = parse error
}
export interface ScoreResolver { score(id: string): EvalValue }
```

- [ ] **Step 3: Failing tests** `evaluator.test.ts` (the fake + the adapter-over-fake-exports; NO real wasm):

```ts
import { makeFakeEvaluator, wasmAdapter } from './evaluator'

test('makeFakeEvaluator drives condition from a table and delegates helpers', () => {
  const ev = makeFakeEvaluator({ 'a == 1': true, 'a == 2': false })
  expect(ev.condition('a == 1', { var: () => 1, score: () => null })).toBe(true)
  expect(ev.condition('a == 2', { var: () => 1, score: () => null })).toBe(false)
  expect(ev.condition('unlisted', { var: () => null, score: () => null })).toBe(false) // default false
  expect(ev.reversedValue(1, 0, 6)).toBe(5)
  expect(ev.compareSolution('equals', 3, 3)).toBe(true)
  expect(ev.check('anything')).toBeNull()
})
test('makeFakeEvaluator supports a function table for binding-dependent results', () => {
  const ev = makeFakeEvaluator({ 'a == 1': (b) => b.var('a') === 1 })
  expect(ev.condition('a == 1', { var: () => 1, score: () => null })).toBe(true)
  expect(ev.condition('a == 1', { var: () => 2, score: () => null })).toBe(false)
})
test('wasmAdapter maps the WASM exports onto the port (calls + result mapping)', () => {
  const calls: unknown[][] = []
  const exports = {
    evaluate_condition: (expr: string, b: unknown) => { calls.push(['cond', expr, b]); return expr === 'yes' },
    reversed: (v: number, mn: number, mx: number) => { calls.push(['rev', v, mn, mx]); return mx + mn - v },
    compare: (cmp: string, r: unknown, e: unknown) => { calls.push(['cmp', cmp, r, e]); return r === e },
    check_expression: (expr: string) => (expr === 'bad' ? 'parse error at 0: x' : undefined),
  }
  const ev = wasmAdapter(exports as never)
  const bindings = { var: () => 1, score: () => null }
  expect(ev.condition('yes', bindings)).toBe(true)
  expect(ev.condition('no', bindings)).toBe(false)
  expect(ev.reversedValue(1, 0, 6)).toBe(5)
  expect(ev.compareSolution('equals', 2, 2)).toBe(true)
  expect(ev.check('bad')).toBe('parse error at 0: x')
  expect(ev.check('ok')).toBeNull()                 // undefined → null
  expect(calls[0]).toEqual(['cond', 'yes', bindings])
})
```

- [ ] **Step 4: Run → fail. Implement** `evaluator.ts`:

```ts
import type { Bindings, LogicEvaluator } from './types'

type FakeResult = boolean | ((b: Bindings) => boolean)
export function makeFakeEvaluator(table: Record<string, FakeResult> = {}): LogicEvaluator {
  return {
    condition(expr, bindings) {
      const r = table[expr]
      if (typeof r === 'function') return r(bindings)
      return r ?? false
    },
    reversedValue: (v, min, max) => max + min - v,
    compareSolution(cmp, response, expected) {
      if (cmp === 'set_equals') {
        const a = Array.isArray(response) ? response : []
        const b = Array.isArray(expected) ? expected : []
        return a.length === b.length && a.every((x) => b.includes(x)) && b.every((y) => a.includes(y))
      }
      if (cmp === 'matches_regex') {
        try { return typeof response === 'string' && typeof expected === 'string' && new RegExp(expected).test(response) }
        catch { return false }
      }
      return JSON.stringify(response) === JSON.stringify(expected)
    },
    check: () => null,
  }
}

/** The shape of the wasm-pack `--target web` exports we use. */
export interface WasmExports {
  evaluate_condition(expr: string, bindings: Bindings): boolean
  reversed(value: number, min: number, max: number): number
  compare(cmp: string, response: unknown, expected: unknown): boolean
  check_expression(expr: string): string | undefined
}
export function wasmAdapter(exports: WasmExports): LogicEvaluator {
  return {
    condition: (expr, bindings) => {
      try { return exports.evaluate_condition(expr, bindings) } catch { return false }  // parse error throws → treat as false
    },
    reversedValue: (v, min, max) => exports.reversed(v, min, max),
    compareSolution: (cmp, response, expected) => exports.compare(cmp, response, expected),
    check: (expr) => exports.check_expression(expr) ?? null,
  }
}

/** Production: lazy-load the real WASM (built `--target web` into ./wasm). Browser only. */
export async function loadEvaluator(): Promise<LogicEvaluator> {
  const mod = await import('./wasm/questionnaire_expr_web.js')
  // @ts-expect-error wasm-pack default export is the async init
  await mod.default(new URL('./wasm/questionnaire_expr_web_bg.wasm', import.meta.url))
  return wasmAdapter(mod as unknown as WasmExports)
}
```

- [ ] **Step 5: build-evaluator script** `web-viewer/scripts/build-evaluator.mjs`:

```js
import { execSync } from 'node:child_process'
import { cpSync, mkdirSync, rmSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const evalWeb = join(here, '..', '..', 'questionnaire-expression-evaluator', 'web')
const dest = join(here, '..', 'src', 'logic', 'wasm')

execSync('. "$HOME/.cargo/env" && wasm-pack build --target web --out-dir pkg-web', { cwd: evalWeb, stdio: 'inherit', shell: '/bin/bash' })
rmSync(dest, { recursive: true, force: true })
mkdirSync(dest, { recursive: true })
for (const f of ['questionnaire_expr_web.js', 'questionnaire_expr_web_bg.wasm', 'questionnaire_expr_web.d.ts', 'questionnaire_expr_web_bg.wasm.d.ts']) {
  const src = join(evalWeb, 'pkg-web', f)
  if (existsSync(src)) cpSync(src, join(dest, f))
}
console.log('evaluator wasm copied to src/logic/wasm/')
```

- [ ] **Step 6: package.json** — add scripts (keep existing): `"build:evaluator": "node scripts/build-evaluator.mjs"`, `"predev": "node scripts/build-evaluator.mjs"`, `"prebuild": "node scripts/build-evaluator.mjs"`. (Tests do NOT trigger it — vitest never imports `./wasm`.)
- [ ] **Step 7:** `npx vitest run src/logic/evaluator.test.ts` → PASS; `npm run typecheck` clean (the `loadEvaluator` dynamic import of a not-yet-built `./wasm` must not break typecheck — the `@ts-expect-error` + dynamic `import()` is not statically resolved by `tsc` for missing modules only if `noResolve`… if `tsc` errors on the missing `./wasm/...` module, change the import to `import(/* @vite-ignore */ './wasm/questionnaire_expr_web.js' as string)` or add a minimal `src/logic/wasm/.gitkeep` + ambient `declare module './wasm/questionnaire_expr_web.js'` in a `src/logic/wasm.d.ts`. Implement the ambient-declaration approach: create `src/logic/wasm-ambient.d.ts` with `declare module './wasm/questionnaire_expr_web.js' { const x: unknown; export = x }` — report what was needed.)
- [ ] **Step 8: Commit.** `git add web-viewer questionnaire-expression-evaluator/.gitignore .gitignore && git commit -m "feat(web-viewer): LogicEvaluator port (fake + wasm adapter) + --target web build wiring"`

---

### Task 2: Bindings + collectPrograms

**Files:** create `web-viewer/src/logic/bindings.ts`, `web-viewer/src/logic/compile.ts`, `web-viewer/src/logic/compile.test.ts`.

- [ ] **Step 1: Failing tests** `compile.test.ts`:

```ts
import { collectPrograms } from './compile'
import { makeBindings } from './bindings'
import { makeFakeEvaluator } from './evaluator'
import type { Runtime } from '../renderer/types'

const opt = { input_data_type: 'choice', measurement_type: 'ordinal', selection: 'single',
  options: [{ index: 1, value: 0 }], content: { en: { options: [{ index: 1, text: 'A' }] } } }
const runtime = (): Runtime => ({
  provenance: {}, metadata: { id: 'qst_x', title: 'T', language: 'en' }, locale: 'en',
  pages: [
    { id: 'p1', elements: [
      { id: 'it_1', question: { prompt: { content: { en: { text: 'Q1' } } } }, option: opt },
      { id: 'it_2', question: { prompt: { content: { en: { text: 'Q2' } } } }, option: opt, show_if: 'it_1 == 0' },
    ] },
    { id: 'p2', elements: [{ id: 'it_3', question: { prompt: { content: { en: { text: 'Q3' } } } }, option: opt }] },
  ],
  logic: [
    { id: 'r_skip', type: 'skip', condition: 'it_1 == 0', action: { skip_to: 'p2' } },
    { id: 'r_bad', type: 'branch', condition: '1 +', action: { skip_to: 'p2' } },     // malformed → dropped
  ],
  validation: [{ id: 'v_x', condition: 'is_empty(it_3)', message: 'pick one', targets: ['it_3'] }],
} as never)

test('collectPrograms compiles show_if, rules, cross-validation; drops malformed rules (fail-safe)', () => {
  const ev = makeFakeEvaluator()
  const programs = collectPrograms(runtime(), ev)
  expect(programs.showIf.has('it_2')).toBe(true)
  expect(programs.rules.map((r) => r.id)).toEqual(['r_skip'])       // r_bad dropped (check() flags it)
  expect(programs.crossValidation.map((v) => v.id)).toEqual(['v_x'])
})
test('makeBindings: var reads answers; falls through to score resolver for unknown ids', () => {
  const b = makeBindings({ it_1: 0 }, runtime(), { score: (id) => (id === 'sc' ? 42 : null) })
  expect(b.var('it_1')).toBe(0)
  expect(b.var('sc')).toBe(42)          // unknown answer id → score fallthrough (WV-C F1)
  expect(b.var('nope')).toBeNull()
  expect(b.score('sc')).toBe(42)
})
```

- [ ] **Step 2: Run → fail. Implement** `bindings.ts`:

```ts
import type { AnswerValue, Runtime } from '../renderer/types'
import type { Bindings, ScoreResolver } from './types'

export function makeBindings(answers: Record<string, AnswerValue>, _runtime: Runtime, resolver: ScoreResolver): Bindings {
  return {
    var(id) {
      if (id in answers) return answers[id] as unknown
      const s = resolver.score(id)            // unknown answer id → maybe a score id (host fallthrough, WV-C F1)
      return s ?? null
    },
    score: (id) => resolver.score(id) ?? null,
  }
}
```

`compile.ts`:

```ts
import { isItem, isSection } from '../renderer/guards'
import { elementKey, pageElementFallback, sectionChildFallback } from '../renderer/keys'
import type { Runtime, RuntimeElement } from '../renderer/types'
import type { LogicEvaluator } from './types'

export type CompiledRule = { id: string; type: 'skip' | 'visibility' | 'piping' | 'branch'; condition: string; action: Record<string, unknown> }
export type CompiledValidation = { id: string; condition: string; message: string; targets: string[] }
export type Programs = {
  showIf: Map<string, string>            // elementKey → expr (compile-validated; malformed dropped → visible)
  rules: CompiledRule[]
  crossValidation: CompiledValidation[]
}

function walkElements(runtime: Runtime, visit: (key: string, el: RuntimeElement) => void) {
  runtime.pages.forEach((page) =>
    page.elements.forEach((el, i) => {
      const key = elementKey(el, pageElementFallback(page.id, i))
      visit(key, el)
      if (isSection(el)) el.elements.forEach((c, j) => visit(elementKey(c, sectionChildFallback(key, j)), c))
    }),
  )
}

export function collectPrograms(runtime: Runtime, ev: LogicEvaluator): Programs {
  const showIf = new Map<string, string>()
  walkElements(runtime, (key, el) => {
    const expr = (el as { show_if?: unknown }).show_if
    if (typeof expr === 'string' && expr.length > 0) {
      if (ev.check(expr) === null) showIf.set(key, expr)
      else console.warn(`web-viewer: dropping malformed show_if on ${key}: ${expr}`)
    }
  })
  const rules: CompiledRule[] = []
  for (const r of (runtime.logic ?? []) as CompiledRule[]) {
    if (ev.check(r.condition) === null) rules.push(r)
    else console.warn(`web-viewer: dropping malformed logic rule ${r.id}`)
  }
  const crossValidation: CompiledValidation[] = []
  for (const v of (runtime.validation ?? []) as CompiledValidation[]) {
    if (ev.check(v.condition) === null) crossValidation.push(v)
    else console.warn(`web-viewer: dropping malformed validation ${v.id}`)
  }
  return { showIf, rules, crossValidation }
}
```

(Note: `runtime.validation` + `runtime.logic` are `unknown[]` on the WV-A `Runtime` type — cast as above; add `validation?: unknown[]` to `Runtime` in `renderer/types.ts` if absent, mirroring `logic?`.)

- [ ] **Step 3:** PASS + typecheck. **Commit:** `git commit -am "feat(web-viewer): bindings + collectPrograms (compile-once, fail-safe drop of malformed exprs)"`

---

### Task 3: Visibility

**Files:** create `web-viewer/src/logic/visibility.ts`, `web-viewer/src/logic/visibility.test.ts`.

- [ ] **Step 1: Failing tests** `visibility.test.ts`:

```ts
import { isElementVisible, stepHasVisibleElement, visibleEntries } from './visibility'
import { collectPrograms } from './compile'
import { makeFakeEvaluator } from './evaluator'
import { flattenSteps } from '../app/steps'
import type { Runtime } from '../renderer/types'

const opt = { input_data_type: 'choice', measurement_type: 'ordinal', selection: 'single',
  options: [{ index: 1, value: 0 }], content: { en: { options: [{ index: 1, text: 'A' }] } } }
const item = (id: string, show_if?: string) =>
  ({ id, question: { prompt: { content: { en: { text: id } } } }, option: opt, ...(show_if ? { show_if } : {}) })
const rt = (): Runtime => ({
  provenance: {}, metadata: { id: 'q', title: 'T', language: 'en' }, locale: 'en',
  pages: [{ id: 'p1', elements: [item('it_a'), item('it_b', 'it_a == 0')] }],
  logic: [{ id: 'r_hide', type: 'visibility', condition: 'it_a == 9', action: { target_id: 'it_a', show: false } }],
} as never)

function ctx(answers: Record<string, unknown>, table: Record<string, boolean>) {
  const ev = makeFakeEvaluator(table)
  return { ev, programs: collectPrograms(rt(), ev), bindings: { var: (id: string) => answers[id] ?? null, score: () => null } }
}

test('show_if absent → visible; show_if true → visible; false → hidden', () => {
  const c = ctx({ it_a: 0 }, { 'it_a == 0': true, 'it_a == 9': false })
  expect(isElementVisible('it_a', c.programs, c.ev, c.bindings)).toBe(true)
  expect(isElementVisible('it_b', c.programs, c.ev, c.bindings)).toBe(true)
  const c2 = ctx({ it_a: 1 }, { 'it_a == 0': false, 'it_a == 9': false })
  expect(isElementVisible('it_b', c2.programs, c2.ev, c2.bindings)).toBe(false)
})
test('visibility rule show:false hides its target even when show_if would pass', () => {
  const c = ctx({ it_a: 9 }, { 'it_a == 0': false, 'it_a == 9': true })
  expect(isElementVisible('it_a', c.programs, c.ev, c.bindings)).toBe(false)
})
test('stepHasVisibleElement + visibleEntries reflect visibility', () => {
  const steps = flattenSteps(rt())
  const stepB = steps[1]                 // the show_if item, in focus mode = its own step
  const c = ctx({ it_a: 1 }, { 'it_a == 0': false, 'it_a == 9': false })
  expect(stepHasVisibleElement(stepB, c.programs, c.ev, c.bindings)).toBe(false)
  expect(visibleEntries(stepB, c.programs, c.ev, c.bindings)).toEqual([])
})
```

- [ ] **Step 2: Run → fail. Implement** `visibility.ts`:

```ts
import { stepEntries, type Step } from '../app/steps'
import type { Bindings, LogicEvaluator } from './types'
import type { Programs } from './compile'

export function isElementVisible(key: string, programs: Programs, ev: LogicEvaluator, bindings: Bindings): boolean {
  // visibility rules win (explicit show/hide); first matching rule by document order
  for (const r of programs.rules) {
    if (r.type === 'visibility' && r.action.target_id === key && ev.condition(r.condition, bindings)) {
      return r.action.show !== false
    }
  }
  const expr = programs.showIf.get(key)
  if (expr === undefined) return true
  return ev.condition(expr, bindings)
}

export function visibleEntries(step: Step, programs: Programs, ev: LogicEvaluator, bindings: Bindings) {
  return stepEntries(step).filter((e) => isElementVisible(e.key, programs, ev, bindings))
}
export function stepHasVisibleElement(step: Step, programs: Programs, ev: LogicEvaluator, bindings: Bindings): boolean {
  return visibleEntries(step, programs, ev, bindings).length > 0
}
```

- [ ] **Step 3:** PASS + typecheck. **Commit:** `git commit -am "feat(web-viewer): visibility (show_if + visibility rules; visible-entry filtering)"`

---

### Task 4: Navigation (graph walk)

**Files:** create `web-viewer/src/logic/navigation.ts`, `web-viewer/src/logic/navigation.test.ts`.

- [ ] **Step 1: Failing tests** `navigation.test.ts`:

```ts
import { nextStepIndex, pageFirstStepIndex } from './navigation'
import { collectPrograms } from './compile'
import { makeFakeEvaluator } from './evaluator'
import { flattenSteps } from '../app/steps'
import type { Runtime } from '../renderer/types'

const opt = { input_data_type: 'choice', measurement_type: 'ordinal', selection: 'single',
  options: [{ index: 1, value: 0 }], content: { en: { options: [{ index: 1, text: 'A' }] } } }
const item = (id: string, show_if?: string) => ({ id, question: { prompt: { content: { en: { text: id } } } }, option: opt, ...(show_if ? { show_if } : {}) })
const rt = (): Runtime => ({
  provenance: {}, metadata: { id: 'q', title: 'T', language: 'en' }, locale: 'en',
  pages: [
    { id: 'p1', elements: [item('it_1')] },
    { id: 'p2', elements: [item('it_2', 'it_1 == 0')] },   // page 2 hidden when it_1 != 0
    { id: 'p3', elements: [item('it_3')] },
  ],
  logic: [{ id: 'r_skip', type: 'skip', condition: 'it_1 == 9', action: { skip_to: 'p3' } }],
} as never)

function ctx(table: Record<string, boolean>, answers: Record<string, unknown> = {}) {
  const ev = makeFakeEvaluator(table)
  return { steps: flattenSteps(rt()), programs: collectPrograms(rt(), ev), ev,
           bindings: { var: (id: string) => answers[id] ?? null, score: () => null } }
}

test('linear advance to the next visible step', () => {
  const c = ctx({ 'it_1 == 0': true, 'it_1 == 9': false })
  expect(nextStepIndex(c.steps, c.programs, c.ev, c.bindings, 0)).toBe(1)
})
test('hidden step is skipped', () => {
  const c = ctx({ 'it_1 == 0': false, 'it_1 == 9': false })  // p2 hidden
  expect(nextStepIndex(c.steps, c.programs, c.ev, c.bindings, 0)).toBe(2)  // jumps to p3
})
test('skip rule (condition true) jumps forward to its target page', () => {
  const c = ctx({ 'it_1 == 0': false, 'it_1 == 9': true })
  expect(nextStepIndex(c.steps, c.programs, c.ev, c.bindings, 0)).toBe(2)  // skip_to p3
})
test('past the last reachable step → null (finishing)', () => {
  const c = ctx({ 'it_1 == 0': true, 'it_1 == 9': false })
  expect(nextStepIndex(c.steps, c.programs, c.ev, c.bindings, 2)).toBeNull()
})
test('pageFirstStepIndex finds the first step of a page', () => {
  const c = ctx({})
  expect(pageFirstStepIndex(c.steps, 'p3')).toBe(2)
  expect(pageFirstStepIndex(c.steps, 'nope')).toBeNull()
})
```

- [ ] **Step 2: Run → fail. Implement** `navigation.ts`:

```ts
import type { Step } from '../app/steps'
import { stepHasVisibleElement } from './visibility'
import type { Bindings, LogicEvaluator } from './types'
import type { Programs } from './compile'

export function pageFirstStepIndex(steps: Step[], pageId: string): number | null {
  const i = steps.findIndex((s) => s.pageId === pageId)
  return i < 0 ? null : i
}

/** Graph walk: apply the first forward-firing skip/branch rule, then scan to the next visible step. */
export function nextStepIndex(steps: Step[], programs: Programs, ev: LogicEvaluator, bindings: Bindings, current: number): number | null {
  let scanFrom = current + 1
  for (const r of programs.rules) {
    if ((r.type === 'skip' || r.type === 'branch') && ev.condition(r.condition, bindings)) {
      const target = pageFirstStepIndex(steps, String(r.action.skip_to ?? ''))
      if (target !== null && target > current) { scanFrom = target; break }  // forward-only
    }
  }
  for (let i = scanFrom; i < steps.length; i++) {
    if (stepHasVisibleElement(steps[i], programs, ev, bindings)) return i
  }
  return null
}
```

- [ ] **Step 3:** PASS + typecheck. **Commit:** `git commit -am "feat(web-viewer): navigation graph walk (forward-only skip/branch, hidden-step skip)"`

---

### Task 5: Piping

**Files:** create `web-viewer/src/logic/piping.ts`, `web-viewer/src/logic/piping.test.ts`.

- [ ] **Step 1: Failing tests** `piping.test.ts`:

```ts
import { pipedText } from './piping'
import { makeFakeEvaluator } from './evaluator'
import type { Programs } from './compile'

const programs = (): Programs => ({
  showIf: new Map(),
  rules: [{ id: 'r_pipe', type: 'piping', condition: 'true', action: { field_path: 'pages.p1.elements.0.prompt', source: 'it_name' } }],
  crossValidation: [],
})
const bindings = (answers: Record<string, unknown>) => ({ var: (id: string) => answers[id] ?? null, score: () => null })

test('piping substitutes the source answer when the rule fires and the field matches', () => {
  const ev = makeFakeEvaluator({ true: true })
  const text = pipedText('pages.p1.elements.0.prompt', 'Hello there', programs(), ev, bindings({ it_name: 'Ada' }))
  expect(text).toBe('Ada')
})
test('non-matching field path → original text unchanged', () => {
  const ev = makeFakeEvaluator({ true: true })
  expect(pipedText('pages.p1.elements.9.prompt', 'orig', programs(), ev, bindings({ it_name: 'Ada' }))).toBe('orig')
})
test('rule condition false → original text', () => {
  const ev = makeFakeEvaluator({ true: false })
  expect(pipedText('pages.p1.elements.0.prompt', 'orig', programs(), ev, bindings({ it_name: 'Ada' }))).toBe('orig')
})
```

- [ ] **Step 2: Run → fail. Implement** `piping.ts` (v1: substitute the source's stringified answer for the whole field when a piping rule's `field_path` matches and condition is true; unresolved/non-matching → original):

```ts
import type { Bindings, LogicEvaluator } from './types'
import type { Programs } from './compile'

/** Return the text to render for a field identified by `field`, applying any firing piping rule. */
export function pipedText(field: string, original: string, programs: Programs, ev: LogicEvaluator, bindings: Bindings): string {
  for (const r of programs.rules) {
    if (r.type !== 'piping') continue
    if (r.action.field_path !== field) continue
    if (!ev.condition(r.condition, bindings)) continue
    const v = bindings.var(String(r.action.source ?? ''))
    if (v === null || v === undefined) return original
    return Array.isArray(v) ? v.join(', ') : String(v)
  }
  return original
}
```

(Note: the App maps each rendered prompt to a stable `field_path` key — `pages.<pageId>.elements.<i>.prompt` — when it renders; v1 supports prompt-text piping, the dominant case. Unresolved paths no-op. Documented limitation in README.)

- [ ] **Step 3:** PASS + typecheck. **Commit:** `git commit -am "feat(web-viewer): piping (source-answer substitution into a matched field, condition-gated)"`

---

### Task 6: Validation

**Files:** create `web-viewer/src/logic/validation.ts`, `web-viewer/src/logic/validation.test.ts`.

- [ ] **Step 1: Failing tests** `validation.test.ts`:

```ts
import { validateStep } from './validation'
import { makeFakeEvaluator } from './evaluator'
import type { Programs } from './compile'
import type { Step } from '../app/steps'

const numItem = (id: string, validation?: unknown) =>
  ({ id, question: { prompt: { content: { en: { text: id } } } },
     option: { input_data_type: 'number', measurement_type: 'ratio' }, ...(validation ? { validation } : {}) })
const txtItem = (id: string, validation?: unknown) =>
  ({ id, question: { prompt: { content: { en: { text: id } } } },
     option: { input_data_type: 'text', measurement_type: 'nominal' }, ...(validation ? { validation } : {}) })
const step = (els: unknown[]): Step => ({ pageId: 'p1', elements: els.map((e) => ({ key: (e as { id: string }).id, element: e as never })) })
const noPrograms: Programs = { showIf: new Map(), rules: [], crossValidation: [] }

test('range validation: out-of-range fails with its message', () => {
  const s = step([numItem('it_age', { range: [0, 120], range_message: 'age 0–120' })])
  expect(validateStep(s, noPrograms, makeFakeEvaluator(), { it_age: 200 }, () => null, 'en')).toEqual([{ key: 'it_age', message: 'age 0–120' }])
  expect(validateStep(s, noPrograms, makeFakeEvaluator(), { it_age: 30 }, () => null, 'en')).toEqual([])
})
test('length validation on text', () => {
  const s = step([txtItem('it_code', { length: [3, 5], length_message: '3–5 chars' })])
  expect(validateStep(s, noPrograms, makeFakeEvaluator(), { it_code: 'ab' }, () => null, 'en')).toEqual([{ key: 'it_code', message: '3–5 chars' }])
  expect(validateStep(s, noPrograms, makeFakeEvaluator(), { it_code: 'abcd' }, () => null, 'en')).toEqual([])
})
test('format (regex) validation', () => {
  const s = step([txtItem('it_year', { format: '^\\d{4}$', format_message: '4 digits' })])
  expect(validateStep(s, noPrograms, makeFakeEvaluator(), { it_year: 'xx' }, () => null, 'en')).toEqual([{ key: 'it_year', message: '4 digits' }])
  expect(validateStep(s, noPrograms, makeFakeEvaluator(), { it_year: '1990' }, () => null, 'en')).toEqual([])
})
test('empty optional answer skips per-question validation', () => {
  const s = step([numItem('it_age', { range: [0, 120] })])
  expect(validateStep(s, noPrograms, makeFakeEvaluator(), {}, () => null, 'en')).toEqual([])
})
test('cross-question rule: condition true ⇒ error on each target', () => {
  const programs: Programs = { showIf: new Map(), rules: [],
    crossValidation: [{ id: 'v', condition: 'mismatch', message: 'fix it', targets: ['it_a', 'it_b'] }] }
  const ev = makeFakeEvaluator({ mismatch: true })
  expect(validateStep(step([]), programs, ev, {}, () => null, 'en'))
    .toEqual([{ key: 'it_a', message: 'fix it' }, { key: 'it_b', message: 'fix it' }])
})
```

- [ ] **Step 2: Run → fail. Implement** `validation.ts`:

```ts
import { isItem } from '../renderer/guards'
import type { AnswerValue } from '../renderer/types'
import type { Step } from '../app/steps'
import { makeBindings } from './bindings'
import type { Bindings, LogicEvaluator, ScoreResolver } from './types'
import type { Programs } from './compile'

export type ValidationError = { key: string; message: string }

function perQuestion(key: string, el: { option?: Record<string, unknown> }, v: Record<string, unknown>, value: AnswerValue): ValidationError | null {
  if (value === null || value === undefined || value === '') return null  // empty optional → required-gating handles it
  const range = v.range as [number | null, number | null] | undefined
  if (range && typeof value === 'number') {
    const [lo, hi] = range
    if ((lo !== null && value < lo) || (hi !== null && value > hi)) return { key, message: String(v.range_message ?? 'Value out of range.') }
  }
  const length = v.length as [number | null, number | null] | undefined
  if (length && typeof value === 'string') {
    const [lo, hi] = length
    if ((lo !== null && value.length < lo) || (hi !== null && value.length > hi)) return { key, message: String(v.length_message ?? 'Invalid length.') }
  }
  const fmt = v.format as string | undefined
  if (fmt && typeof value === 'string') {
    let ok = false
    try { ok = new RegExp(fmt).test(value) } catch { ok = true }   // malformed format → don't block (fail-open)
    if (!ok) return { key, message: String(v.format_message ?? 'Invalid format.') }
  }
  return null
}

export function validateStep(
  step: Step, programs: Programs, ev: LogicEvaluator,
  answers: Record<string, AnswerValue>, score: ScoreResolver['score'], _locale: string,
): ValidationError[] {
  const errors: ValidationError[] = []
  // per-question on the step's items
  const visit = (key: string, el: unknown) => {
    if (isItem(el as never)) {
      const v = (el as { validation?: Record<string, unknown> }).validation
      if (v) { const e = perQuestion(key, el as never, v, answers[key] ?? null); if (e) errors.push(e) }
    }
  }
  step.elements.forEach(({ key, element }) => {
    visit(key, element)
    const sub = (element as { elements?: unknown[] }).elements
    if (Array.isArray(sub)) sub.forEach((c, j) => visit(`${key}__r${j}`, c))
  })
  // cross-question: condition true ⇒ error
  const bindings: Bindings = makeBindings(answers, { pages: [] } as never, { score })
  for (const cv of programs.crossValidation) {
    if (ev.condition(cv.condition, bindings)) for (const t of cv.targets) errors.push({ key: t, message: cv.message })
  }
  return errors
}
```

- [ ] **Step 3:** PASS + typecheck. **Commit:** `git commit -am "feat(web-viewer): validation (per-question range/length/format + cross-question condition rules)"`

---

### Task 7: Scoring helpers

**Files:** create `web-viewer/src/logic/scoring.ts`, `web-viewer/src/logic/scoring.test.ts`.

- [ ] **Step 1: Failing tests** `scoring.test.ts`:

```ts
import { nullResolver, scoredValueFor, solutionCorrect, comparatorFor } from './scoring'
import { makeFakeEvaluator } from './evaluator'

test('nullResolver returns null for every score id (deferred Scorer host)', () => {
  expect(nullResolver.score('phq9_total')).toBeNull()
})
test('scoredValueFor applies reversed_value only when the prompt is reversed and the option is bounded', () => {
  const ev = makeFakeEvaluator()
  const opt = { input_data_type: 'choice', measurement_type: 'ordinal', options: [{ index: 1, value: 0 }, { index: 2, value: 6 }] }
  expect(scoredValueFor(opt, { reversed: true }, 1, ev)).toBe(5)       // max(6)+min(0)-1
  expect(scoredValueFor(opt, { reversed: false }, 1, ev)).toBe(1)      // not reversed → unchanged
  expect(scoredValueFor(opt, { reversed: true }, 'x', ev)).toBe('x')   // non-numeric → unchanged
})
test('comparatorFor derives from the option triple', () => {
  expect(comparatorFor({ input_data_type: 'choice', selection: 'single' } as never)).toBe('equals')
  expect(comparatorFor({ input_data_type: 'choice', selection: 'multiple' } as never)).toBe('set_equals')
  expect(comparatorFor({ input_data_type: 'text' } as never)).toBe('matches_regex')
})
test('solutionCorrect compares via the derived comparator', () => {
  const ev = makeFakeEvaluator()
  const item = { option: { input_data_type: 'choice', selection: 'single' }, solution: { expected_response: 3 } }
  expect(solutionCorrect(item as never, 3, ev)).toBe(true)
  expect(solutionCorrect(item as never, 2, ev)).toBe(false)
  expect(solutionCorrect({ option: {} } as never, 1, ev)).toBeNull()  // no solution → null (no correct field)
})
```

- [ ] **Step 2: Run → fail. Implement** `scoring.ts`:

```ts
import type { AnswerValue } from '../renderer/types'
import type { LogicEvaluator, ScoreResolver } from './types'

/** F1: external Scorer execution deferred — every score is unavailable (null → sentinel-false branching). */
export const nullResolver: ScoreResolver = { score: () => null }

export function scoredValueFor(option: Record<string, unknown>, prompt: { reversed?: boolean } | undefined, value: AnswerValue, ev: LogicEvaluator): AnswerValue {
  if (!prompt?.reversed || typeof value !== 'number') return value
  const opts = (option.options as { value: number | string }[] | undefined) ?? []
  const nums = opts.map((o) => o.value).filter((v): v is number => typeof v === 'number')
  if (nums.length === 0) return value
  const min = Math.min(...nums)
  const max = Math.max(...nums)
  return ev.reversedValue(value, min, max)
}

export function comparatorFor(option: { input_data_type?: string; selection?: string }): 'equals' | 'set_equals' | 'matches_regex' {
  if (option.input_data_type === 'text') return 'matches_regex'
  if (option.input_data_type === 'choice' && option.selection === 'multiple') return 'set_equals'
  return 'equals'
}

export function solutionCorrect(item: { option?: Record<string, unknown>; solution?: { expected_response?: unknown } }, value: AnswerValue, ev: LogicEvaluator): boolean | null {
  if (!item.solution || item.solution.expected_response === undefined) return null
  const cmp = comparatorFor((item.option ?? {}) as never)
  return ev.compareSolution(cmp, value, item.solution.expected_response)
}
```

- [ ] **Step 3:** PASS + typecheck. **Commit:** `git commit -am "feat(web-viewer): scoring helpers (reversed_value, Solution correct, null score resolver)"`

---

### Task 8: responses.ts — scored_value + correct

**Files:** modify `web-viewer/src/app/responses.ts`, `web-viewer/src/app/responses.test.ts`.

- [ ] **Step 1: Failing tests** (append to `responses.test.ts`):

```ts
import { makeFakeEvaluator } from '../logic/evaluator'
test('buildItemRow includes scored_value (reversed) and correct (solution) when provided', () => {
  const ev = makeFakeEvaluator()
  const idx = buildRuntimeIndex(runtime)
  const revItem = { ...item, question: { ...item.question, prompt: { ...item.question.prompt, reversed: true } },
    option: { ...opt, options: [{ index: 1, value: 0 }, { index: 2, value: 6 }] }, solution: { expected_response: 0 } }
  const row = buildItemRow({ identity, index: idx.get('it_1')!, responseId: 1, timing,
    scoring: { evaluator: ev } }, revItem as never, 0, 'en')
  assertValid(row)
  expect(row.score).toBe(6)              // Schema 5 `score` = per-item post-reversal value; reversed 0 in 0..6 → 6
  expect(row.correct).toBe(true)         // raw value 0 vs expected 0 → equals true (correct uses raw value, 05b 4.3)
})
```

**Schema 5 home for the scored value:** Schema 5 has **no** `scored_value` field — it has a `score` field (number) documented as *"Per-item scored_value (post-reversal applied per OD-16 16a)."* So the post-reversal value goes in **`score`**, schema-legal, no `x_` needed. `correct` compares the RAW value against `expected_response` (05b 4.3), so value 0 vs expected 0 → `true`. Implement: `score` ← `scoredValueFor(...)` when reversed/bounded (omit if equal to raw? — set it whenever the prompt is reversed; for non-reversed items leave `score` unset, since OD-16 reserves it for the post-reversal value); `correct` ← `solutionCorrect(item, rawValue, ev)`.

- [ ] **Step 2: Implement** — extend `RowContext` with an optional `scoring?: { evaluator: LogicEvaluator }`; in `buildItemRow`, after the existing field mapping, when `ctx.scoring` is present:

```ts
// add import: import { scoredValueFor, solutionCorrect } from '../logic/scoring'
// add import type { LogicEvaluator } from '../logic/types'
// in RowContext: scoring?: { evaluator: LogicEvaluator }
// at the end of buildItemRow, before `return row`:
if (ctx.scoring) {
  // Schema 5 `score` field carries the per-item POST-REVERSAL value (OD-16 16a). Only emit it for reversed prompts
  // (a non-reversed item's scored value equals its raw value, already in response_numeric/_option_index).
  if ((el.question.prompt as { reversed?: boolean } | undefined)?.reversed && typeof answer === 'number') {
    const sv = scoredValueFor(el.option as never, el.question.prompt as never, answer, ctx.scoring.evaluator)
    if (typeof sv === 'number') row.score = sv
  }
  const correct = solutionCorrect(el as never, answer, ctx.scoring.evaluator)
  if (correct !== null) row.correct = correct
}
```

**Confirmed:** Schema 5's `score` field IS the home for the per-item post-reversal value (its description says so). Use `row.score` (a number). No `x_` field, no follow-up needed. `correct` is also a first-class Schema 5 boolean.

- [ ] **Step 3:** the Ajv validation in the test will tell you immediately whether `scored_value` is legal. Make it green (using `x_scored_value` if needed). Full suite + typecheck. **Commit:** `git commit -am "feat(web-viewer): response rows carry post-reversal score + Solution correct (WV-D scoring)"`

---

### Task 9: App integration

**Files:** modify `web-viewer/src/app/session.ts` (+ `session.test.ts`), `web-viewer/src/app/App.tsx` (+ `App.test.tsx`).

- [ ] **Step 1: Reducer — visited stack + goto + validationErrors.** Failing `session.test.ts` additions:

```ts
test('goto pushes the current index to visited and sets the target; back pops it', () => {
  let s = reducer(booted, { type: 'goto', index: 3 })
  expect(s.stepIndex).toBe(3)
  expect(s.visited).toEqual([0])
  s = reducer(s, { type: 'goto', index: 5 })
  expect(s.visited).toEqual([0, 3])
  s = reducer(s, { type: 'back' })
  expect(s.stepIndex).toBe(3)
  expect(s.visited).toEqual([0])
})
test('goto with index null → finishing', () => {
  expect(reducer(booted, { type: 'goto', index: null }).phase).toBe('finishing')
})
test('validation_errors sets the channel; answer clears the answered key', () => {
  let s = reducer(booted, { type: 'validation_errors', errors: [{ key: 'it_1', message: 'bad' }] })
  expect(s.validationErrors).toEqual([{ key: 'it_1', message: 'bad' }])
  s = reducer(s, { type: 'answer', key: 'it_1', value: 0 })
  expect(s.validationErrors).toEqual([])
})
```

Implement in `session.ts`: add `visited: number[]` (init `[]`) and `validationErrors: { key: string; message: string }[]` (init `[]`) to `SessionState`/`initialState`; add actions `{ type: 'goto'; index: number | null }`, `{ type: 'validation_errors'; errors: {key:string;message:string}[] }`. Cases: `goto` → if `index===null` `{...state, phase:'finishing', stepErrors:[], validationErrors:[]}` else `{...state, visited:[...state.visited, state.stepIndex], stepIndex:index, stepErrors:[], validationErrors:[]}`; `back` → `const prev = state.visited[state.visited.length-1] ?? 0; return {...state, stepIndex: prev, visited: state.visited.slice(0,-1), stepErrors:[], validationErrors:[]}`; `validation_errors` → `{...state, validationErrors: action.errors}`; in `answer` also clear that key from `validationErrors`. **Keep the old `next` action** (still used by the temporary/finishing flow? No — App now uses `goto`). Remove the `next` case's `stepIndex+1` body OR leave it; App will stop dispatching `next`. Simplest: keep `next` working (gating → finishing/next) as a fallback but App.tsx switches to `goto`. Mark `next` deprecated-in-comment.

- [ ] **Step 2: App.tsx — wire the engine.** Read the current App fully. Changes:
  - **Boot**: after `boot_success`, load the evaluator and build programs. Store `evaluator` + `programs` + `resolver` on the pipeline ref (or a new `logic` ref). Use `loadEvaluator()` in production; in tests, `vi.mock('../logic/evaluator')` supplies a fake (see Step 3). Because boot is async already, await the evaluator there.
  - **Bindings**: a helper `bindings()` = `makeBindings(state.answers, runtime, resolver)` rebuilt per evaluation (cheap).
  - **Render**: replace `step.elements` passed to `StepRenderer` with `visibleEntries(step, programs, ev, bindings())` (only visible elements render). Apply `pipedText` to each rendered prompt via a field key `pages.<pageId>.elements.<i>.prompt` — pass piped text into the renderer (extend `StepRenderer`/`ItemRenderer` to accept an optional `promptOverride`, OR resolve piping in a small wrapper that rewrites the element's prompt content before render). SIMPLEST: compute a `pipeFor(key)` and have the App pass already-piped elements; if that's invasive, defer piping wiring into render but keep the `piping.ts` unit-tested and apply it to prompts only (document). Implement the minimal prompt-piping: before rendering, map each visible item's prompt text through `pipedText`.
  - **Advance**: in `advance()`, after required-gating passes, run `validateStep(step, programs, ev, answers, resolver.score, locale)`; if errors → `dispatch({type:'validation_errors', errors})`, focus first offender, do NOT emit/advance. Else emit rows/events (WV-B, now with `scoring:{evaluator:ev}` in the row context so `scored_value`/`correct` populate), then compute `const target = nextStepIndex(steps, programs, ev, bindings(), state.stepIndex)` and `dispatch({type:'goto', index: target})`.
  - **Back**: dispatch `{type:'back'}` (unchanged action name; reducer now pops visited).
  - **Validation messages**: pass `state.validationErrors` into the renderer so each offending item shows its message (extend the renderer's `requiredErrors`/strings path to also surface per-key messages — reuse the WV-A error slot, preferring the validation message when present).
  - **Manifest version**: bump `VIEWER_VERSION` in `bootstrap.ts` to match Task 10's manifest (`v26.0612`).
- [ ] **Step 3: App integration tests** (`App.test.tsx`, `vi.mock` the evaluator with a controllable fake):

```tsx
vi.mock('../logic/evaluator', async (orig) => {
  const actual = await orig<typeof import('../logic/evaluator')>()
  return { ...actual, loadEvaluator: async () => actual.makeFakeEvaluator((globalThis as any).__evalTable ?? {}) }
})
```

Then tests set `(globalThis as any).__evalTable` per case. Add:
- **branch routing**: a runtime with `logic:[{type:'branch', condition:'route_b', action:{skip_to:'p3'}}]`; with `__evalTable={route_b:true}` answering the first step routes to p3 (assert p3's heading appears, p2 skipped); with `route_b:false` it goes to p2.
- **show_if visibility**: an item with `show_if:'show_x'`; `{show_x:false}` → the item's step is skipped; flipping an earlier answer that sets `show_x:true` reveals it (drive via the table).
- **validation block**: a cross-rule `{condition:'bad', ...}` with `{bad:true}` blocks advance and shows the message; `{bad:false}` advances.
- **score in the posted row**: a reversed item → the posted response row carries the post-reversal `score`.

(Reuse the WV-B `postCalls`/`respond202` helpers already in App.test.tsx.)

- [ ] **Step 4:** full suite + typecheck + `npm run build` (build runs `prebuild`→build-evaluator; ensure the wasm builds — needs `. "$HOME/.cargo/env"` available to the script's shell; the script sources it). If the build can't reach cargo in CI, the build step may need the env — report. Tests do NOT build wasm (mocked). Expect all green.
- [ ] **Step 5: Commit.** `git commit -am "feat(web-viewer): wire logic engine into App — visibility, branching nav, validation, piping, scoring"`

---

### Task 10: Manifest + design note

**Files:** modify `web-viewer/manifest.json`, `web-viewer/src/app/bootstrap.ts` (VIEWER_VERSION — done in Task 9; verify), `web-viewer/scripts/validate-manifest.mjs` (unchanged logic; just re-runs), `design/08_viewer.md`.

- [ ] **Step 1:** Update `manifest.json`: bump `"viewer_version": "v26.0612"`; set `"evaluator": { "language_version": "v26.0612", "functions": ["length","is_empty","not_empty","count","contains","score"] }`; add `"logic_actions": ["skip", "visibility", "piping", "branch"]`. Keep `scorer_impl_kinds: ["wasm"]`, `widgets` unchanged. Confirm `bootstrap.ts` `VIEWER_VERSION === 'v26.0612'` (the validate-manifest identity check enforces it).
- [ ] **Step 2:** Run `node scripts/validate-manifest.mjs` → valid Schema 7 ✓ (Schema 7 allows `logic_actions` + `evaluator`). Negative-check: temporarily set a bad `logic_actions` value (`"foo"`) → exits 1; restore.
- [ ] **Step 3:** `design/08_viewer.md` — in §"Web Viewer" "Required features" or near the presentation-modes note, add one line: the Web Viewer evaluates the four logic actions (skip/visibility/piping/branch), `show_if`, and per/cross-question validation via the OD-11 evaluator (design/15); `reversed_value` + Solution `correct` computed in-session; external Scorer execution + score display deferred (Scorer track). Keep it design-level.
- [ ] **Step 4:** `npm test` (vitest + manifest validation) green. **Commit:** `git add web-viewer/manifest.json web-viewer/src/app/bootstrap.ts design/08_viewer.md && git commit -m "feat(web-viewer): manifest declares logic_actions + evaluator (VS stops stripping logic); design/08 note"`

---

### Task 11: README/FOLLOWUPS + verification + live gate smoke + merge

**Files:** modify `web-viewer/README.md`, `web-viewer/FOLLOWUPS.md`.

- [ ] **Step 1: README** — add a "## Logic (WV-D)" section: the four logic actions + `show_if` + validation + scoring helpers, all via the embedded `questionnaire-expression-evaluator` (built `--target web` by `npm run build:evaluator`, auto-run on `dev`/`build`); the graph-walk navigation (skip/branch jump forward, hidden steps skipped, Back retraces visited path); `score(id)` resolves to null until the Scorer host lands (score-gated branches don't fire — by design); the dev requirement that cargo/wasm-pack be on PATH (`. "$HOME/.cargo/env"`) for the evaluator build. Update the manifest line (now declares logic).
- [ ] **Step 2: FOLLOWUPS** — add: external Scorer execution + in-session score display (OD-16 Scorer track) — `score(id)` is null until then; `randomize` (Page/Section) needs a seeded-RNG determinism decision — deferred; piping v1 covers prompt-text only via `field_path` prefix match — richer field targeting later; the evaluator is rebuilt on every `npm run build` (cache if it slows CI).
- [ ] **Step 3: Full verification** (paste tails):

```bash
( cd web-viewer && npm test && npm run typecheck )
. "$HOME/.cargo/env" && ( cd web-viewer && npm run build )      # exercises the evaluator --target web build + bundle
```

(`npm test` must NOT require the wasm — confirm it's green without a prior evaluator build, then `npm run build` proves the real wasm bundles.)

- [ ] **Step 4: Live gate smoke** (extends WV-B's; proves logic flows end-to-end and the real WASM evaluates in-browser). Stand up the stack (Postgres :55435, library migrate/import/ingest, VS :8001 with `VS_CORS_ORIGINS`, register the **v26.0612** manifest, deploy a questionnaire **with a branch rule**). Use the kitchensink questionnaire if importable, else hand-craft a 2-page runtime with a branch (document which). `npm run dev` (builds the evaluator), drive a real chromium twice taking both branch paths, and assert `export.csv` shows the divergent page paths + the post-reversal `score` column + the session `submitted`. If no branch-bearing questionnaire is importable from survey_db, note that and fall back to a fixture-mode visual confirmation of branching (`?fixture=` with a branch fixture you add) + the App integration tests as the branching evidence. Record the outcome honestly; clean up (kill servers, `docker rm -f`, temp dirs).
- [ ] **Step 5: Commit.** `git add web-viewer/README.md web-viewer/FOLLOWUPS.md && git commit -m "docs(web-viewer): WV-D logic docs; gate smoke recorded"`
- [ ] **Step 6: Merge.** Use superpowers:finishing-a-development-branch — re-run Step 3 verification, merge `wv-d-web-viewer` to `master` `--no-ff` (`Merge wv-d-web-viewer: Web Viewer WV-D (logic, validation, in-session scoring)`), push, delete branch.

---

## Self-review notes (done at planning time)

- **Spec coverage:** §3 evaluator port → T1; §4 collectPrograms/visibility/piping → T2/T3/T5; §5 dynamic navigation → T4 (pure) + T9 (reducer visited-stack + App wiring); §6 validation → T6 + T9; §7 scoring (reversed→Schema5 `score`/correct/null-resolver) → T7 + T8 (rows) + T9; §8 manifest → T10; §9 testing → engine units T2–T7, evaluator-adapter T1, App integration T9, manifest T10, live smoke T11. F1 (null resolver) → T7; F2 (port + injected fake) → T1/T9; F3 (no score display) → not built (correct); F4 (progress under branching) → T9 render note (counter, no false total — implement in App: when `programs.rules` has any skip/branch, show step counter without a percentage); F5 (piping) → T5 + T9.
- **Type consistency:** `LogicEvaluator`/`Bindings`/`ScoreResolver`/`Programs`/`CompiledRule`/`ValidationError` defined in T1–T2/T6 and reused verbatim through T9; `visibleEntries` returns the same `StepEntry[]` shape `StepRenderer` consumes; `nextStepIndex` returns `number | null` matching the reducer `goto` action's `index: number | null`; `scoring:{evaluator}` added to `RowContext` (T8) is what App passes (T9).
- **Known judgment calls / risks flagged for the implementer:** (a) the post-reversal value goes in Schema 5's `score` field (not `scored_value`, which doesn't exist) — confirmed in the schema. (b) the `loadEvaluator` dynamic import of `./wasm/...` must not break `tsc`/vitest — T1 Step 7 gives the ambient-declaration fix; tests never import it (App mocks `loadEvaluator`). (c) piping render-wiring is the fiddliest integration (mapping a rendered prompt to a `field_path`); T9 keeps it to prompt-text-only and documents the limitation; the `piping.ts` logic is independently unit-tested. (d) F4 progress: App shows a plain step counter when branch/skip rules exist (no misleading total).
