# Web Viewer WV-F (Conformance + Distribution Polish) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wrap up the Web Viewer — package the renderer as a consumable library (OD-03), parallelize the evaluator load for PERF-01, add iframe host events, ship a PWA shell (installable + asset cache), and serve the Schema 7 manifest from the viewer origin. Spec: [2026-06-12-web-viewer-wv-f-design.md](../specs/2026-06-12-web-viewer-wv-f-design.md) (all F1–F5 accepted).

**Architecture:** Mostly packaging + build config over the finished WV-A..E viewer (no behaviour change to rendering/logic/resume). A second Vite build (`vite.config.lib.ts`) emits `@behaverse/questionnaire-renderer` (ESM + dts + precompiled CSS, React externalized). A small `embed.ts` posts lifecycle events to a host frame. The App boot overlaps the 1 MB evaluator WASM fetch with the mint round-trip. `vite-plugin-pwa` precaches the shell + WASM.

**Tech Stack:** existing web-viewer (Vite 6 / React19 / TS / vitest) + `vite-plugin-pwa` (PWA, devdep). No VS change. Rust toolchain at `$HOME/.cargo` (the main build runs the evaluator WASM build).

**Branch:** create `wv-f-web-viewer` from `master` before Task 1; merge `--no-ff` + push at the end (no PRs).

**Conventions (every task):** run from `web-viewer/`; tests `npx vitest run`; NEVER bare `tsc` (only `npm run typecheck`); commit per task; stage explicit paths (NEVER `git add -A` — the repo root has untracked dirs). The renderer (`src/renderer/index.ts`) exports `StepRenderer`/`ItemRenderer`/`mergeOptions`/`deriveWidget`/guards/keys/types.

---

## File map

| Path | Responsibility |
|---|---|
| `web-viewer/src/renderer/lib.ts` (new) | Library entry: re-export `./index` + `import './lib.css'` |
| `web-viewer/src/renderer/lib.css` (new) | `@tailwind` directives + `:root` `--qv-*` defaults (the renderer's styling) |
| `web-viewer/vite.config.lib.ts` (new) | Library build (ESM → `dist-lib/`, React externalized, Tailwind-for-renderer CSS) |
| `web-viewer/tailwind.lib.config.ts` (new) | Tailwind scanning `src/renderer/**` only (lib CSS) |
| `web-viewer/tsconfig.lib.json` (new) | `emitDeclarationOnly` → `dist-lib/renderer.d.ts` |
| `web-viewer/tests/lib/lib-smoke.test.tsx` (new) | imports `StepRenderer` from the BUILT `dist-lib/renderer.js` + renders |
| `web-viewer/src/app/embed.ts` (new) | `postMessage` host-event layer (loaded/completed/resize) |
| `web-viewer/src/app/embed.test.ts` (new) | embed units |
| `web-viewer/src/app/App.tsx` (modify) | parallelize evaluator+mint; wire embed events |
| `web-viewer/src/app/main.tsx` (modify) | production `registerSW()` |
| `web-viewer/public/manifest.webmanifest` (new) | PWA install manifest |
| `web-viewer/public/icon.svg` (new) | PWA icon |
| `web-viewer/public/manifest.json` (new) | the Schema 7 conformance manifest, served at `/manifest.json` (copy of the root one) |
| `web-viewer/vite.config.ts` (modify) | add `VitePWA` plugin |
| `web-viewer/index.html` (modify) | link the webmanifest |
| `web-viewer/package.json` (modify) | `build:lib`, `test:lib`, `exports`, `peerDependencies`, `vite-plugin-pwa` devdep |
| `web-viewer/.gitignore` (modify) | ignore `dist-lib/` |
| `web-viewer/PERF.md` (new) | PERF-01 budget + load-path math |
| `web-viewer/README.md` / `FOLLOWUPS.md` (modify) | WV-F docs |

---

### Task 1: Renderer library build (OD-03)

**Files:** create `src/renderer/lib.ts`, `src/renderer/lib.css`, `vite.config.lib.ts`, `tailwind.lib.config.ts`, `tsconfig.lib.json`, `tests/lib/lib-smoke.test.tsx`; modify `package.json`, `.gitignore`, `vite.config.ts` (exclude tests/lib from default vitest).

- [ ] **Step 1: Branch.** `git checkout -b wv-f-web-viewer` (repo root).
- [ ] **Step 2: lib entry + css.** `src/renderer/lib.ts`:

```ts
import './lib.css'
export * from './index'
```

`src/renderer/lib.css` (copy the theme-var block from `src/index.css`):

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
```

- [ ] **Step 3: lib tailwind config** `tailwind.lib.config.ts` (scan only the renderer):

```ts
import type { Config } from 'tailwindcss'
export default {
  content: ['./src/renderer/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: { primary: 'var(--qv-primary)', secondary: 'var(--qv-secondary)', success: 'var(--qv-success)',
                warning: 'var(--qv-warning)', error: 'var(--qv-error)', surface: 'var(--qv-background)' },
      fontFamily: { theme: ['var(--qv-font-family)'] },
    },
  },
  plugins: [],
} satisfies Config
```

- [ ] **Step 4: `vite.config.lib.ts`:**

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
    lib: { entry: 'src/renderer/lib.ts', formats: ['es'], fileName: () => 'renderer.js' },
    rollupOptions: {
      external: ['react', 'react-dom', 'react/jsx-runtime'],
      output: { assetFileNames: 'renderer.[ext]' },   // → dist-lib/renderer.css
    },
  },
})
```

- [ ] **Step 5: `tsconfig.lib.json`** (dts only):

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "noEmit": false,
    "declaration": true,
    "emitDeclarationOnly": true,
    "outDir": "dist-lib",
    "rootDir": "src/renderer"
  },
  "include": ["src/renderer"],
  "exclude": ["src/renderer/**/*.test.ts", "src/renderer/**/*.test.tsx"]
}
```

(If `tsc -p tsconfig.lib.json` emits nested dirs, the entry types are at `dist-lib/lib.d.ts` or `dist-lib/index.d.ts` — point the package.json `types` at whichever `tsc` produces; verify after building. Likely `dist-lib/lib.d.ts`.)

- [ ] **Step 6: package.json** — add scripts `"build:lib": "vite build -c vite.config.lib.ts && tsc -p tsconfig.lib.json"`, `"test:lib": "npm run build:lib && vitest run tests/lib --root . "` (the lib smoke needs the built artifact first). Add an `exports` map + peer deps (keep the existing `dependencies`):

```jsonc
"exports": {
  ".": "./src/main.tsx",
  "./renderer": { "types": "./dist-lib/lib.d.ts", "import": "./dist-lib/renderer.js" },
  "./renderer/style.css": "./dist-lib/renderer.css"
},
"peerDependencies": { "react": "^19.0.0", "react-dom": "^19.0.0" },
```

(`"."` is a placeholder; the package isn't published. Adjust `./renderer` `types` to the actual dts path from Step 5.)

- [ ] **Step 7: gitignore + vitest exclude.** Add `dist-lib/` to `web-viewer/.gitignore`. In `vite.config.ts` `test.exclude`, add `'tests/lib/**'` (so the default `npm test` doesn't try to import the not-yet-built lib).
- [ ] **Step 8: lib-smoke test** `tests/lib/lib-smoke.test.tsx`:

```tsx
// @vitest-environment jsdom
import { render } from '@testing-library/react'
// Import from the BUILT library artifact (proves it's consumable standalone):
import { StepRenderer } from '../../dist-lib/renderer.js'

test('the built renderer library renders a step', () => {
  const item = { id: 'it_1', question: { prompt: { content: { en: { text: 'Hello?' } } } },
    option: { input_data_type: 'choice', measurement_type: 'ordinal', selection: 'single',
      options: [{ index: 1, value: 0 }], content: { en: { options: [{ index: 1, text: 'Yes' }] } } } }
  const { getByRole } = render(
    <StepRenderer elements={[{ key: 'it_1', element: item }]} locale="en" answers={{}} onAnswer={() => {}}
      requiredErrors={[]} strings={{ required: 'req', unsupported: 'unsupported' }} />,
  )
  expect(getByRole('heading', { name: 'Hello?' })).toBeTruthy()
})
```

Add a vitest setup import if needed (the lib test runs via `test:lib` which uses the same vitest config; ensure `tests/lib` is INCLUDED when running `vitest run tests/lib` explicitly — the path arg overrides the exclude, OR pass `--config` with a tweaked exclude. Verify: `npx vitest run tests/lib` after building runs it. If the global exclude blocks it, create `web-viewer/tests/lib/vitest.config.ts` extending the root config without the `tests/lib` exclude and point `test:lib` at it.)

- [ ] **Step 9: Build + smoke.** `. "$HOME/.cargo/env"` not needed (lib build has no wasm). Run `npm run build:lib` → emits `dist-lib/renderer.js` + `dist-lib/renderer.css` + `dist-lib/*.d.ts`. Confirm React is NOT in the bundle: `grep -c "createElement\|react" dist-lib/renderer.js` shows imports from 'react' (externalized), not a bundled copy — check the file head has `import { ... } from "react"`. Then `npm run test:lib` → the smoke passes. Then `npm test` (default) still green (167) + `npm run typecheck` clean.
- [ ] **Step 10: Commit.** `git add web-viewer/src/renderer/lib.ts web-viewer/src/renderer/lib.css web-viewer/vite.config.lib.ts web-viewer/tailwind.lib.config.ts web-viewer/tsconfig.lib.json web-viewer/tests/lib web-viewer/package.json web-viewer/package-lock.json web-viewer/.gitignore web-viewer/vite.config.ts && git commit -m "feat(web-viewer): renderer library build (OD-03) — @behaverse/questionnaire-renderer ESM + dts + CSS, React externalized"`

---

### Task 2: iframe host events (`embed.ts`)

**Files:** create `src/app/embed.ts`, `src/app/embed.test.ts`; modify `src/app/App.tsx` (+ `App.test.tsx`).

- [ ] **Step 1: Failing tests** `embed.test.ts`:

```ts
import { isFramed, postToHost, observeHeight } from './embed'

test('isFramed true only when window.parent differs from window', () => {
  expect(isFramed({ parent: {}, self: {} } as never)).toBe(true)
  const w = {} as never; (w as { parent: unknown }).parent = w
  expect(isFramed(w)).toBe(false)
})
test('postToHost posts the event to parent with the configured origin', () => {
  const calls: unknown[][] = []
  const win = { parent: { postMessage: (...a: unknown[]) => calls.push(a) }, self: {} } as never
  postToHost(win, { type: 'behaverse:completed', sessionId: 's1' }, 'https://host.example')
  expect(calls[0]).toEqual([{ type: 'behaverse:completed', sessionId: 's1' }, 'https://host.example'])
})
test('postToHost no-ops when not framed', () => {
  const w = { self: {} } as never; (w as { parent: unknown }).parent = w
  ;(w as { parent: { postMessage: () => void } }).parent = { postMessage: () => { throw new Error('should not call') } } as never
  // when parent === self → not framed → no post. Build a self-referential window:
  const win = { self: {} } as { self: object; parent?: unknown }; win.parent = win
  expect(() => postToHost(win as never, { type: 'behaverse:loaded', sessionId: 's1' }, '*')).not.toThrow()
})
test('observeHeight reports content height changes via the injected observer', () => {
  const heights: number[] = []
  let cb: () => void = () => {}
  const FakeRO = class { constructor(c: () => void) { cb = c } observe() {} disconnect() {} } as unknown as typeof ResizeObserver
  const el = { scrollHeight: 420 } as HTMLElement
  const stop = observeHeight(el, (h) => heights.push(h), FakeRO)
  cb()
  expect(heights).toEqual([420])
  stop()
})
```

- [ ] **Step 2: Run → fail. Implement** `embed.ts`:

```ts
export type HostEvent =
  | { type: 'behaverse:loaded'; sessionId: string }
  | { type: 'behaverse:completed'; sessionId: string }
  | { type: 'behaverse:resize'; height: number }

type Win = { parent: unknown; self: unknown }

export function isFramed(win: Win = window as unknown as Win): boolean {
  return win.parent !== win.self
}

export function postToHost(win: Win, event: HostEvent, targetOrigin: string): void {
  if (!isFramed(win)) return
  ;(win.parent as { postMessage: (e: HostEvent, o: string) => void }).postMessage(event, targetOrigin)
}

/** Watch an element's height; report on change. Injectable ResizeObserver for tests. */
export function observeHeight(el: HTMLElement, onHeight: (h: number) => void, RO: typeof ResizeObserver = ResizeObserver): () => void {
  let last = -1
  const ro = new RO(() => {
    const h = el.scrollHeight
    if (h !== last) { last = h; onHeight(h) }
  })
  ro.observe(el)
  return () => ro.disconnect()
}
```

(Adjust the third test if the self-referential construction is awkward — the contract is "parent === self ⇒ no post"; keep one clean assertion.)

- [ ] **Step 3: Run → pass. Wire into App.tsx:**
  - import `isFramed`, `postToHost`, `observeHeight` + type `HostEvent`.
  - `const embedOrigin = params... `: add `embed_origin` to `parseParams` (bootstrap.ts) returning `embedOrigin: string` (default `'*'`); OR read it inline: `const embedOrigin = new URLSearchParams(window.location.search).get('embed_origin') ?? '*'`. Use the inline read to avoid touching parseParams (report if you extend parseParams instead).
  - On `ready` (a `useEffect` on `state.phase === 'ready'`, once, with the sessionId): `postToHost(window, { type: 'behaverse:loaded', sessionId: state.session!.id }, embedOrigin)`.
  - On `state.phase === 'submitted'` → no; the finishing flow ends at `submitted` then `finished`. Post `behaverse:completed` when phase becomes `finished` (a `useEffect` on `state.phase === 'finished'`): `postToHost(window, { type: 'behaverse:completed', sessionId: state.session?.id ?? '' }, embedOrigin)`.
  - Resize: a `useEffect` (when framed) attaching `observeHeight(document.documentElement, (h) => postToHost(window, { type: 'behaverse:resize', height: h }, embedOrigin))`; cleanup on unmount.
- [ ] **Step 4: App test** (append to App.test.tsx) — assert a framed completion posts `behaverse:completed`:

```tsx
test('emits behaverse:completed to the host on finish (when framed)', async () => {
  setUrl('?deployment=dpl_1')
  fakeStore = makeFakeStore()
  const posts: unknown[] = []
  const parentSpy = { postMessage: (e: unknown) => posts.push(e) }
  vi.spyOn(window, 'parent', 'get').mockReturnValue(parentSpy as never)   // window.parent !== window.self → framed
  const fetchMock = vi.fn().mockImplementation(async (url: string) => {
    if (String(url).endsWith('/sessions/new')) return new Response(JSON.stringify(mintOk), { status: 200 })
    return new Response('{"enqueued":1}', { status: 202 })
  })
  vi.stubGlobal('fetch', fetchMock)
  render(<App />)
  await userEvent.click(await screen.findByRole('button', { name: /next/i }))
  await userEvent.click(await screen.findByRole('radio', { name: /Not at all/ }))
  await screen.findByRole('heading', { name: /How many hours/ }, { timeout: 2000 })
  await userEvent.click(screen.getByRole('button', { name: /next/i }))
  await screen.findByRole('heading', { name: /Thank you/i }, { timeout: 3000 })
  expect(posts.some((e) => (e as { type: string }).type === 'behaverse:completed')).toBe(true)
})
```

(`vi.spyOn(window,'parent','get')` makes `window.parent !== window` → framed. Restore in afterEach via `vi.restoreAllMocks()` if not already.)

- [ ] **Step 5:** suite + typecheck green. **Commit:** `git commit -am "feat(web-viewer): iframe host events (behaverse:loaded/completed/resize via postMessage)"`

---

### Task 3: PERF-01 — parallelize evaluator load with mint

**Files:** modify `src/app/App.tsx` (+ `App.test.tsx`); create `web-viewer/PERF.md`.

- [ ] **Step 1: Failing test** (App.test.tsx) — assert `loadEvaluator` is invoked before the mint fetch (proving the WASM load is kicked off early, overlapping the network):

```tsx
import * as evalMod from '../logic/evaluator'
test('boot kicks off the evaluator load before awaiting the mint (PERF-01 overlap)', async () => {
  setUrl('?deployment=dpl_1')
  fakeStore = makeFakeStore()
  const order: string[] = []
  const loadSpy = vi.spyOn(evalMod, 'loadEvaluator').mockImplementation(async () => { order.push('load'); return evalMod.makeFakeEvaluator() })
  const fetchMock = vi.fn().mockImplementation(async (url: string) => {
    if (String(url).endsWith('/sessions/new')) { order.push('mint'); return new Response(JSON.stringify(mintOk), { status: 200 }) }
    return new Response('{"enqueued":1}', { status: 202 })
  })
  vi.stubGlobal('fetch', fetchMock)
  render(<App />)
  await screen.findByText(/Welcome\. Answer honestly\./)
  expect(order.indexOf('load')).toBeLessThan(order.indexOf('mint'))   // load kicked off first
  loadSpy.mockRestore()
})
```

(NOTE the App test file already `vi.mock('../logic/evaluator')`s — the spy must work with the mock; if `vi.spyOn` on the mocked module is awkward, instead assert the existing behaviour is preserved AND that `loadEvaluator` is called once; the structural change is verified by the full suite staying green. Use whichever is robust; report.)

- [ ] **Step 2: Implement** in `App.tsx` `boot()` — restructure the evaluator + mint to overlap. Replace:

```tsx
const evaluator = await loadEvaluator()
const outcome = await resolveResume(params.vsBaseUrl, params.deploymentId, store, { getSession, getRuntime })
```

with:

```tsx
const evaluatorPromise = loadEvaluator()                  // kick off the 1 MB WASM fetch now
const outcome = await resolveResume(params.vsBaseUrl, params.deploymentId, store, { getSession, getRuntime })
```

Then in the **resume** branch, before `buildPipeline`, add `const evaluator = await evaluatorPromise` (it has been loading during resolveResume's reads). In the **fresh-mint** path, overlap with the mint:

```tsx
if (outcome.kind === 'ephemeral_cleared') setDemoCleared(true)
const [evaluator, res] = await Promise.all([evaluatorPromise, mintSession(params.vsBaseUrl, params.deploymentId, params.locale)])
if (res.ok) {
  // ... existing mint-success body, now using the already-resolved `evaluator` ...
```

(The fixture path keeps its own `loadEvaluator()` await — or reuse `evaluatorPromise`; simplest: fixture path is BEFORE the deployment branch and already awaits its own evaluator, leave it. Verify the fixture path still loads the evaluator. If the fixture path is after this restructure, give it `const evaluator = await evaluatorPromise` too.)

- [ ] **Step 3:** the test + full suite green (all WV-D/E branching/resume/validation tests must stay green — the overlap is behaviour-preserving). `npm run typecheck` clean.
- [ ] **Step 4: PERF.md** — record the budget: the gzipped sizes from `npm run build` (app `index-*.js` ~75 KB gzip, evaluator WASM ~390 KB gzip, CSS ~12 KB), the PERF-01 target (< 3 s on 3G ≈ 400 kbps ⇒ ~10 s for 500 KB raw — so the interactive *shell* [app JS+CSS, ~90 KB gzip] loads well under budget; the evaluator WASM now overlaps the mint network and is SW-cached on repeat loads), and the note that fully-lazy evaluator is a deferred follow-up (F3). Keep it factual.
- [ ] **Step 5: Commit.** `git add web-viewer/src/app/App.tsx web-viewer/src/app/App.test.tsx web-viewer/PERF.md && git commit -m "perf(web-viewer): overlap evaluator WASM load with the mint round-trip (PERF-01) + budget doc"`

---

### Task 4: PWA shell + manifest serving

**Files:** modify `vite.config.ts`, `src/app/main.tsx`, `index.html`, `package.json`; create `public/manifest.webmanifest`, `public/icon.svg`, `public/manifest.json`.

- [ ] **Step 1: dep.** `npm install -D vite-plugin-pwa@^0.21` (or latest 0.x compatible with Vite 6). Confirm devDependency.
- [ ] **Step 2: icon + manifests.** `public/icon.svg` (a simple mark):

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" rx="96" fill="#1a5fb4"/><path d="M150 256l70 70 142-142" fill="none" stroke="#fff" stroke-width="40" stroke-linecap="round" stroke-linejoin="round"/></svg>
```

`public/manifest.webmanifest`:

```json
{
  "name": "Behaverse Questionnaire Viewer",
  "short_name": "Questionnaire",
  "description": "Complete a research questionnaire.",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#1a5fb4",
  "icons": [{ "src": "/icon.svg", "sizes": "any", "type": "image/svg+xml", "purpose": "any maskable" }]
}
```

`public/manifest.json` — copy the repo's `web-viewer/manifest.json` (the Schema 7 conformance manifest) verbatim so it's served at `/manifest.json`. (Use `cp manifest.json public/manifest.json`. The two manifests are different files: `.webmanifest` = PWA install; `manifest.json` = Schema 7.)

- [ ] **Step 3: index.html** — add inside `<head>`: `<link rel="manifest" href="/manifest.webmanifest" />` and `<meta name="theme-color" content="#1a5fb4" />` and `<link rel="icon" href="/icon.svg" />`.
- [ ] **Step 4: vite.config.ts** — add the PWA plugin (it only activates on `build`; vitest ignores it). Import `VitePWA` and add to plugins:

```ts
import { VitePWA } from 'vite-plugin-pwa'
// in the first defineConfig plugins array, alongside react():
VitePWA({
  registerType: 'autoUpdate',
  injectRegister: null,            // we call registerSW manually in main.tsx
  manifest: false,                 // use our static public/manifest.webmanifest
  workbox: {
    globPatterns: ['**/*.{js,css,html,wasm,svg}'],
    maximumFileSizeToCacheInBytes: 4_000_000,           // the 1 MB WASM must fit
    runtimeCaching: [{
      urlPattern: ({ url }) => url.pathname.startsWith('/v1/'),   // VS API → never cache
      handler: 'NetworkOnly',
    }],
  },
}),
```

(If `VitePWA` typed-plugin clashes with the `react() as never` cast in the merged vitest config, cast it similarly: `VitePWA({...}) as never`. Report what you did.)

- [ ] **Step 5: main.tsx registerSW** — production-guarded:

```tsx
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  import('virtual:pwa-register').then(({ registerSW }) => registerSW({ immediate: true })).catch(() => {})
}
```

(`virtual:pwa-register` is provided by vite-plugin-pwa at build; the dynamic import + PROD guard keeps vitest/dev from resolving it. Add `/// <reference types="vite-plugin-pwa/client" />` to a `.d.ts` — e.g. `src/vite-env.d.ts` if present, else `src/logic/wasm-ambient.d.ts` — if `import.meta.env.PROD` or the virtual module trips typecheck. Report.)

- [ ] **Step 6: build-output test** — `tests/lib/` is excluded; add a node-env test `tests/lib/pwa-build.test.ts` (under the already-excluded dir, run via `test:lib` OR a new check) — SIMPLER: a step in verification, not a vitest test. Make it a shell assertion in Step 7. (Avoid a vitest test that depends on a prior build.)
- [ ] **Step 7: Build + verify the PWA output.** `. "$HOME/.cargo/env" && npm run build`. Assert the output: `ls dist/ | grep -E "manifest.webmanifest|manifest.json|sw.js|workbox"` shows the webmanifest, the Schema 7 manifest.json, and a service worker (`sw.js` + a `workbox-*.js`). `grep -l "\.wasm" dist/sw.js` (or the precache manifest) confirms the WASM is precached. `npm test` (default, 167+) still green; `npm run typecheck` clean.
- [ ] **Step 8: Commit.** `git add web-viewer/vite.config.ts web-viewer/src/app/main.tsx web-viewer/index.html web-viewer/public web-viewer/package.json web-viewer/package-lock.json && git commit -m "feat(web-viewer): PWA shell (installable webmanifest + Workbox SW precaching shell+WASM) + serve Schema 7 manifest at /manifest.json"`

---

### Task 5: Docs + verification + live smoke + merge

**Files:** modify `web-viewer/README.md`, `web-viewer/FOLLOWUPS.md`.

- [ ] **Step 1: README** — add a "## Distribution (WV-F)" section: the renderer library (`npm run build:lib` → `dist-lib/`; consumed by the Editor preview via `@behaverse/questionnaire-renderer` per OD-03; import the JS + `renderer/style.css`); iframe embedding (host listens for `behaverse:loaded`/`completed`/`resize`; optional `?embed_origin=` to restrict the target origin — include a 6-line host snippet); the PWA (installable; SW precaches the shell + WASM; offline reality: a loaded session survives reload + submits-when-back-online via the WV-B/E queue, but a *first* visit needs the network to mint); the Schema 7 manifest served at `/manifest.json` (register with the VS); the PERF-01 budget (link PERF.md). Mark the WV-A..F decomposition COMPLETE.
- [ ] **Step 2: FOLLOWUPS** — append: fully-lazy evaluator load (F3 follow-up); npm publish of `@behaverse/questionnaire-renderer` at the repo split (local-path until then); offline-first mint is out of scope (Native viewer's domain); renderer-lib CSS ships precompiled — if the Editor's own Tailwind already generates the classes, it can skip `renderer/style.css`; PWA icons are a single SVG (swap for PNG set if store-install polish is wanted).
- [ ] **Step 3: Full verification** (paste tails):

```bash
( cd web-viewer && npm test && npm run typecheck )
( cd web-viewer && npm run build:lib && npm run test:lib )          # renderer lib + smoke
. "$HOME/.cargo/env" && ( cd web-viewer && npm run build )          # full build: PWA SW + webmanifest + Schema7 manifest + wasm
ls web-viewer/dist | grep -E "manifest.webmanifest|manifest.json|sw.js|workbox|\.wasm"
```

- [ ] **Step 4: Live smoke** (extends WV-E's; serve the built `dist/` statically — no VS needed for these checks). `( cd web-viewer && npx vite preview --port 4174 & )` ; sleep 2. Drive chromium (playwright from `library-web/`; write `library-web/wvf_smoke.mjs`):
  - `page.goto('http://localhost:4174/?fixture=mini')` — confirm the viewer loads from the built bundle (the welcome text shows). Screenshot.
  - Assert the **PWA manifest** is linked + fetchable: `page.evaluate(() => fetch('/manifest.webmanifest').then(r => r.ok))` → true; and `/manifest.json` (Schema 7) fetchable → true.
  - Assert the **service worker** registers: reload once, then `page.evaluate(() => navigator.serviceWorker.getRegistrations().then(r => r.length))` → ≥1 (SW active). (Vite preview serves over http on localhost — SW is allowed on localhost.)
  - **iframe events**: load a tiny host page that embeds `http://localhost:4174/?fixture=mini` in an iframe and listens for `behaverse:loaded`; assert the host received it. (Write a minimal host HTML to /tmp, serve it via the same preview origin or a second static server, OR use `page.setContent` with an iframe pointing at the preview URL + a message listener.)
  Record honestly; if SW/iframe checks are flaky under headless preview, note it and rely on the build-output assertions + unit tests. Delete the smoke script after. Cleanup: kill the preview server, rm the smoke script + any /tmp host file.
- [ ] **Step 5: Commit.** `git add web-viewer/README.md web-viewer/FOLLOWUPS.md && git commit -m "docs(web-viewer): WV-F distribution docs; live smoke recorded — Web Viewer WV-A..F COMPLETE"`
- [ ] **Step 6: Merge.** Use superpowers:finishing-a-development-branch — re-run Step 3, merge `wv-f-web-viewer` to `master` `--no-ff` (`Merge wv-f-web-viewer: Web Viewer WV-F (renderer library, PERF-01, iframe, PWA) — Web Viewer COMPLETE`), push, delete branch.

---

## Self-review notes (done at planning time)

- **Spec coverage:** §2 renderer-lib → T1 (build + dts + CSS + exports + smoke); §3 PERF-01 → T3 (overlap + PERF.md); §4 iframe → T2 (embed.ts + App wiring); §5 PWA → T4 (vite-plugin-pwa + webmanifest + SW + registerSW); §6 manifest publication → T4 (public/manifest.json). §8 testing → lib-smoke T1, embed units T2, boot-overlap T3, PWA build-output T4/T7, live smoke T5. F1 (lib now) → T1; F2 (PWA installable+cache, not offline-mint) → T4 + docs; F3 (overlap not lazy) → T3; F4 (outbound events + embed_origin) → T2; F5 (manifest at origin) → T4.
- **Type consistency:** `HostEvent` defined in T2 used in App wiring; the renderer lib re-exports the SAME `StepRenderer`/types the app uses (no divergence — it's the same source); `loadEvaluator`/`makeFakeEvaluator` reused in T3 test as already imported.
- **Known judgment calls / risks:** (a) the lib dts entry path (`dist-lib/lib.d.ts` vs `index.d.ts`) depends on what `tsc` emits — T1 Step 5 says verify + point `exports.types` at the real path. (b) lib-smoke imports the BUILT artifact, so it lives under the vitest-excluded `tests/lib/` and runs only via `test:lib` after `build:lib`. (c) `virtual:pwa-register` + `import.meta.env.PROD` must not break vitest/typecheck — T4 Step 5 guards with PROD + dynamic import + a client types reference. (d) `VitePWA` plugin in the merged vitest config is build-only (vitest ignores it); cast `as never` if the plugin-type union complains (matches the existing `react() as never`). (e) the App test file already mocks `../logic/evaluator` — the T3 overlap test must cooperate with that mock (assert call order or fall back to no-regression; T3 Step 1 notes this).
