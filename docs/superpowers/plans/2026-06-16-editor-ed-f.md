# Editor ED-F (Standalone Shareable Preview) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a no-backend standalone preview: extract a reusable `PreviewView` from `PreviewPane`, add a `preview.html` Vite entry + `StandalonePreview` that renders an exported bundle (sessionStorage handoff or file-open) reusing the renderer + bundled evaluator + the editor's projection, and a topbar "Open preview" action.

**Architecture:** `PreviewView({runtime, problems, logic, validation, …})` holds the render core (locale/device/scope/answers + evaluator + pipe/filter/validate → StepRenderer). `PreviewPane` becomes a thin store wrapper (unchanged behaviour, regression-guarded by the D1/D2/D3 preview tests). `StandalonePreview` loads a `{questionnaire, entities}` bundle, runs the same `resolveEntities`/`projectForPreview` pipeline (pool = the bundle's entities, no network), and renders `PreviewView`. A second Vite entry serves it at `/preview.html`; the editor's "Open preview" hands the current bundle off via sessionStorage.

**Tech Stack:** Vite 6 (multi-entry) · React 19 · TypeScript 5.7 · Tailwind · vitest + RTL · Playwright.

---

## File Structure

**Create:**
- `editor/src/preview/PreviewView.tsx` — reusable runtime renderer (extracted core).
- `editor/src/preview/StandalonePreview.tsx` — bundle-driven standalone preview.
- `editor/preview.html` + `editor/src/preview-main.tsx` — the standalone Vite entry.
- Test files alongside.

**Modify:**
- `editor/src/preview/PreviewPane.tsx` — thin wrapper around `PreviewView`.
- `editor/src/persistence/file.ts` — add `parseBundle`.
- `editor/vite.config.ts` — multi-entry (`build.rollupOptions.input`).
- `editor/src/app/Topbar.tsx` — "Open preview" action.
- `editor/FOLLOWUPS.md` — ED-F follow-ups.

---

## Task 1: Extract `PreviewView` from `PreviewPane`

**Files:**
- Create: `editor/src/preview/PreviewView.tsx`, `editor/src/preview/PreviewView.test.tsx`
- Modify: `editor/src/preview/PreviewPane.tsx`

- [ ] **Step 1: Write the failing test**

Create `editor/src/preview/PreviewView.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

vi.mock('../logic/useEvaluator', async () => {
  const real = await import('../logic/evaluator')
  return { useEvaluator: () => real.makeFakeEvaluator({ "q == 'yes'": (b) => b.var('q') === 'yes' }) }
})

import { PreviewView } from './PreviewView'
import type { Runtime } from '@behaverse/questionnaire-renderer'

const runtime = {
  provenance: { preview: true },
  metadata: { id: 'qst_x', title: 'X', language: 'en' },
  locale: 'en',
  available_locales: ['en'],
  pages: [{ id: 'p1', elements: [
    { id: 'q', question: { prompt: { content: { en: { status: 'complete', text: 'Show extra?' } } } },
      option: { input_data_type: 'choice', measurement_type: 'nominal', selection: 'single',
        options: [{ index: 0, value: 'yes' }], content: { en: { options: [{ index: 0, text: 'Yes' }] } } } },
    { id: 'extra', show_if: "q == 'yes'",
      question: { prompt: { content: { en: { status: 'complete', text: 'Extra question' } } } },
      option: { input_data_type: 'text', measurement_type: 'text', content: { en: {} } } },
  ] }],
} as unknown as Runtime

describe('PreviewView', () => {
  it('renders the runtime and shows the problems banner', () => {
    render(<PreviewView runtime={runtime} problems={[{ kind: 'unresolved_ref', where: 'x' }]} logic={[]} validation={[]} />)
    expect(screen.getByText('Show extra?')).toBeInTheDocument()
    expect(screen.getByText(/referenced entit/i)).toBeInTheDocument()
  })
  it('evaluates show_if live against throwaway answers', async () => {
    render(<PreviewView runtime={runtime} problems={[]} logic={[]} validation={[]} />)
    expect(screen.queryByText('Extra question')).not.toBeInTheDocument()
    fireEvent.click(screen.getByText('Yes'))
    expect(await screen.findByText('Extra question')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run it to verify it fails**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps/editor && npx vitest run src/preview/PreviewView.test.tsx`
Expected: FAIL — `Cannot find module './PreviewView'`.

- [ ] **Step 3: Create `PreviewView`**

Create `editor/src/preview/PreviewView.tsx`:

```tsx
import { useState } from 'react'
import { StepRenderer, type RendererStrings, type AnswerValue } from '@behaverse/questionnaire-renderer'
import '@behaverse/questionnaire-renderer/style.css'
import type { Runtime } from '@behaverse/questionnaire-renderer'
import { flattenPage } from './flatten'
import { FRAMES, FRAME_LABELS, type FrameKey } from './frames'
import type { RefProblem } from './resolve'
import { useEvaluator } from '../logic/useEvaluator'
import { makeBindings, filterPageVisible } from '../logic/visibility'
import { applyPiping } from '../logic/piping'
import { collectPerQuestionErrors, collectCrossQuestionErrors } from '../logic/validation'
import type { LogicRule, CrossQuestionValidationRule } from '../model/types'

const STRINGS: RendererStrings = { required: 'Required', unsupported: 'Unsupported element' }

export function PreviewView({ runtime, problems, logic, validation, initialLocale, initialScope = 'all', selectedPageId }: {
  runtime: Runtime
  problems: RefProblem[]
  logic: LogicRule[]
  validation: CrossQuestionValidationRule[]
  initialLocale?: string
  initialScope?: 'page' | 'all'
  selectedPageId?: string
}) {
  const [locale, setLocale] = useState<string>(initialLocale ?? String(runtime.metadata.language ?? 'en'))
  const [device, setDevice] = useState<FrameKey>('desktop')
  const [scope, setScope] = useState<'page' | 'all'>(initialScope)
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({})
  const evaluator = useEvaluator()

  const locales = runtime.available_locales ?? [runtime.metadata.language]
  const pageId = selectedPageId ?? runtime.pages[0]?.id
  const pages = scope === 'all' ? runtime.pages : runtime.pages.filter((p) => p.id === pageId)
  const bindings = makeBindings(answers as Record<string, unknown>, { score: () => null })
  const pipedPages = evaluator ? pages.map((p) => applyPiping(p, logic, evaluator, bindings, locale)) : pages
  const visiblePages = evaluator ? pipedPages.map((p) => filterPageVisible(p, evaluator, bindings, logic)) : pipedPages
  const verrors = collectPerQuestionErrors(visiblePages, answers)
  const cqErrors = evaluator ? collectCrossQuestionErrors(validation, evaluator, bindings) : []
  const allErrors = [...verrors, ...cqErrors]
  const errorMessages = Object.fromEntries(allErrors.map((e) => [e.key, e.message]))
  const requiredErrorKeys = allErrors.map((e) => e.key)
  const width = FRAMES[device]
  const onAnswer = (key: string, value: AnswerValue) => setAnswers((a) => ({ ...a, [key]: value }))

  return (
    <section aria-label="Preview" className="flex h-full flex-col overflow-hidden">
      <div className="flex items-center gap-3 border-b border-slate-200 bg-white px-3 py-2 text-sm">
        <label className="flex items-center gap-1">Language
          <select aria-label="Preview language" value={locale} onChange={(e) => setLocale(e.target.value)}
                  className="rounded border border-slate-300 px-1 py-0.5">
            {locales.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
        </label>
        <label className="flex items-center gap-1">Device
          <select aria-label="Preview device" value={device} onChange={(e) => setDevice(e.target.value as FrameKey)}
                  className="rounded border border-slate-300 px-1 py-0.5">
            {(Object.keys(FRAMES) as FrameKey[]).map((k) => <option key={k} value={k}>{FRAME_LABELS[k]}</option>)}
          </select>
        </label>
        <label className="flex items-center gap-1">Scope
          <select aria-label="Preview scope" value={scope} onChange={(e) => setScope(e.target.value as 'page' | 'all')}
                  className="rounded border border-slate-300 px-1 py-0.5">
            <option value="page">Selected page</option>
            <option value="all">Whole questionnaire</option>
          </select>
        </label>
      </div>
      {problems.length > 0 && (
        <div className="border-b border-amber-200 bg-amber-50 px-3 py-1 text-xs text-amber-700">
          {problems.length} referenced {problems.length === 1 ? 'entity' : 'entities'} not loaded (showing placeholders).
        </div>
      )}
      <div className="flex-1 overflow-auto bg-slate-100 p-6">
        <div className="qv-theme mx-auto bg-white shadow-sm" style={{ width: width ?? '100%', maxWidth: '100%' }}>
          <div className="p-6">
            {visiblePages.map((page) => (
              <div key={page.id} className="mb-8">
                {scope === 'all' && page.title && <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">{page.title}</h2>}
                <StepRenderer elements={flattenPage(page)} locale={locale} answers={answers} onAnswer={onAnswer}
                              requiredErrors={requiredErrorKeys} errorMessages={errorMessages} strings={STRINGS} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 4: Slim `PreviewPane` to a wrapper**

Rewrite `editor/src/preview/PreviewPane.tsx` to keep the store/resolve/project logic and delegate rendering to `PreviewView`. It KEEPS: the `useEditorStore` reads (`model`, `pool`, `selection`), the `entityMap`/`resolving` state + the resolve effect, the `projectForPreview` memo, the selection→`selectedPageId` derivation, and the `fetchEntity` default. It renders `<PreviewView runtime={runtime} problems={problems} logic={(model.logic ?? []) as LogicRule[]} validation={(model.validation ?? []) as CrossQuestionValidationRule[]} initialLocale={String(model.metadata.language ?? 'en')} initialScope="page" selectedPageId={selectedPageId} />` plus its own `resolving…` indicator. Remove the now-duplicated render body (toolbar/StepRenderer) + the imports only used by it (`StepRenderer`, `flattenPage`, `FRAMES`, `makeBindings`, `applyPiping`, `collectPerQuestionErrors`, `useEvaluator`) — keep `resolveEntities`/`makePoolFetcher`/`projectForPreview`/`EntityBody`/`AnswerValue` as needed. Add `import { PreviewView } from './PreviewView'` + the `LogicRule`/`CrossQuestionValidationRule` type imports.

Concretely, `PreviewPane` returns:

```tsx
  if (!model || !runtime) return <div className="p-6 text-slate-400">Nothing to preview.</div>
  const selectedPageId = (() => {
    if (selection && selection[0] === 'pages' && typeof selection[1] === 'number') return runtime.pages[selection[1] as number]?.id
    return runtime.pages[0]?.id
  })()
  return (
    <div className="flex h-full flex-col border-l border-slate-200">
      {resolving && <div className="bg-white px-3 py-1 text-xs text-slate-400">resolving…</div>}
      <PreviewView runtime={runtime} problems={problems}
        logic={(model.logic ?? []) as LogicRule[]} validation={(model.validation ?? []) as CrossQuestionValidationRule[]}
        initialLocale={String(model.metadata.language ?? 'en')} initialScope="page" selectedPageId={selectedPageId} />
    </div>
  )
```

(Keep the `model`/`pool`/`selection`/`entityMap`/`resolving`/effect/memo code above unchanged.)

- [ ] **Step 5: Run the new test + the existing preview suites**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps/editor && npx vitest run src/preview/`
Expected: PASS — `PreviewView` tests + the existing `PreviewVisibility`/`PreviewPiping`/`PreviewValidation`/`PreviewPane` suites all green (behaviour preserved). If a preview test asserted the old outer `<section aria-label="Preview">` border classes, that's cosmetic — only fix if a test actually fails; do not weaken assertions.

- [ ] **Step 6: Full suite + typecheck**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps/editor && npm run typecheck && npx vitest run`
Expected: typecheck clean; all tests pass.

- [ ] **Step 7: Commit**

```bash
cd /home/pedro/Repos/Cursor/questionnaire_apps
git add editor/src/preview/PreviewView.tsx editor/src/preview/PreviewView.test.tsx editor/src/preview/PreviewPane.tsx
git commit -m "refactor(editor): ED-F extract reusable PreviewView from PreviewPane"
```

---

## Task 2: `parseBundle`

**Files:**
- Modify: `editor/src/persistence/file.ts`
- Test: `editor/src/persistence/file.test.ts` (append; create if absent)

- [ ] **Step 1: Write the failing test**

Append to `editor/src/persistence/file.test.ts` (if absent, create with `import { describe, it, expect } from 'vitest'`):

```ts
import { parseBundle, bundleData } from './file'
import type { Questionnaire } from '../model/types'

describe('parseBundle', () => {
  const q = { metadata: { id: 'qst_x', language: 'en' }, pages: [] } as unknown as Questionnaire
  it('parses a valid bundle', () => {
    const text = JSON.stringify(bundleData(q, { 'pr_x@v1': { id: 'pr_x' } }))
    expect(parseBundle(text)).toEqual({ questionnaire: q, entities: { 'pr_x@v1': { id: 'pr_x' } } })
  })
  it('throws on a non-bundle (missing questionnaire/entities)', () => {
    expect(() => parseBundle(JSON.stringify({ foo: 1 }))).toThrow(/not a valid questionnaire bundle/i)
    expect(() => parseBundle('{ bad json')).toThrow()
  })
})
```

- [ ] **Step 2: Run it to verify it fails**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps/editor && npx vitest run src/persistence/file.test.ts`
Expected: FAIL — `parseBundle` not exported.

- [ ] **Step 3: Implement**

In `editor/src/persistence/file.ts`, add:

```ts
export function parseBundle(text: string): { questionnaire: Questionnaire; entities: Record<string, EntityBody> } {
  const obj = JSON.parse(text) as { questionnaire?: unknown; entities?: unknown }
  const q = obj?.questionnaire as Questionnaire | undefined
  const entities = obj?.entities as Record<string, EntityBody> | undefined
  if (!q?.metadata || !entities || typeof entities !== 'object') throw new Error('Not a valid questionnaire bundle')
  return { questionnaire: q, entities }
}
```

(`Questionnaire` + `EntityBody` are already imported in this file.)

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps/editor && npx vitest run src/persistence/file.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
cd /home/pedro/Repos/Cursor/questionnaire_apps
git add editor/src/persistence/file.ts editor/src/persistence/file.test.ts
git commit -m "feat(editor): ED-F parseBundle (load a {questionnaire,entities} bundle)"
```

---

## Task 3: `StandalonePreview`

**Files:**
- Create: `editor/src/preview/StandalonePreview.tsx`, `editor/src/preview/StandalonePreview.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `editor/src/preview/StandalonePreview.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

vi.mock('../logic/useEvaluator', async () => {
  const real = await import('../logic/evaluator')
  return { useEvaluator: () => real.makeFakeEvaluator({}) }
})

import { StandalonePreview } from './StandalonePreview'

const bundle = {
  questionnaire: {
    metadata: { id: 'qst_x', title: 'Demo', language: 'en' },
    pages: [{ id: 'p1', elements: [
      { id: 'q', question: { prompt: { content: { en: { status: 'complete', text: 'Hello there' } } } },
        option: { input_data_type: 'text', measurement_type: 'text', content: { en: {} } } },
    ] }],
  },
  entities: {},
}

describe('StandalonePreview', () => {
  beforeEach(() => sessionStorage.clear())

  it('renders a bundle handed off via sessionStorage', async () => {
    sessionStorage.setItem('qv-preview-bundle', JSON.stringify(bundle))
    render(<StandalonePreview />)
    expect(await screen.findByText('Hello there')).toBeInTheDocument()
    expect(screen.getByText(/not a deployment/i)).toBeInTheDocument()
  })
  it('shows a file-open prompt when no bundle is present', () => {
    render(<StandalonePreview />)
    expect(screen.getByLabelText(/load a bundle/i)).toBeInTheDocument()
  })
  it('renders a bundle chosen via the file input', async () => {
    render(<StandalonePreview />)
    const file = new File([JSON.stringify(bundle)], 'demo.bundle.json', { type: 'application/json' })
    fireEvent.change(screen.getByLabelText(/load a bundle/i), { target: { files: [file] } })
    expect(await screen.findByText('Hello there')).toBeInTheDocument()
  })
  it('shows an inline error for a malformed bundle file', async () => {
    render(<StandalonePreview />)
    const file = new File(['{ not a bundle'], 'bad.json', { type: 'application/json' })
    fireEvent.change(screen.getByLabelText(/load a bundle/i), { target: { files: [file] } })
    expect(await screen.findByText(/not a valid questionnaire bundle/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run it to verify it fails**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps/editor && npx vitest run src/preview/StandalonePreview.test.tsx`
Expected: FAIL — `Cannot find module './StandalonePreview'`.

- [ ] **Step 3: Implement**

Create `editor/src/preview/StandalonePreview.tsx`:

```tsx
import { useEffect, useMemo, useState } from 'react'
import type { AnswerValue } from '@behaverse/questionnaire-renderer'  // (kept for type parity; remove if unused)
import { parseBundle } from '../persistence/file'
import { resolveEntities } from './resolver'
import { makePoolFetcher } from '../pool/poolFetcher'
import { projectForPreview } from './project'
import { PreviewView } from './PreviewView'
import type { Questionnaire, EntityBody, LogicRule, CrossQuestionValidationRule } from '../model/types'

type Bundle = { questionnaire: Questionnaire; entities: Record<string, EntityBody> }
const KEY = 'qv-preview-bundle'

export function StandalonePreview() {
  const [bundle, setBundle] = useState<Bundle | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [entityMap, setEntityMap] = useState<Map<string, EntityBody | null> | null>(null)

  useEffect(() => {
    const raw = sessionStorage.getItem(KEY)
    if (!raw) return
    try { setBundle(parseBundle(raw)) } catch (e) { setError(e instanceof Error ? e.message : 'Bad bundle') }
  }, [])

  useEffect(() => {
    if (!bundle) { setEntityMap(null); return }
    let ignore = false
    // Pool = the bundle's entities; no Library network in the standalone (lib resolves to null).
    const fetcher = makePoolFetcher(() => bundle.entities, async () => null)
    resolveEntities(bundle.questionnaire, fetcher).then((m) => { if (!ignore) setEntityMap(new Map(m)) })
    return () => { ignore = true }
  }, [bundle])

  const projected = useMemo(() => {
    if (!bundle || !entityMap) return null
    return projectForPreview(bundle.questionnaire, (ref) => entityMap.get(ref) ?? null)
  }, [bundle, entityMap])

  const onFile = async (file: File) => {
    setError(null)
    try { setBundle(parseBundle(await file.text())) } catch (e) { setError(e instanceof Error ? e.message : 'Bad bundle'); setBundle(null) }
  }

  if (!bundle) {
    return (
      <div className="mx-auto max-w-md space-y-3 p-8 text-sm text-slate-600">
        <h1 className="text-base font-semibold text-slate-800">Questionnaire preview</h1>
        <p className="text-slate-500">Open a <code>.bundle.json</code> exported from the editor.</p>
        <label className="block">Load a bundle
          <input type="file" accept="application/json,.json" aria-label="Load a bundle"
                 onChange={(e) => { const f = e.target.files?.[0]; if (f) void onFile(f) }}
                 className="mt-1 block w-full text-sm" />
        </label>
        {error && <p className="text-red-600">{error}</p>}
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col">
      <header className="flex items-center gap-2 border-b border-slate-200 bg-white px-4 py-2 text-sm">
        <span className="font-medium text-slate-800">{String(bundle.questionnaire.metadata.title ?? bundle.questionnaire.metadata.id)}</span>
        <span className="text-xs text-slate-400">read-only preview — not a deployment</span>
      </header>
      {!projected ? (
        <div className="p-6 text-slate-400">Resolving…</div>
      ) : (
        <PreviewView runtime={projected.runtime} problems={projected.problems}
          logic={(bundle.questionnaire.logic ?? []) as LogicRule[]}
          validation={(bundle.questionnaire.validation ?? []) as CrossQuestionValidationRule[]} />
      )}
    </div>
  )
}
```

> Remove the `AnswerValue` import if the file doesn't reference it (it's only listed for parity — drop to keep the lint clean). Verify `Questionnaire.logic`/`.validation` are typed on the model (they are, from ED-D2a/D3b).

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps/editor && npx vitest run src/preview/StandalonePreview.test.tsx`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
cd /home/pedro/Repos/Cursor/questionnaire_apps
git add editor/src/preview/StandalonePreview.tsx editor/src/preview/StandalonePreview.test.tsx
git commit -m "feat(editor): ED-F StandalonePreview (render a bundle, no backend)"
```

---

## Task 4: `preview.html` entry + multi-entry Vite build

**Files:**
- Create: `editor/preview.html`, `editor/src/preview-main.tsx`
- Modify: `editor/vite.config.ts`

- [ ] **Step 1: Create the entry HTML + main**

Create `editor/preview.html` (mirror `index.html`):

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Questionnaire Preview</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/preview-main.tsx"></script>
  </body>
</html>
```

Create `editor/src/preview-main.tsx`:

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { StandalonePreview } from './preview/StandalonePreview'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <StandalonePreview />
  </StrictMode>,
)
```

- [ ] **Step 2: Add multi-entry to the Vite config**

In `editor/vite.config.ts`, add `build.rollupOptions.input` (extend the existing `defineConfig({...})`; add `import { resolve } from 'node:path'` is already present):

```ts
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        preview: resolve(__dirname, 'preview.html'),
      },
    },
  },
```

- [ ] **Step 3: Build to verify both entries emit**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps/editor && npm run build`
Expected: `prebuild` (renderer + evaluator) runs; `tsc -b` clean; `vite build` emits BOTH `dist/index.html` AND `dist/preview.html`. Confirm: `ls dist/*.html` shows `index.html` + `preview.html`, and the wasm asset is present in `dist/assets/`.

- [ ] **Step 4: Commit**

```bash
cd /home/pedro/Repos/Cursor/questionnaire_apps
git add editor/preview.html editor/src/preview-main.tsx editor/vite.config.ts
git commit -m "build(editor): ED-F standalone preview entry (preview.html multi-entry)"
```

---

## Task 5: Topbar "Open preview" action

**Files:**
- Modify: `editor/src/app/Topbar.tsx`
- Test: `editor/src/app/Topbar.test.tsx` (create if absent; else append)

- [ ] **Step 1: Write the failing test**

Create/append `editor/src/app/Topbar.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Topbar } from './Topbar'
import { useEditorStore } from '../state/store'
import type { Questionnaire } from '../model/types'

const base = { metadata: { id: 'qst_x', title: 'X', language: 'en' }, pages: [] } as unknown as Questionnaire

describe('Topbar Open preview', () => {
  beforeEach(() => { useEditorStore.getState().loadModel(structuredClone(base), { kind: 'new' } as never); sessionStorage.clear() })

  it('writes the bundle to sessionStorage and opens preview.html', () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null)
    render(<Topbar onValidate={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: /open preview/i }))
    const raw = sessionStorage.getItem('qv-preview-bundle')
    expect(raw).toBeTruthy()
    expect(JSON.parse(raw!).questionnaire.metadata.id).toBe('qst_x')
    expect(openSpy).toHaveBeenCalledWith('/preview.html', '_blank')
    openSpy.mockRestore()
  })
})
```

- [ ] **Step 2: Run it to verify it fails**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps/editor && npx vitest run src/app/Topbar.test.tsx`
Expected: FAIL — no "Open preview" button.

- [ ] **Step 3: Implement**

In `editor/src/app/Topbar.tsx`: extend the `import { exportToFile, exportBundle } from '../persistence/file'` to also import `bundleData`. Add an "Open preview" button in the `ml-auto` group (e.g. before "✓ Validate"):

```tsx
        <button onClick={() => {
          try { sessionStorage.setItem('qv-preview-bundle', JSON.stringify(bundleData(model, pool))) } catch { /* quota: fall through */ }
          window.open('/preview.html', '_blank')
        }} className="rounded border border-slate-300 px-3 py-1 text-sm hover:bg-slate-50">Open preview</button>
```

(`model` + `pool` are already in scope in `Topbar`.)

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps/editor && npx vitest run src/app/Topbar.test.tsx && npm run typecheck`
Expected: PASS; typecheck clean.

- [ ] **Step 5: Full suite**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps/editor && npx vitest run`
Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
cd /home/pedro/Repos/Cursor/questionnaire_apps
git add editor/src/app/Topbar.tsx editor/src/app/Topbar.test.tsx
git commit -m "feat(editor): ED-F topbar Open-preview (sessionStorage handoff to preview.html)"
```

---

## Task 6: Playwright smoke + screenshot

**Files:**
- Create: `editor/tests/e2e/standalone-preview.spec.ts`

Drive `preview.html` directly with a bundle pre-seeded in `sessionStorage` via `page.addInitScript` (avoids cross-tab handling). The bundle is a small self-contained questionnaire with inline prompt content + a `show_if` to prove logic works standalone.

- [ ] **Step 1: Write the smoke spec**

Create `editor/tests/e2e/standalone-preview.spec.ts`:

```ts
import { test, expect } from '@playwright/test'

const bundle = {
  questionnaire: {
    '@context': 'https://behaverse.org/schemas/questionnaire/context.jsonld',
    metadata: { id: 'qst_standalone_demo', title: 'Standalone Demo', language: 'en' },
    pages: [{ id: 'p1', elements: [
      { id: 'it_control', question: { prompt: { content: { en: { status: 'complete', text: 'Do you want to see more?' } } } },
        option: { input_data_type: 'choice', measurement_type: 'nominal', selection: 'single',
          options: [{ index: 1, value: 'yes' }, { index: 2, value: 'no' }],
          content: { en: { options: [{ index: 1, text: 'Yes' }, { index: 2, text: 'No' }] } } } },
      { id: 'it_extra', show_if: "it_control == 'yes'",
        question: { prompt: { content: { en: { status: 'complete', text: 'Bonus question revealed!' } } } },
        option: { input_data_type: 'text', measurement_type: 'text', content: { en: {} } } },
    ] }],
  },
  entities: {},
}

test('standalone preview renders a bundle + show_if works with no backend', async ({ page }) => {
  await page.addInitScript((b) => { sessionStorage.setItem('qv-preview-bundle', JSON.stringify(b)) }, bundle)
  await page.goto('/preview.html')
  await expect(page.getByText(/not a deployment/i)).toBeVisible()
  await expect(page.locator('h2.qv-prompt', { hasText: 'Do you want to see more?' })).toBeVisible()
  await expect(page.locator('h2.qv-prompt', { hasText: 'Bonus question revealed!' })).toHaveCount(0)
  await page.getByText('Yes').click()
  await expect(page.locator('h2.qv-prompt', { hasText: 'Bonus question revealed!' })).toBeVisible()
  await page.screenshot({ path: 'tests/e2e/screenshots/ed-f-standalone-preview.png', fullPage: true })
})
```

> The inline-prompt bundle (no refs) renders without any entity resolution. `page.addInitScript` runs before page scripts, so sessionStorage is seeded when `StandalonePreview` mounts. Use `page.getByLabel`/`getByText`/`locator` only. If the choice "Yes" label differs, adjust; the assertion that matters is the `show_if` element appears after answering.

- [ ] **Step 2: Run the smoke**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps/editor && npm run e2e -- standalone-preview`
Expected: PASS + screenshot at `tests/e2e/screenshots/ed-f-standalone-preview.png`. (Install chromium first if needed. If it can't run here, commit the spec + report the exact failure; do NOT weaken assertions.) Also re-run the FULL e2e suite once (`npm run e2e`) to confirm the multi-entry build + PreviewView refactor didn't break other specs; report the totals.

- [ ] **Step 3: Commit**

```bash
cd /home/pedro/Repos/Cursor/questionnaire_apps
git add editor/tests/e2e/standalone-preview.spec.ts
git commit -m "test(editor): ED-F Playwright standalone-preview smoke + screenshot"
```

---

## Task 7: FOLLOWUPS + final verification

**Files:**
- Modify: `editor/FOLLOWUPS.md`

- [ ] **Step 1: Append the ED-F follow-ups**

Add to `editor/FOLLOWUPS.md`:

```markdown
# ED-F Follow-ups

Known limitations and open items carried out of ED-F (standalone shareable preview).

## (ed-f-1) Real Viewer-Service deployment is deferred (OD-08)

The design's "Open in viewer" preset `preview` is NOT buildable: the VS rejects `preview`
(modes.py supports only anonymous_link/demo; `preview` → 422), OD-08 Identity (`editor_session`
auth) doesn't exist, and the VS mints runtimes from the LIBRARY (drafts with pool `.devN` entities
aren't there; the Library has no write API). ED-F ships a no-backend standalone preview instead;
real deployment waits for OD-08.

## (ed-f-2) Standalone preview is served from the editor build, not a single offline file

`preview.html` is a second entry in the editor's Vite build (renderer + wasm shared with the app).
"Shareable" = the recipient opens an exported `.bundle.json` in this page (served from the editor
app, or run locally). A truly hosting-free single-file HTML (renderer JS + wasm base64-inlined) is
a heavier follow-on.

## (ed-f-3) Library refs not in the bundle render as placeholders

The standalone has NO network (pool = the bundle's entities, Library fetcher returns null), so
hard-pinned Library refs not included in the bundle render as placeholders (the "N referenced
entities not loaded" banner). Fork Library entities into the pool to include them in the export.

## (ed-f-4) Scores are inert in the standalone preview

`score()` is null (no scorer runtime; ED-D4b deferred), so score-referencing logic/validation
conditions don't fire in the standalone preview — same as the in-app preview.

## (ed-f-5) sessionStorage handoff is same-browser

"Open preview" hands the bundle to preview.html via sessionStorage (same browser/origin). The
file-open path covers cross-machine sharing of an exported bundle.
```

- [ ] **Step 2: Final full suite + typecheck**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps/editor && npm run typecheck && npx vitest run`
Expected: typecheck clean; all tests pass.

- [ ] **Step 3: Production build smoke**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps/editor && npm run build`
Expected: succeeds; emits `dist/index.html` + `dist/preview.html` + the wasm asset.

- [ ] **Step 4: Commit**

```bash
cd /home/pedro/Repos/Cursor/questionnaire_apps
git add editor/FOLLOWUPS.md
git commit -m "docs(editor): ED-F FOLLOWUPS"
```

---

## Done criteria (mirror of spec §5)

1. Reusable `PreviewView` renders a runtime with live answers + logic/validation; `PreviewPane` is a thin wrapper; all prior preview tests stay green. — Task 1.
2. Standalone `preview.html` renders an exported bundle with no store/backend; logic/validation work; malformed/missing-entity degrade gracefully. — Tasks 2, 3, 4.
3. "Open preview" opens the standalone page for the current draft (sessionStorage); file-open loads a shared bundle. — Tasks 3, 5.
4. The page is labelled read-only / not-a-deployment. — Task 3.
5. All suites green; screenshot delivered. — Tasks 6, 7.

After the branch is green: merge to master locally + push (NO PR — owner preference), then write `project_editor_ed_f` memory + MEMORY.md line + HANDOFF update. **This completes the planned ED-A..F editor arc.**
```
