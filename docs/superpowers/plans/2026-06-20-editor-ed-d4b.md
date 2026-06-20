# Editor ED-D4b — Live Score Preview Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Run scorers live in the inline editor preview so the ScoringPanel shows computed values and `score(id)` in `show_if`/logic/validation conditions becomes live — scoped to the bundled reference PHQ-9, graceful "unavailable" for everything else.

**Architecture:** Approach B — the web-viewer exposes its existing scoring engine via a new `@behaverse/questionnaire-renderer/scoring` lib entry; the editor reuses `compileScorers`/`makeScoreCache` wholesale (its `LogicEvaluator`/`ScoreResolver` types are identical to the viewer's). The editor bundles `phq9.wasm` locally, projects `scores[]` into its preview `Runtime` (attaching a registry `impl` for known scorers), feeds the cache's resolver into the evaluator bindings, and publishes computed values to a small store slice the ScoringPanel reads.

**Tech Stack:** Vite (lib mode, multi-entry), React 19 + TS, Zustand, vitest + @testing-library/react, Playwright; reuses `web-viewer/src/scoring/*` + the reference `questionnaire-scorer/dist-wasm/phq9.wasm`.

## Global Constraints

- Two packages touched: `web-viewer/` (Task 1 only) and `editor/` (Tasks 2–8). All editor commands run from `editor/`; Task 1 commands from `web-viewer/`.
- **No change to the editor `Score` model** — it stays `{id, scorer, path, name?, description?}` (impl-free). `impl` (`{kind:'wasm', url, sha256}`) is attached **only** at preview-projection time, from the editor's bundled registry; it never enters the authored/exported questionnaire.
- **Scoped to bundled scorers.** Registry today = `scr_phq9` only. Unknown scorer ref → `score(id)` stays `null` + panel shows "unavailable in preview". Never throws into the preview.
- **Bundle the wasm at build**: an `ensure-scorers.mjs` build step (chained beside `ensure-renderer.mjs`) copies `questionnaire-scorer/dist-wasm/phq9.wasm` → gitignored `editor/public/scorers/phq9.wasm`. The PHQ-9 wasm sha256 is `d5a9aee827b03eb261de8c6ee6aec7d96682909e3ab47cad9361ed77943c505f`; a guard test hashes the bundled bytes against it.
- **Reuse, don't reimplement**: the editor imports `compileScorers`/`makeScoreCache`/`fetchScorerWasm` from the viewer lib; the only editor-new logic is the registry + projection + the React wiring.
- **Identical types**: `editor/src/logic/types.ts` `LogicEvaluator`/`ScoreResolver`/`EvalValue`/`Bindings` ≡ the viewer's, so the editor's `useEvaluator()` result is passed directly into `cache.refresh(answers, ev)`.
- Each task: `npm run typecheck` clean + relevant `vitest` green; commit per task. Landing: commit per-package to `master`, `git fetch origin`, ff-or-rebase, push (multi-agent pattern; harvester shares the checkout; stash `scripts/seed-supabase.md` before any rebase).

## File Structure

- `web-viewer/src/scoring/lib.ts` (new) — lib entry re-exporting the scoring engine.
- `web-viewer/vite.config.lib.ts`, `web-viewer/tsconfig.lib.json`, `web-viewer/package.json` (modified) — multi-entry build + d.ts + exports.
- `editor/scripts/ensure-scorers.mjs` (new), `editor/.gitignore`, `editor/package.json` (hooks), `editor/vite.config.ts` (alias), `editor/tsconfig.json` (paths) — bundle + wiring config.
- `editor/src/logic/scorers/registry.ts` (new) — scorer-ref → `impl` lookup.
- `editor/src/preview/project.ts` (modified) — project `scores` with `impl`.
- `editor/src/preview/useScoreCache.ts` (new) — async-compile + cache hook.
- `editor/src/state/store.ts` (modified) — `previewScores` slice.
- `editor/src/preview/PreviewView.tsx` (modified) — wire resolver + refresh + publish.
- `editor/src/logic/ScoringPanel.tsx` (modified) — live values + unavailable badges.
- `editor/src/samples/phq9.bundle.json` (new) + `editor/src/samples/sample.ts` + `editor/src/app/StartScreen.tsx` + `editor/src/app/App.tsx` (modified) — loadable PHQ-9 sample.

---

### Task 1: web-viewer — export the scoring engine as a second lib entry

**Files:**
- Create: `web-viewer/src/scoring/lib.ts`, `web-viewer/src/scoring/index.ts`
- Create: `web-viewer/src/scoring/lib.test.ts`
- Modify: `web-viewer/vite.config.lib.ts`, `web-viewer/tsconfig.lib.json`, `web-viewer/package.json`

**Interfaces:**
- Produces (importable by the editor from `@behaverse/questionnaire-renderer/scoring`): `compileScorers(runtime, fetchImpl?): Promise<ScorerSet>`; `makeScoreCache(set, runtime): ScoreCache`; `fetchScorerWasm(impl, fetchImpl?): Promise<ArrayBuffer>`; types `ScorerSet`, `ScoreCache`, `PinnedScore`, `PinnedScorerImpl`.

- [ ] **Step 1: Write the failing test**

```ts
// web-viewer/src/scoring/lib.test.ts
import { describe, it, expect } from 'vitest'
import * as scoring from './lib'

describe('scoring lib entry', () => {
  it('exposes the engine functions the editor consumes', () => {
    expect(typeof scoring.compileScorers).toBe('function')
    expect(typeof scoring.makeScoreCache).toBe('function')
    expect(typeof scoring.fetchScorerWasm).toBe('function')
  })
})
```

- [ ] **Step 2: Run to verify it fails**

Run (from `web-viewer/`): `npx vitest run src/scoring/lib.test.ts`
Expected: FAIL ("Cannot find module './lib'")

- [ ] **Step 3: Create the index + lib entry**

```ts
// web-viewer/src/scoring/index.ts
export { compileScorers, makeScoreCache, type ScorerSet, type ScoreCache } from './executor'
export { fetchScorerWasm } from './fetch'
export type { PinnedScore, PinnedScorerImpl } from './types'
```

```ts
// web-viewer/src/scoring/lib.ts
export * from './index'
```

- [ ] **Step 4: Run the source test to pass**

Run: `npx vitest run src/scoring/lib.test.ts`
Expected: PASS

- [ ] **Step 5: Make `build:lib` emit `dist-lib/scoring.js` + `dist-lib/scoring/lib.d.ts`**

Edit `web-viewer/vite.config.lib.ts` — switch to a multi-entry lib build (JS output names come from the entry keys; CSS stays `renderer.css`):

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from 'tailwindcss'
import autoprefixer from 'autoprefixer'

export default defineConfig({
  plugins: [react()],
  css: { postcss: { plugins: [tailwindcss('./tailwind.lib.config.ts'), autoprefixer()] } },
  build: {
    outDir: 'dist-lib',
    emptyOutDir: true,
    lib: {
      entry: { renderer: 'src/renderer/lib.ts', scoring: 'src/scoring/lib.ts' },
      formats: ['es'],
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'react/jsx-runtime'],
      output: { entryFileNames: '[name].js', assetFileNames: 'renderer.[ext]' },
    },
  },
})
```

Edit `web-viewer/tsconfig.lib.json` — broaden so both entries emit `.d.ts` under per-dir paths (`dist-lib/renderer/lib.d.ts`, `dist-lib/scoring/lib.d.ts`):

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "noEmit": false,
    "declaration": true,
    "emitDeclarationOnly": true,
    "outDir": "dist-lib",
    "rootDir": "src"
  },
  "include": ["src/renderer", "src/scoring", "src/logic"],
  "exclude": ["src/**/*.test.ts", "src/**/*.test.tsx"]
}
```

Edit `web-viewer/package.json` `exports` — the renderer `.d.ts` moved under `dist-lib/renderer/`, and add the scoring subpath:

```json
"exports": {
  ".": "./src/main.tsx",
  "./renderer": {
    "types": "./dist-lib/renderer/lib.d.ts",
    "import": "./dist-lib/renderer.js"
  },
  "./renderer/style.css": "./dist-lib/renderer.css",
  "./scoring": {
    "types": "./dist-lib/scoring/lib.d.ts",
    "import": "./dist-lib/scoring.js"
  }
}
```

- [ ] **Step 6: Build the lib + verify outputs**

Run: `npm run build:lib && ls dist-lib && ls dist-lib/renderer dist-lib/scoring`
Expected: `dist-lib/renderer.js`, `dist-lib/scoring.js`, `dist-lib/renderer.css` at the root; `dist-lib/renderer/lib.d.ts` and `dist-lib/scoring/lib.d.ts` present. (The renderer `.d.ts` moving under `dist-lib/renderer/` is intentional — Task 2 repoints the editor's path mapping. The editor isn't broken in between because each package builds independently.)

- [ ] **Step 7: Run the full web-viewer suite**

Run: `npm test`
Expected: green (additive change; existing scoring/renderer tests unaffected).

- [ ] **Step 8: Commit**

```bash
git add web-viewer/src/scoring/lib.ts web-viewer/src/scoring/index.ts web-viewer/src/scoring/lib.test.ts web-viewer/vite.config.lib.ts web-viewer/tsconfig.lib.json web-viewer/package.json
git commit -m "feat(web-viewer): ED-D4b export scoring engine as ./scoring lib entry"
```

---

### Task 2: editor — bundled wasm + scorer registry + import wiring

**Files:**
- Create: `editor/scripts/ensure-scorers.mjs`, `editor/src/logic/scorers/registry.ts`, `editor/src/logic/scorers/registry.test.ts`
- Modify: `editor/package.json` (hooks), `editor/.gitignore`, `editor/vite.config.ts` (alias), `editor/tsconfig.json` (paths)

**Interfaces:**
- Produces: `scorerImpl(scorerRef: string): PinnedScorerImpl | null` (matches the bare id before `@`); `isKnownScorer(scorerRef: string): boolean`; `PHQ9_SHA256` constant.
- Consumes: `PinnedScorerImpl` from `@behaverse/questionnaire-renderer` (already exported via the renderer types).

- [ ] **Step 1: Add the build step + gitignore + hooks**

Create `editor/scripts/ensure-scorers.mjs`:

```js
import { existsSync, mkdirSync, copyFileSync } from 'node:fs'
import { execSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

// Ensure the renderer lib (which now also emits scoring.js) is built.
const scoringLib = fileURLToPath(new URL('../../web-viewer/dist-lib/scoring.js', import.meta.url))
if (!existsSync(scoringLib)) {
  const cwd = fileURLToPath(new URL('../../web-viewer/', import.meta.url))
  console.log('[editor] building renderer+scoring library (web-viewer dist-lib)…')
  execSync('npm run build:lib', { cwd, stdio: 'inherit' })
}

// Copy the reference PHQ-9 wasm into the editor's public dir for local preview fetch.
const src = fileURLToPath(new URL('../../questionnaire-scorer/dist-wasm/phq9.wasm', import.meta.url))
const destDir = fileURLToPath(new URL('../public/scorers/', import.meta.url))
if (existsSync(src)) {
  mkdirSync(destDir, { recursive: true })
  copyFileSync(src, fileURLToPath(new URL('../public/scorers/phq9.wasm', import.meta.url)))
  console.log('[editor] copied phq9.wasm → public/scorers/phq9.wasm')
} else {
  console.warn('[editor] questionnaire-scorer/dist-wasm/phq9.wasm not found — PHQ-9 preview scoring will be unavailable')
}
```

Append `public/scorers/` to `editor/.gitignore` (new line).

Edit `editor/package.json` — append `&& node scripts/ensure-scorers.mjs` after `ensure-renderer.mjs` in `predev`, `prebuild`, `pretypecheck`, and `pretest`. Example for `pretest`:

```json
"pretest": "node scripts/ensure-renderer.mjs && node scripts/ensure-scorers.mjs",
```

(Do the same for `predev`, `prebuild`, `pretypecheck`.)

- [ ] **Step 2: Point the editor at the moved renderer types + the new scoring entry**

Edit `editor/tsconfig.json` `paths` (the renderer `.d.ts` moved to `dist-lib/renderer/` in Task 1; add the scorer path):

```json
"paths": {
  "@behaverse/questionnaire-renderer": ["../web-viewer/dist-lib/renderer/lib.d.ts"],
  "@behaverse/questionnaire-scorer": ["../web-viewer/dist-lib/scoring/lib.d.ts"]
}
```

Edit `editor/vite.config.ts` — add the scoring alias (keep the existing two):

```ts
alias: {
  '@behaverse/questionnaire-renderer/style.css': resolve(distLib, 'renderer.css'),
  '@behaverse/questionnaire-renderer': resolve(distLib, 'renderer.js'),
  '@behaverse/questionnaire-scorer': resolve(distLib, 'scoring.js'),
},
```

- [ ] **Step 3: Write the failing registry test**

```ts
// editor/src/logic/scorers/registry.test.ts
import { describe, it, expect } from 'vitest'
import { scorerImpl, isKnownScorer, PHQ9_SHA256 } from './registry'

describe('scorer registry', () => {
  it('resolves the bundled PHQ-9 impl by bare id (ignoring the version)', () => {
    const impl = scorerImpl('scr_phq9@v26.0602')
    expect(impl).toEqual({ kind: 'wasm', url: '/scorers/phq9.wasm', sha256: PHQ9_SHA256 })
    expect(isKnownScorer('scr_phq9@v99.9999')).toBe(true)
  })
  it('returns null for an unknown scorer', () => {
    expect(scorerImpl('scr_other@v26.0602')).toBeNull()
    expect(isKnownScorer('scr_other@v26.0602')).toBe(false)
  })
})
```

- [ ] **Step 4: Run to verify it fails**

Run: `npx vitest run src/logic/scorers/registry.test.ts`
Expected: FAIL ("Cannot find module './registry'")

- [ ] **Step 5: Implement the registry**

```ts
// editor/src/logic/scorers/registry.ts
import type { PinnedScorerImpl } from '@behaverse/questionnaire-renderer'

// sha256 of questionnaire-scorer/dist-wasm/phq9.wasm (kept in sync; guard test below).
export const PHQ9_SHA256 = 'd5a9aee827b03eb261de8c6ee6aec7d96682909e3ab47cad9361ed77943c505f'

// Scorers whose wasm the editor bundles for local preview. Preview-only — never authored.
const REGISTRY: Record<string, PinnedScorerImpl> = {
  scr_phq9: { kind: 'wasm', url: '/scorers/phq9.wasm', sha256: PHQ9_SHA256 },
}

/** Bare id before '@' (e.g. 'scr_phq9' from 'scr_phq9@v26.0602'). */
export function scorerImpl(scorerRef: string): PinnedScorerImpl | null {
  const bareId = scorerRef.split('@')[0]
  return REGISTRY[bareId] ?? null
}

export function isKnownScorer(scorerRef: string): boolean {
  return scorerImpl(scorerRef) !== null
}
```

- [ ] **Step 6: Add the sha-drift guard test**

```ts
// append to editor/src/logic/scorers/registry.test.ts
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'

it('the bundled phq9.wasm matches the registry sha256 (drift guard)', () => {
  // pretest runs ensure-scorers.mjs, so the bundled wasm exists.
  const wasm = fileURLToPath(new URL('../../../public/scorers/phq9.wasm', import.meta.url))
  const sha = createHash('sha256').update(readFileSync(wasm)).digest('hex')
  expect(sha).toBe(PHQ9_SHA256)
})
```

- [ ] **Step 7: Run tests + typecheck**

Run: `npx vitest run src/logic/scorers/registry.test.ts && npm run typecheck`
Expected: PASS (incl. the drift guard); typecheck clean (renderer types still resolve via the new `dist-lib/renderer/` path). If typecheck can't find renderer types, confirm Task 1's `build:lib` produced `dist-lib/renderer/lib.d.ts` and the tsconfig path matches.

- [ ] **Step 8: Commit**

```bash
git add editor/scripts/ensure-scorers.mjs editor/.gitignore editor/package.json editor/vite.config.ts editor/tsconfig.json editor/src/logic/scorers/registry.ts editor/src/logic/scorers/registry.test.ts
git commit -m "feat(editor): ED-D4b bundle phq9.wasm + scorer registry + scoring lib wiring"
```

---

### Task 3: editor — project `scores` (with impl) into the preview Runtime

**Files:**
- Modify: `editor/src/preview/project.ts`
- Test: `editor/src/preview/project.test.ts` (add cases; create if absent)

**Interfaces:**
- Consumes: `scorerImpl` (Task 2).
- Produces: `projectForPreview` now sets `runtime.scores` to the `PinnedScore[]` of **known** scorers (impl attached); unknown scorers are omitted from `runtime.scores`.

- [ ] **Step 1: Write the failing test**

```ts
// editor/src/preview/project.test.ts (add)
import { describe, it, expect } from 'vitest'
import { projectForPreview } from './project'
import type { Questionnaire } from '../model/types'

const noLookup = () => null

describe('projectForPreview scores', () => {
  it('projects known scorers with a bundled impl and drops unknown ones', () => {
    const model = {
      metadata: { id: 'qst_x', title: 'X', language: 'en' },
      pages: [],
      scores: [
        { id: 'phq9_total', scorer: 'scr_phq9@v26.0602', path: '/total', name: 'Total' },
        { id: 'other', scorer: 'scr_unknown@v26.0602', path: '/x' },
      ],
    } as unknown as Questionnaire
    const { runtime } = projectForPreview(model, noLookup)
    expect(runtime.scores).toEqual([
      { id: 'phq9_total', scorer: 'scr_phq9@v26.0602', path: '/total', name: 'Total',
        impl: { kind: 'wasm', url: '/scorers/phq9.wasm', sha256: 'd5a9aee827b03eb261de8c6ee6aec7d96682909e3ab47cad9361ed77943c505f' } },
    ])
  })
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/preview/project.test.ts`
Expected: FAIL (`runtime.scores` is `undefined`).

- [ ] **Step 3: Implement**

In `editor/src/preview/project.ts`, import the registry and project scores. Add at the top:

```ts
import { scorerImpl } from '../logic/scorers/registry'
import type { PinnedScore } from '@behaverse/questionnaire-renderer'
```

Inside `projectForPreview`, after the `runtime` object is built (before `return`), add:

```ts
  const modelScores = (r.scores as { id: string; scorer: string; path: string; name?: string; description?: string }[] | undefined) ?? []
  const pinned: PinnedScore[] = []
  for (const s of modelScores) {
    const impl = scorerImpl(s.scorer)
    if (impl) pinned.push({ ...s, impl })
  }
  runtime.scores = pinned
  runtime.x_show_score_live = r.x_show_score_live as boolean | undefined
```

- [ ] **Step 4: Run to verify pass + typecheck**

Run: `npx vitest run src/preview/project.test.ts && npm run typecheck`
Expected: PASS; typecheck clean.

- [ ] **Step 5: Commit**

```bash
git add editor/src/preview/project.ts editor/src/preview/project.test.ts
git commit -m "feat(editor): ED-D4b project scores[] with bundled impl into the preview Runtime"
```

---

### Task 4: editor — `previewScores` store slice + `useScoreCache` hook (runs the real wasm)

**Files:**
- Modify: `editor/src/state/store.ts`
- Create: `editor/src/preview/useScoreCache.ts`, `editor/src/preview/useScoreCache.test.tsx`

**Interfaces:**
- Produces (store): `previewScores: { values: Record<string, EvalValue>; unavailable: string[] } | null`; `setPreviewScores(v): void`.
- Produces (hook): `useScoreCache(runtime: Runtime): ScoreCache | null` — async-compiles the runtime's scorers (default `fetch`) and recompiles when `runtime.scores` changes; returns the cache (or `null` until ready / no scorers).
- Consumes: `compileScorers`, `makeScoreCache`, `ScoreCache` from `@behaverse/questionnaire-scorer`; `Runtime` from `@behaverse/questionnaire-renderer`.

- [ ] **Step 1: Add the store slice**

In `editor/src/state/store.ts`: add to the `EditorState` interface:

```ts
previewScores: { values: Record<string, import('../logic/types').EvalValue>; unavailable: string[] } | null
setPreviewScores: (v: EditorState['previewScores']) => void
```

In the `create(...)` initializer add `previewScores: null,` and `setPreviewScores: (v) => set({ previewScores: v }),`. In `reset()` add `previewScores: null`.

- [ ] **Step 2: Write the failing hook test (real PHQ-9 wasm via a node-fs fetchImpl)**

```tsx
// editor/src/preview/useScoreCache.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { useScoreCache } from './useScoreCache'
import type { LogicEvaluator } from '../logic/types'

// serve the bundled wasm from disk (pretest's ensure-scorers.mjs put it in public/)
const wasmBytes = readFileSync(fileURLToPath(new URL('../../public/scorers/phq9.wasm', import.meta.url)))
const fakeFetch = (async () => new Response(wasmBytes)) as unknown as typeof fetch

const PHQ9_SHA = 'd5a9aee827b03eb261de8c6ee6aec7d96682909e3ab47cad9361ed77943c505f'
function item(n: number) {
  return { id: `it_${n}`, question: { prompt: { id: `pr_phq9_${n}` } },
    option: { input_data_type: 'choice', measurement_type: 'ordinal', content: {} } }
}
const runtime = {
  provenance: {}, metadata: { id: 'qst', title: 'PHQ', language: 'en' },
  pages: [{ id: 'p1', elements: Array.from({ length: 9 }, (_, i) => item(i + 1)) }],
  scores: [{ id: 'total', scorer: 'scr_phq9@v26.0602', path: '/total',
    impl: { kind: 'wasm', url: '/scorers/phq9.wasm', sha256: PHQ9_SHA } }],
} as never

// minimal evaluator: reversedValue passthrough is enough for ordinal answers
const ev: LogicEvaluator = {
  condition: () => false, reversedValue: (v) => v,
  compareSolution: () => false, check: () => null,
}

describe('useScoreCache', () => {
  it('compiles the bundled PHQ-9 wasm and computes /total from answers', async () => {
    const { result } = renderHook(() => useScoreCache(runtime, fakeFetch))
    await waitFor(() => expect(result.current).not.toBeNull())
    const cache = result.current!
    const answers = Object.fromEntries(Array.from({ length: 9 }, (_, i) => [`it_${i + 1}`, i % 4])) // 0,1,2,3,0,1,2,3,0 = 12
    cache.refresh(answers, ev)
    expect(cache.resolver.score('total')).toBe(12)
  })
})
```

(Note: the hook's production signature is `useScoreCache(runtime)` using the global `fetch`; expose an optional 2nd arg `fetchImpl` for tests, defaulting to `fetch`.)

- [ ] **Step 3: Run to verify it fails**

Run: `npx vitest run src/preview/useScoreCache.test.tsx`
Expected: FAIL ("Cannot find module './useScoreCache'")

- [ ] **Step 4: Implement the hook**

```ts
// editor/src/preview/useScoreCache.ts
import { useEffect, useMemo, useState } from 'react'
import { compileScorers, makeScoreCache, type ScoreCache } from '@behaverse/questionnaire-scorer'
import type { Runtime } from '@behaverse/questionnaire-renderer'

/** Compile the runtime's bundled scorers (async) and return a ScoreCache, recompiling when
 *  the scores set changes. Returns null until ready / when there are no runnable scorers. */
export function useScoreCache(runtime: Runtime, fetchImpl: typeof fetch = fetch): ScoreCache | null {
  const [cache, setCache] = useState<ScoreCache | null>(null)
  const scoresKey = useMemo(() => JSON.stringify(runtime.scores ?? []), [runtime.scores])

  useEffect(() => {
    let alive = true
    setCache(null)
    if (!(runtime.scores && runtime.scores.length)) return
    void compileScorers(runtime, fetchImpl).then((set) => {
      if (alive) setCache(set.compiled.size ? makeScoreCache(set, runtime) : null)
    })
    return () => { alive = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scoresKey, fetchImpl])

  return cache
}
```

- [ ] **Step 5: Run to verify pass + typecheck**

Run: `npx vitest run src/preview/useScoreCache.test.tsx && npm run typecheck`
Expected: PASS — the real wasm computes `total === 12`; typecheck clean.

- [ ] **Step 6: Commit**

```bash
git add editor/src/state/store.ts editor/src/preview/useScoreCache.ts editor/src/preview/useScoreCache.test.tsx
git commit -m "feat(editor): ED-D4b previewScores slice + useScoreCache hook (runs bundled wasm)"
```

---

### Task 5: editor — wire live scoring into `PreviewView`

**Files:**
- Modify: `editor/src/preview/PreviewView.tsx`
- Test: `editor/src/preview/PreviewView.test.tsx` (add a score-gated-visibility case; create if absent)

**Interfaces:**
- Consumes: `useScoreCache` (Task 4); `setPreviewScores` (Task 4 store); `scorerImpl`/`isKnownScorer` (Task 2); the existing `projectForPreview`, `useEvaluator`, `makeBindings`.

- [ ] **Step 1: Write the failing test (score-gated element appears once the score crosses a threshold)**

```tsx
// editor/src/preview/PreviewView.test.tsx (add — adapt imports/harness to the existing file)
// A questionnaire whose 2nd page element has show_if "score('total') >= 1".
// With PHQ-9 wired, answering the first item to value>=1 makes score('total') live and reveals it.
// (If the existing test file already renders <PreviewView/> with a loaded model + pool, reuse that harness.)
```

Concretely, the test loads a model with PHQ-9 scores + a `show_if: "score('total') >= 1"` element, stubs the wasm fetch (as in Task 4), renders `PreviewView`, answers an item, and asserts the gated element becomes visible. If the existing PreviewView test harness can't easily inject the wasm fetch, assert instead that after wiring, `setPreviewScores` is called with a `values` map containing the score id (spy the store) — the end-to-end visibility path is covered by the Task 8 e2e.

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/preview/PreviewView.test.tsx`
Expected: FAIL (score-gated element hidden because `score()` is still stubbed to null).

- [ ] **Step 3: Wire it**

In `editor/src/preview/PreviewView.tsx`:
1. Import: `import { useScoreCache } from './useScoreCache'`, `import { useEditorStore } from '../state/store'` (if not already), and the registry: `import { isKnownScorer } from '../logic/scorers/registry'`.
2. After the `runtime` is obtained from `projectForPreview`, get the cache + publish:

```tsx
const cache = useScoreCache(runtime)
const setPreviewScores = useEditorStore((s) => s.setPreviewScores)

// refresh BEFORE bindings so score() is current in this render
if (cache && evaluator) cache.refresh(answers as Record<string, never>, evaluator)
const scoreResolver = cache?.resolver ?? { score: () => null }

useEffect(() => {
  if (!cache || !evaluator) { return }
  const values: Record<string, import('../logic/types').EvalValue> = {}
  for (const s of runtime.scores ?? []) values[s.id] = cache.resolver.score(s.id)
  // unavailable = authored scorers with no bundled impl
  const unavailable = [...new Set(((model?.scores ?? []) as { scorer: string }[])
    .map((s) => s.scorer).filter((ref) => !isKnownScorer(ref)))]
  setPreviewScores({ values, unavailable })
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [cache, answers, evaluator])
```

3. Replace `makeBindings(answers as Record<string, unknown>, { score: () => null })` with `makeBindings(answers as Record<string, unknown>, scoreResolver)`.
4. When the preview unmounts, clear: add `useEffect(() => () => setPreviewScores(null), [setPreviewScores])`.

(Use the actual `model`/`answers`/`evaluator` variable names already in `PreviewView`. `model.scores` is the authored list for the unavailable set.)

- [ ] **Step 4: Run to verify pass + full preview tests + typecheck**

Run: `npx vitest run src/preview/ && npm run typecheck`
Expected: PASS; typecheck clean.

- [ ] **Step 5: Commit**

```bash
git add editor/src/preview/PreviewView.tsx editor/src/preview/PreviewView.test.tsx
git commit -m "feat(editor): ED-D4b wire live score resolver into the preview bindings + publish values"
```

---

### Task 6: editor — ScoringPanel live values + "unavailable" badges

**Files:**
- Modify: `editor/src/logic/ScoringPanel.tsx`
- Test: `editor/src/logic/ScoringPanel.test.tsx` (add cases)

**Interfaces:**
- Consumes: `previewScores` store slice (Task 4); `isKnownScorer` (Task 2).

- [ ] **Step 1: Write the failing test**

```tsx
// editor/src/logic/ScoringPanel.test.tsx (add)
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ScoringPanel } from './ScoringPanel'
import { useEditorStore } from '../state/store'
import type { Questionnaire } from '../model/types'

const model = {
  metadata: { id: 'q', title: 'q', language: 'en' }, pages: [],
  scores: [
    { id: 'phq9_total', scorer: 'scr_phq9@v26.0602', path: '/total', name: 'Total' },
    { id: 'x', scorer: 'scr_unknown@v26.0602', path: '/x', name: 'X' },
  ],
} as unknown as Questionnaire

beforeEach(() => {
  const s = useEditorStore.getState()
  s.reset()
  s.loadModel(structuredClone(model), { kind: 'file', name: 'q.json' })
})

it('shows the live value for a runnable score and an unavailable badge for an unknown scorer', () => {
  useEditorStore.getState().setPreviewScores({ values: { phq9_total: 12 }, unavailable: ['scr_unknown@v26.0602'] })
  render(<ScoringPanel />)
  expect(screen.getByText('12')).toBeInTheDocument()                 // live value
  expect(screen.getByText(/unavailable in preview/i)).toBeInTheDocument() // unknown scorer badge
})

it('hints to open the preview when no live values are present', () => {
  useEditorStore.getState().setPreviewScores(null)
  render(<ScoringPanel />)
  expect(screen.getByText(/open the preview/i)).toBeInTheDocument()
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/logic/ScoringPanel.test.tsx`
Expected: FAIL (no live value / badge / hint rendered yet).

- [ ] **Step 3: Implement**

In `editor/src/logic/ScoringPanel.tsx`:
1. Read the slice + registry: `const previewScores = useEditorStore((s) => s.previewScores)` and `import { isKnownScorer } from './scorers/registry'`.
2. Replace the static note `<p>…not shown live in this preview.</p>` with, per score row, the live value or an "unavailable in preview" badge, and a global hint when `previewScores` is null:

```tsx
{!previewScores && (
  <p className="text-[11px] text-ed-muted">Open the preview to see live computed scores.</p>
)}
{/* inside each score row render: */}
{(() => {
  const runnable = isKnownScorer(score.scorer)
  if (!runnable) return <span className="rounded bg-ed-subtle px-1.5 py-0.5 text-[10px] text-ed-muted">unavailable in preview</span>
  const v = previewScores?.values?.[score.id]
  return <span className="font-mono text-xs text-ed-text">{v === undefined || v === null ? '—' : String(v)}</span>
})()}
```

(Place the value/badge next to each score's id/name in the existing row layout. `score` is the per-row variable in the existing `model.scores` map.)

- [ ] **Step 4: Run to verify pass + typecheck**

Run: `npx vitest run src/logic/ScoringPanel.test.tsx && npm run typecheck`
Expected: PASS; typecheck clean.

- [ ] **Step 5: Commit**

```bash
git add editor/src/logic/ScoringPanel.tsx editor/src/logic/ScoringPanel.test.tsx
git commit -m "feat(editor): ED-D4b ScoringPanel live values + unavailable badges"
```

---

### Task 7: editor — loadable PHQ-9 sample

**Files:**
- Create: `editor/src/samples/phq9.bundle.json`
- Modify: `editor/src/samples/sample.ts`, `editor/src/app/StartScreen.tsx`, `editor/src/app/App.tsx`
- Test: `editor/src/app/StartScreen.test.tsx` (add)

**Interfaces:**
- Produces: `phq9Sample: { questionnaire: Questionnaire; entities: Record<string, EntityBody> }`; `StartScreen` gains `onLoadPhq9: () => void`.

- [ ] **Step 1: Build a self-contained PHQ-9 bundle**

Create `editor/src/samples/phq9.bundle.json` as a `{ questionnaire, entities }` bundle (mirror `bisbas.bundle.json`): a `qst_phq9` questionnaire with one page of 9 items, each `{ id: 'it_phq9_N', question: { prompt: { ref: 'pr_phq9_N@v26.0602' } }, option: { ref: 'opt_phq9_freq@v26.0602' } }`, plus `scores[]` = the three impl-free entries from `editor/src/__fixtures__/phq9.json` (`phq9_total`→`/total`, `phq9_severity`→`/severity`, `phq9_band_label`→`/band/label`, scorer `scr_phq9@v26.0602`). The `entities` pool holds the 9 prompts (`pr_phq9_1..9`, content `{en:{text:'…'}}`) + a shared 4-point frequency option `opt_phq9_freq` (`input_data_type:'choice'`, `measurement_type:'ordinal'`, 4 choices values 0–3 "Not at all"…"Nearly every day"). Reuse the prompt texts from `editor/src/__fixtures__/phq9.json` so the bundle is realistic. Keep scores **impl-free** (the wasm comes from the registry).

(Authoring note for the implementer: copy the items/prompts from the existing fixture; make the option a single reused `opt_phq9_freq` to keep the bundle small; ensure every `ref` in the questionnaire has a matching key in `entities`.)

- [ ] **Step 2: Export the sample**

In `editor/src/samples/sample.ts` add:

```ts
import phq9bundle from './phq9.bundle.json'
export const phq9Sample = phq9bundle as unknown as { questionnaire: Questionnaire; entities: Record<string, EntityBody> }
```

- [ ] **Step 3: Write the failing StartScreen test**

```tsx
// editor/src/app/StartScreen.test.tsx (add — include all existing required props + the new one)
it('the "Load PHQ-9 sample" card calls onLoadPhq9', () => {
  const onLoadPhq9 = vi.fn(); const noop = () => {}
  render(<StartScreen onNew={noop} onOpenFile={noop} onOpenLibrary={noop} onLoadSample={noop}
                      onBrowseLibrary={noop} onTranslate={noop} onTranslateWorkbench={noop} onLoadPhq9={onLoadPhq9} />)
  fireEvent.click(screen.getByRole('button', { name: /phq-9 sample/i }))
  expect(onLoadPhq9).toHaveBeenCalled()
})
```

- [ ] **Step 4: Run to verify it fails**

Run: `npx vitest run src/app/StartScreen.test.tsx`
Expected: FAIL (prop/card missing).

- [ ] **Step 5: Implement the card + wiring**

In `StartScreen.tsx`: add `onLoadPhq9: () => void` to `Props`; add a card after the BIS/BAS sample card:

```tsx
<button onClick={onLoadPhq9} className="rounded-lg border border-ed-border p-4 text-left hover:bg-ed-subtle">
  <div className="flex items-center gap-2 font-medium">Load PHQ-9 sample</div>
  <div className="text-sm text-ed-muted">A scored questionnaire — see live scores in the preview</div>
</button>
```

In `App.tsx`: import `phq9Sample` and pass:

```tsx
onLoadPhq9={() => {
  loadModel(phq9Sample.questionnaire, { kind: 'sample', id: 'qst_phq9' }, phq9Sample.entities)
  void refreshStaleness()
}}
```

- [ ] **Step 6: Run to verify pass + full unit + typecheck**

Run: `npm test && npm run typecheck`
Expected: all green / clean (the bundle is valid Schema-2 and round-trips).

- [ ] **Step 7: Commit**

```bash
git add editor/src/samples/phq9.bundle.json editor/src/samples/sample.ts editor/src/app/StartScreen.tsx editor/src/app/App.tsx editor/src/app/StartScreen.test.tsx
git commit -m "feat(editor): ED-D4b loadable PHQ-9 sample (scored)"
```

---

### Task 8: Full verification + e2e + screenshot

- [ ] **Step 1: Full suites + typecheck + build (editor)**

Run (from `editor/`): `npm test && npm run typecheck && npm run build`
Expected: all green; build emits `dist/` (the wasm rides in `public/scorers/`).

- [ ] **Step 2: e2e — live score in the preview**

Add to `editor/tests/e2e/` a spec: load the PHQ-9 sample, open the preview, answer the items, and assert the live Total appears in the ScoringPanel (and, if the sample includes a score-gated element, that it appears). The wasm is bundled locally (served from `/scorers/phq9.wasm`) — no route stub needed. Run the FULL `npm run e2e`.

- [ ] **Step 3: Screenshot**

With `npm run dev` (5173): Load PHQ-9 sample → open preview → answer a few items → screenshot the ScoringPanel showing the live Total + the preview. Save to `/tmp/edd4b-*.png`.

- [ ] **Step 4: Commit fixups**

```bash
git add -A && git commit -m "test(editor): ED-D4b e2e live score preview + green suite"
```

---

## Self-Review

**Spec coverage:**
- Approach B / viewer exports scoring engine → Task 1 ✓.
- Editor reuses `compileScorers`/`makeScoreCache` (identical evaluator types) → Tasks 4–5 ✓.
- Scoped to bundled scorers; graceful unavailable → registry (Task 2) + projection drops unknowns (Task 3) + panel badge (Task 6) ✓.
- Bundle wasm at build; sha guard → Task 2 (`ensure-scorers.mjs` + drift test) ✓.
- `impl` preview-only, model unchanged → projection attaches impl (Task 3); `Score` model untouched ✓.
- `score()` live in conditions → Task 5 (resolver into bindings) ✓.
- ScoringPanel live values via store slice + preview-active hint → Tasks 4+6 ✓.
- Loadable PHQ-9 sample → Task 7 ✓.
- Error handling (unknown/failed → null + badge; never throws) → registry/projection/hook (`set.compiled.size` guard) ✓.
- Testing (viewer export, registry, real-wasm integration, score-gated visibility, panel, e2e) → Tasks 1,2,4,5,6,8 ✓.

**Placeholder scan:** code is concrete except two intentionally read-and-adapt spots, both flagged with the load-bearing assertion: Task 5 Step 1 (adapt to the existing PreviewView test harness; fallback = spy `setPreviewScores`) and Task 7 Step 1 (author the bundle from the existing fixture). Task 1's d.ts restructure is the riskiest mechanical step and has an explicit `ls dist-lib` verification.

**Type consistency:** `scorerImpl`/`isKnownScorer`/`PHQ9_SHA256` (Task 2) used in Tasks 3,5,6; `useScoreCache(runtime, fetchImpl?)→ScoreCache|null` (Task 4) consumed in Task 5; `previewScores: {values, unavailable}` (Task 4) consumed in Tasks 5,6; `compileScorers`/`makeScoreCache`/`ScoreCache`/`PinnedScore`/`PinnedScorerImpl` imported from the new viewer entry (Task 1) consistently. `runtime.scores: PinnedScore[]` matches the viewer `Runtime` type.

**Ordering risk:** Task 1 must land (or at least `build:lib` must run) before Task 2's typecheck, because the editor's renderer-types path moves to `dist-lib/renderer/`. Within subagent-driven execution this is sequential, so it holds; `ensure-scorers.mjs`/`ensure-renderer.mjs` rebuild `dist-lib` on `pretest`/`pretypecheck`.
