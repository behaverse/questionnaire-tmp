# Editor ED-A (Shell + Canonical Model + Structure Tree) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `editor/` — a static React SPA that opens/creates/loads/saves a canonical Schema 2 questionnaire, lets the author restructure it (blocks, pages, sections, item/message reorder) through a 3-pane UI, validates it in-browser, and round-trips it Schema-2-valid.

**Architecture:** Layered. A pure-TS **canonical model layer** (parse/serialize, path addressing, tree operations, Ajv validation) with no React, exhaustively unit-tested. A **Zustand+Immer store** holds the model + UI state. A **persistence layer** (IndexedDB autosave, file open/save, Library read client). A **3-pane UI** (Topbar · StructureTree · Canvas · Inspector) subscribing to the store. Canonical references are kept intact (never resolved); reusable-entity bodies are never fetched in ED-A — items render as ref chips.

**Tech Stack:** Vite 6 · React 19 · TypeScript 5.7 · Tailwind 3.4 · Zustand + Immer · dnd-kit · Ajv 8 (ajv/dist/2020) + ajv-formats · vitest + React Testing Library + fake-indexeddb · Playwright chromium (smoke). Mirrors `web-viewer/` conventions.

**Spec:** [docs/superpowers/specs/2026-06-14-editor-ed-a-design.md](../specs/2026-06-14-editor-ed-a-design.md)

**Key facts pinned during planning:**
- Schema 2 lives at `schemas/questionnaire/schema.json` (`$id` `…/questionnaire/v26.0609/schema.json`); it `$ref`s exactly one other schema: `schemas/instrument/schema.json` (`…/instrument/v26.0609/schema.json`). Browser Ajv must register the instrument schema by `$id`, then compile the questionnaire schema.
- Real example questionnaires exist at `schemas/questionnaire/examples/{minimal,phq9,kitchensink}.json` — used as round-trip fixtures.
- Canonical structure: top-level `{metadata, pages[], blocks?[], style?, flow?, logic?, scores?, validation?, ...}`. `Block = {id, page_ids[], title?, style?, ...}` (groups pages **by id reference**; pages stay in top-level `pages[]`). `Page = {id, elements[], title?, style?, ...}`. `PageElement` = Section | saved-Item-ref (`{ref:"it_…@v…", required?, show_if?}`) | inline-Item (`{question, option, required?, show_if?}`) | Message-ref (`{ref:"msg_…@v…"}`). `Section = {id, elements[], title?, shared_option?, ...}`.
- Run tests from `editor/`: `cd editor && npx vitest run <path>`. Full suite: `cd editor && npm test`. Build gate: `cd editor && npm run build`.

---

## Task 1: Scaffold the `editor/` SPA

**Files:**
- Create: `editor/package.json`, `editor/index.html`, `editor/tsconfig.json`, `editor/tsconfig.node.json`, `editor/tsconfig.test.json`, `editor/vite.config.ts`, `editor/tailwind.config.ts`, `editor/postcss.config.js`, `editor/.gitignore`
- Create: `editor/src/main.tsx`, `editor/src/index.css`, `editor/src/vitest.setup.ts`
- Create: `editor/src/app/App.tsx`, `editor/src/app/App.test.tsx`

- [ ] **Step 1: Write `editor/package.json`**

```json
{
  "name": "questionnaire-editor",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "typecheck": "tsc -b",
    "preview": "vite preview --port 4175",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "@dnd-kit/core": "^6.3.1",
    "@dnd-kit/sortable": "^10.0.0",
    "@dnd-kit/utilities": "^3.2.2",
    "ajv": "^8.17.0",
    "ajv-formats": "^3.0.0",
    "immer": "^10.1.1",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "zustand": "^5.0.2"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/react": "^16.1.0",
    "@testing-library/user-event": "^14.5.2",
    "@types/node": "^22.10.2",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^4.3.4",
    "autoprefixer": "^10.4.20",
    "fake-indexeddb": "^6.0.0",
    "jsdom": "^25.0.1",
    "postcss": "^8.4.49",
    "tailwindcss": "^3.4.17",
    "typescript": "^5.7.2",
    "vite": "^6.0.5",
    "vitest": "^2.1.8"
  }
}
```

- [ ] **Step 2: Write the config files**

`editor/tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "types": []
  },
  "include": ["src"],
  "exclude": ["src/**/*.test.ts", "src/**/*.test.tsx", "src/vitest.setup.ts"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

`editor/tsconfig.node.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2023"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "noEmit": true,
    "strict": true,
    "types": ["node"]
  },
  "include": ["vite.config.ts", "tailwind.config.ts"]
}
```

`editor/tsconfig.test.json`:
```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": { "types": ["node", "vitest/globals", "@testing-library/jest-dom"] },
  "include": ["src"],
  "exclude": []
}
```

`editor/vite.config.ts`:
```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/vitest.setup.ts'],
    css: false,
    exclude: ['tests/e2e/**', 'node_modules/**'],
  },
})
```

`editor/tailwind.config.ts`:
```ts
import type { Config } from 'tailwindcss'
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: { extend: {} },
  plugins: [],
} satisfies Config
```

`editor/postcss.config.js`:
```js
export default { plugins: { tailwindcss: {}, autoprefixer: {} } }
```

`editor/.gitignore`:
```
node_modules
dist
dist-lib
*.local
.vite
tests/e2e/screenshots
```

`editor/index.html`:
```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Questionnaire Editor</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 3: Write the entry + styles + test setup**

`editor/src/index.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root { color-scheme: light; }
html, body, #root { height: 100%; margin: 0; }
body { font-family: ui-sans-serif, system-ui, sans-serif; }
```

`editor/src/main.tsx`:
```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './app/App'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

`editor/src/vitest.setup.ts`:
```ts
import '@testing-library/jest-dom/vitest'
```

- [ ] **Step 4: Write the failing App test**

`editor/src/app/App.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react'
import { App } from './App'

test('renders the editor heading', () => {
  render(<App />)
  expect(screen.getByRole('heading', { name: /questionnaire editor/i })).toBeInTheDocument()
})
```

- [ ] **Step 5: Run it, verify it fails**

Run: `cd editor && npm install && npx vitest run src/app/App.test.tsx`
Expected: FAIL — cannot resolve `./App`.

- [ ] **Step 6: Write the minimal App**

`editor/src/app/App.tsx`:
```tsx
export function App() {
  return (
    <main className="flex h-full items-center justify-center text-slate-700">
      <h1 className="text-2xl font-semibold">Questionnaire Editor</h1>
    </main>
  )
}
```

- [ ] **Step 7: Run test + build**

Run: `cd editor && npx vitest run src/app/App.test.tsx && npm run build`
Expected: test PASS; build emits `dist/` with no TS errors.

- [ ] **Step 8: Commit**

```bash
git add editor/
git commit -m "feat(editor): scaffold ED-A SPA (Vite+React19+TS+Tailwind+vitest)"
```

---

## Task 2: Fixtures + canonical model types

**Files:**
- Create: `editor/src/__fixtures__/minimal.json`, `editor/src/__fixtures__/phq9.json`, `editor/src/__fixtures__/kitchensink.json` (copied from `schemas/questionnaire/examples/`)
- Create: `editor/src/model/types.ts`
- Test: `editor/src/model/types.test.ts`

- [ ] **Step 1: Copy the real example questionnaires as fixtures**

Run:
```bash
mkdir -p editor/src/__fixtures__
cp schemas/questionnaire/examples/minimal.json editor/src/__fixtures__/minimal.json
cp schemas/questionnaire/examples/phq9.json editor/src/__fixtures__/phq9.json
cp schemas/questionnaire/examples/kitchensink.json editor/src/__fixtures__/kitchensink.json
```

- [ ] **Step 2: Write the failing type/shape test**

`editor/src/model/types.test.ts`:
```ts
import phq9 from '../__fixtures__/phq9.json'
import type { Questionnaire } from './types'

test('fixture conforms to the Questionnaire structural type', () => {
  const q = phq9 as Questionnaire
  expect(q.metadata.id).toMatch(/^qst_/)
  expect(Array.isArray(q.pages)).toBe(true)
  expect(q.pages[0].elements.length).toBeGreaterThan(0)
})
```

- [ ] **Step 3: Run it, verify it fails**

Run: `cd editor && npx vitest run src/model/types.test.ts`
Expected: FAIL — cannot resolve `./types`. (If JSON import errors, ensure `resolveJsonModule` is set — it is, from Task 1.)

- [ ] **Step 4: Write the structural types**

`editor/src/model/types.ts`:
```ts
// Loose structural mirror of canonical Schema 2 (refs kept intact). The schema
// is the source of truth for validation; these types exist for ergonomic editing.

export interface Metadata {
  id: string
  title?: string
  description?: string
  version?: string
  language?: string
  available_languages?: string[]
  [key: string]: unknown
}

export interface MessageRefElement { ref: string } // ref starts msg_ or it_
export interface SavedItemElement { ref: string; required?: boolean; show_if?: string; [k: string]: unknown }
export interface InlineItemElement { question: unknown; option: unknown; required?: boolean; show_if?: string; [k: string]: unknown }
export interface Section {
  id: string
  title?: string
  shared_option?: unknown
  elements: SectionElement[]
  show_if?: string
  style?: unknown
  [k: string]: unknown
}
export type SectionElement = MessageRefElement | SavedItemElement | InlineItemElement
export type PageElement = Section | SectionElement

export interface Page {
  id: string
  title?: string
  description?: string
  elements: PageElement[]
  style?: unknown
  flow?: unknown
  show_if?: string
  [k: string]: unknown
}

export interface Block {
  id: string
  title?: string
  page_ids: string[]
  style?: unknown
  show_if?: string
  [k: string]: unknown
}

export interface Questionnaire {
  '@context'?: string
  metadata: Metadata
  pages: Page[]
  blocks?: Block[]
  style?: unknown
  flow?: unknown
  [k: string]: unknown
}
```

- [ ] **Step 5: Run test, verify PASS**

Run: `cd editor && npx vitest run src/model/types.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add editor/src/__fixtures__ editor/src/model/types.ts editor/src/model/types.test.ts
git commit -m "feat(editor): canonical model types + real questionnaire fixtures"
```

---

## Task 3: In-browser validation (Ajv)

**Files:**
- Create: `editor/src/model/validation.ts`
- Test: `editor/src/model/validation.test.ts`

- [ ] **Step 1: Write the failing test**

`editor/src/model/validation.test.ts`:
```ts
import minimal from '../__fixtures__/minimal.json'
import phq9 from '../__fixtures__/phq9.json'
import kitchensink from '../__fixtures__/kitchensink.json'
import { validateQuestionnaire } from './validation'

test('real fixtures are Schema-2 valid', () => {
  for (const fx of [minimal, phq9, kitchensink]) {
    const { valid, errors } = validateQuestionnaire(fx)
    expect(errors).toEqual([])
    expect(valid).toBe(true)
  }
})

test('a missing required field is reported with a path', () => {
  const broken = { metadata: { id: 'qst_x' } } // no pages
  const { valid, errors } = validateQuestionnaire(broken)
  expect(valid).toBe(false)
  expect(errors.some((e) => /pages/.test(e.path) || /pages/.test(e.message))).toBe(true)
})
```

- [ ] **Step 2: Run it, verify it fails**

Run: `cd editor && npx vitest run src/model/validation.test.ts`
Expected: FAIL — cannot resolve `./validation`.

- [ ] **Step 3: Write the validation module**

Schema 2 `$ref`s the instrument schema by absolute `$id`. We import both JSONs (Vite resolves the `../../../schemas/...` path at build, and vitest resolves it at test time), register the instrument schema under its `$id`, then compile the questionnaire schema.

`editor/src/model/validation.ts`:
```ts
import Ajv2020 from 'ajv/dist/2020'
import addFormats from 'ajv-formats'
import questionnaireSchema from '../../../schemas/questionnaire/schema.json'
import instrumentSchema from '../../../schemas/instrument/schema.json'

export interface ValidationError { path: string; message: string }

const ajv = new Ajv2020({ strict: false, allErrors: true })
addFormats(ajv)
ajv.addSchema(instrumentSchema as object) // registered by its own $id
const validateFn = ajv.compile(questionnaireSchema as object)

export function validateQuestionnaire(obj: unknown): { valid: boolean; errors: ValidationError[] } {
  const valid = validateFn(obj) as boolean
  const errors: ValidationError[] = (validateFn.errors ?? []).map((e) => ({
    path: e.instancePath || '/',
    message: `${e.instancePath || '(root)'} ${e.message ?? 'is invalid'}`.trim(),
  }))
  return { valid, errors }
}
```

- [ ] **Step 4: Run test, verify PASS**

Run: `cd editor && npx vitest run src/model/validation.test.ts`
Expected: PASS. If the fixtures fail validation, do NOT relax the schema — re-check that the instrument schema is registered before compile and that both JSON imports resolve (log `ajv.errors`).

- [ ] **Step 5: Commit**

```bash
git add editor/src/model/validation.ts editor/src/model/validation.test.ts
git commit -m "feat(editor): in-browser Schema-2 validation via Ajv"
```

---

## Task 4: Parse / serialize + round-trip

**Files:**
- Create: `editor/src/model/serialize.ts`
- Test: `editor/src/model/serialize.test.ts`

- [ ] **Step 1: Write the failing test**

`editor/src/model/serialize.test.ts`:
```ts
import phq9 from '../__fixtures__/phq9.json'
import kitchensink from '../__fixtures__/kitchensink.json'
import { parseQuestionnaire, serializeQuestionnaire } from './serialize'

test('parse then serialize round-trips deep-equal (refs intact)', () => {
  for (const fx of [phq9, kitchensink]) {
    const text = JSON.stringify(fx)
    const model = parseQuestionnaire(text)
    const out = serializeQuestionnaire(model)
    expect(JSON.parse(out)).toEqual(fx)
  }
})

test('parse rejects invalid JSON', () => {
  expect(() => parseQuestionnaire('{not json')).toThrow()
})
```

- [ ] **Step 2: Run it, verify it fails**

Run: `cd editor && npx vitest run src/model/serialize.test.ts`
Expected: FAIL — cannot resolve `./serialize`.

- [ ] **Step 3: Write the module**

`editor/src/model/serialize.ts`:
```ts
import type { Questionnaire } from './types'

export function parseQuestionnaire(text: string): Questionnaire {
  const obj = JSON.parse(text) // throws on malformed JSON
  if (typeof obj !== 'object' || obj === null || !('metadata' in obj)) {
    throw new Error('Not a questionnaire: missing "metadata"')
  }
  return obj as Questionnaire
}

export function serializeQuestionnaire(model: Questionnaire): string {
  return JSON.stringify(model, null, 2)
}
```

- [ ] **Step 4: Run test, verify PASS**

Run: `cd editor && npx vitest run src/model/serialize.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add editor/src/model/serialize.ts editor/src/model/serialize.test.ts
git commit -m "feat(editor): parse/serialize with deep-equal round-trip"
```

---

## Task 5: Path addressing + node-kind helpers

The model is edited via **paths** — arrays into the JSON, e.g. `['pages', 2, 'elements', 0]`. Editable array containers are: `pages`, `blocks`, a page's `elements`, a section's `elements`.

**Files:**
- Create: `editor/src/model/path.ts`
- Test: `editor/src/model/path.test.ts`

- [ ] **Step 1: Write the failing test**

`editor/src/model/path.test.ts`:
```ts
import phq9 from '../__fixtures__/phq9.json'
import type { Questionnaire } from './types'
import { getAtPath, getContainer, nodeKind, pathKey } from './path'

const q = phq9 as Questionnaire

test('getAtPath resolves a page and an element', () => {
  expect(getAtPath(q, ['pages', 0])).toBe(q.pages[0])
  expect(getAtPath(q, ['pages', 0, 'elements', 0])).toBe(q.pages[0].elements[0])
})

test('getContainer returns the parent array for an item path', () => {
  expect(getContainer(q, ['pages', 0, 'elements', 0])).toBe(q.pages[0].elements)
  expect(getContainer(q, ['pages', 0])).toBe(q.pages)
})

test('nodeKind classifies nodes', () => {
  expect(nodeKind(q, ['pages', 0])).toBe('page')
  const el = q.pages[0].elements[0] as Record<string, unknown>
  const expected = 'elements' in el ? 'section' : el.ref ? (String(el.ref).startsWith('msg_') ? 'message' : 'item') : 'item'
  expect(nodeKind(q, ['pages', 0, 'elements', 0])).toBe(expected)
})

test('pathKey is stable for a given path', () => {
  expect(pathKey(['pages', 0, 'elements', 1])).toBe('pages.0.elements.1')
})
```

- [ ] **Step 2: Run it, verify it fails**

Run: `cd editor && npx vitest run src/model/path.test.ts`
Expected: FAIL — cannot resolve `./path`.

- [ ] **Step 3: Write the module**

`editor/src/model/path.ts`:
```ts
import type { Questionnaire } from './types'

export type NodePath = (string | number)[]
export type NodeKind = 'questionnaire' | 'block' | 'page' | 'section' | 'item' | 'message'

export function getAtPath(root: unknown, path: NodePath): unknown {
  let cur: unknown = root
  for (const seg of path) {
    if (cur == null) return undefined
    cur = (cur as Record<string | number, unknown>)[seg]
  }
  return cur
}

/** The array that directly contains the node at `path` (path's last seg is its index). */
export function getContainer(root: unknown, path: NodePath): unknown[] {
  const parent = getAtPath(root, path.slice(0, -1))
  if (!Array.isArray(parent)) throw new Error(`No array container for path ${pathKey(path)}`)
  return parent as unknown[]
}

export function nodeKind(root: Questionnaire, path: NodePath): NodeKind {
  if (path.length === 0) return 'questionnaire'
  if (path[0] === 'blocks') return 'block'
  if (path[0] === 'pages' && path.length === 2) return 'page'
  const node = getAtPath(root, path) as Record<string, unknown> | undefined
  if (!node) throw new Error(`No node at ${pathKey(path)}`)
  if ('elements' in node) return 'section'
  const ref = node.ref
  if (typeof ref === 'string') return ref.startsWith('msg_') ? 'message' : 'item'
  return 'item' // inline item (question+option)
}

export function pathKey(path: NodePath): string {
  return path.join('.')
}
```

- [ ] **Step 4: Run test, verify PASS**

Run: `cd editor && npx vitest run src/model/path.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add editor/src/model/path.ts editor/src/model/path.test.ts
git commit -m "feat(editor): path addressing + node-kind helpers"
```

---

## Task 6: Tree operations (pure, Immer-based)

**Files:**
- Create: `editor/src/model/tree.ts`
- Test: `editor/src/model/tree.test.ts`

All ops are pure: `(model, ...) => newModel` using Immer's `produce`. They never mutate the input. Moves are allowed only between compatible containers (`pages`↔`pages`, element-arrays↔element-arrays); incompatible moves throw.

- [ ] **Step 1: Write the failing tests**

`editor/src/model/tree.test.ts`:
```ts
import phq9 from '../__fixtures__/phq9.json'
import type { Questionnaire, Page } from './types'
import { reorder, deleteNode, moveNode, insertNode, updateNodeProps, updateMetadata,
         createBlock, deleteBlock, setBlockPages } from './tree'
import { getAtPath } from './path'

const base = () => JSON.parse(JSON.stringify(phq9)) as Questionnaire

test('reorder swaps two pages without mutating input', () => {
  const q = base()
  const firstId = q.pages[0].id
  const next = reorder(q, ['pages'], 0, 1)
  expect(next.pages[1].id).toBe(firstId)
  expect(q.pages[0].id).toBe(firstId) // input untouched
})

test('deleteNode removes an element', () => {
  const q = base()
  const before = q.pages[0].elements.length
  const next = deleteNode(q, ['pages', 0, 'elements', 0])
  expect(next.pages[0].elements.length).toBe(before - 1)
})

test('moveNode moves an element across pages', () => {
  const q = base()
  if (q.pages.length < 2) return
  const moved = q.pages[0].elements[0]
  const next = moveNode(q, ['pages', 0, 'elements', 0], ['pages', 1, 'elements'], 0)
  expect(next.pages[1].elements[0]).toEqual(moved)
})

test('moveNode rejects incompatible containers', () => {
  const q = base()
  expect(() => moveNode(q, ['pages', 0, 'elements', 0], ['pages'], 0)).toThrow()
})

test('insertNode adds a new empty page', () => {
  const q = base()
  const before = q.pages.length
  const newPage: Page = { id: 'page_new', elements: [{ ref: 'msg_placeholder@v26.0609' }] }
  const next = insertNode(q, ['pages'], before, newPage)
  expect(next.pages.length).toBe(before + 1)
  expect(next.pages[before].id).toBe('page_new')
})

test('updateNodeProps patches a page title', () => {
  const q = base()
  const next = updateNodeProps(q, ['pages', 0], { title: 'Renamed' })
  expect((getAtPath(next, ['pages', 0]) as Page).title).toBe('Renamed')
})

test('updateMetadata patches metadata', () => {
  const q = base()
  const next = updateMetadata(q, { title: 'New Title' })
  expect(next.metadata.title).toBe('New Title')
})

test('block lifecycle: create, set pages, delete', () => {
  const q = base()
  const withBlock = createBlock(q, { id: 'blk_1', title: 'Part 1', page_ids: [] })
  expect(withBlock.blocks?.[0].id).toBe('blk_1')
  const assigned = setBlockPages(withBlock, 'blk_1', [q.pages[0].id])
  expect(assigned.blocks?.[0].page_ids).toEqual([q.pages[0].id])
  const removed = deleteBlock(assigned, 'blk_1')
  expect(removed.blocks?.length ?? 0).toBe(0)
})
```

- [ ] **Step 2: Run it, verify it fails**

Run: `cd editor && npx vitest run src/model/tree.test.ts`
Expected: FAIL — cannot resolve `./tree`.

- [ ] **Step 3: Write the module**

`editor/src/model/tree.ts`:
```ts
import { produce } from 'immer'
import type { Questionnaire, Block, Metadata } from './types'
import { getAtPath, getContainer, type NodePath, pathKey } from './path'

/** Two element-array paths are compatible; both `pages` arrays are compatible. */
function compatible(a: NodePath, b: NodePath): boolean {
  const lastA = a[a.length - 1]
  const lastB = b[b.length - 1]
  if (lastA === 'pages' && lastB === 'pages') return true
  if (lastA === 'blocks' && lastB === 'blocks') return true
  if (lastA === 'elements' && lastB === 'elements') return true
  return false
}

export function reorder(model: Questionnaire, containerPath: NodePath, from: number, to: number): Questionnaire {
  return produce(model, (draft) => {
    const arr = getAtPath(draft, containerPath) as unknown[]
    const [moved] = arr.splice(from, 1)
    arr.splice(to, 0, moved)
  })
}

export function deleteNode(model: Questionnaire, path: NodePath): Questionnaire {
  return produce(model, (draft) => {
    const arr = getContainer(draft, path)
    arr.splice(Number(path[path.length - 1]), 1)
  })
}

export function insertNode(model: Questionnaire, containerPath: NodePath, index: number, node: unknown): Questionnaire {
  return produce(model, (draft) => {
    let arr = getAtPath(draft, containerPath) as unknown[] | undefined
    if (arr === undefined) {
      // create the container (e.g. first block)
      ;(draft as Record<string, unknown>)[containerPath[containerPath.length - 1] as string] = []
      arr = getAtPath(draft, containerPath) as unknown[]
    }
    arr.splice(index, 0, node)
  })
}

export function moveNode(model: Questionnaire, fromPath: NodePath, toContainerPath: NodePath, toIndex: number): Questionnaire {
  const fromContainerPath = fromPath.slice(0, -1)
  if (!compatible(fromContainerPath, toContainerPath)) {
    throw new Error(`Incompatible move: ${pathKey(fromContainerPath)} -> ${pathKey(toContainerPath)}`)
  }
  return produce(model, (draft) => {
    const src = getContainer(draft, fromPath)
    const [moved] = src.splice(Number(fromPath[fromPath.length - 1]), 1)
    const dst = getAtPath(draft, toContainerPath) as unknown[]
    dst.splice(toIndex, 0, moved)
  })
}

export function updateNodeProps(model: Questionnaire, path: NodePath, patch: Record<string, unknown>): Questionnaire {
  return produce(model, (draft) => {
    const node = getAtPath(draft, path) as Record<string, unknown>
    Object.assign(node, patch)
  })
}

export function updateMetadata(model: Questionnaire, patch: Partial<Metadata>): Questionnaire {
  return produce(model, (draft) => {
    Object.assign(draft.metadata, patch)
  })
}

export function createBlock(model: Questionnaire, block: Block): Questionnaire {
  return produce(model, (draft) => {
    if (!draft.blocks) draft.blocks = []
    draft.blocks.push(block)
  })
}

export function deleteBlock(model: Questionnaire, blockId: string): Questionnaire {
  return produce(model, (draft) => {
    if (!draft.blocks) return
    draft.blocks = draft.blocks.filter((b) => b.id !== blockId)
  })
}

export function setBlockPages(model: Questionnaire, blockId: string, pageIds: string[]): Questionnaire {
  return produce(model, (draft) => {
    const block = draft.blocks?.find((b) => b.id === blockId)
    if (block) block.page_ids = pageIds
  })
}
```

- [ ] **Step 4: Run test, verify PASS**

Run: `cd editor && npx vitest run src/model/tree.test.ts`
Expected: PASS (the cross-page move test no-ops cleanly if phq9 has one page; kitchensink has several — add a `kitchensink` variant if you want a guaranteed multi-page move, optional).

- [ ] **Step 5: Commit**

```bash
git add editor/src/model/tree.ts editor/src/model/tree.test.ts
git commit -m "feat(editor): pure Immer-based tree operations + block lifecycle"
```

---

## Task 7: Zustand store

**Files:**
- Create: `editor/src/state/store.ts`
- Test: `editor/src/state/store.test.ts`

- [ ] **Step 1: Write the failing test**

`editor/src/state/store.test.ts`:
```ts
import phq9 from '../__fixtures__/phq9.json'
import type { Questionnaire } from '../model/types'
import { useEditorStore } from './store'

beforeEach(() => useEditorStore.getState().reset())

test('loadModel sets model, marks clean, validates', () => {
  useEditorStore.getState().loadModel(phq9 as Questionnaire, { kind: 'file', name: 'phq9.json' })
  const s = useEditorStore.getState()
  expect(s.model?.metadata.id).toMatch(/^qst_/)
  expect(s.dirty).toBe(false)
  expect(s.validation?.valid).toBe(true)
})

test('editing marks dirty and re-validates', () => {
  const st = useEditorStore.getState()
  st.loadModel(phq9 as Questionnaire, { kind: 'file', name: 'phq9.json' })
  st.applyEdit((m) => ({ ...m, metadata: { ...m.metadata, title: 'X' } }))
  const s = useEditorStore.getState()
  expect(s.dirty).toBe(true)
  expect(s.model?.metadata.title).toBe('X')
})

test('select sets the selection path', () => {
  const st = useEditorStore.getState()
  st.loadModel(phq9 as Questionnaire, { kind: 'file', name: 'phq9.json' })
  st.select(['pages', 0])
  expect(useEditorStore.getState().selection).toEqual(['pages', 0])
})
```

- [ ] **Step 2: Run it, verify it fails**

Run: `cd editor && npx vitest run src/state/store.test.ts`
Expected: FAIL — cannot resolve `./store`.

- [ ] **Step 3: Write the store**

`editor/src/state/store.ts`:
```ts
import { create } from 'zustand'
import type { Questionnaire } from '../model/types'
import type { NodePath } from '../model/path'
import { validateQuestionnaire, type ValidationError } from '../model/validation'

export type Source = { kind: 'new' } | { kind: 'file'; name: string } | { kind: 'library'; id: string; version: string }

interface EditorState {
  model: Questionnaire | null
  source: Source | null
  selection: NodePath | null
  expanded: Record<string, boolean>
  dirty: boolean
  validation: { valid: boolean; errors: ValidationError[] } | null
  loadModel: (model: Questionnaire, source: Source) => void
  applyEdit: (fn: (model: Questionnaire) => Questionnaire) => void
  select: (path: NodePath | null) => void
  toggleExpanded: (key: string) => void
  markSaved: () => void
  reset: () => void
}

export const useEditorStore = create<EditorState>((set, get) => ({
  model: null,
  source: null,
  selection: null,
  expanded: {},
  dirty: false,
  validation: null,
  loadModel: (model, source) =>
    set({ model, source, selection: null, dirty: false, validation: validateQuestionnaire(model) }),
  applyEdit: (fn) => {
    const cur = get().model
    if (!cur) return
    const next = fn(cur)
    set({ model: next, dirty: true, validation: validateQuestionnaire(next) })
  },
  select: (path) => set({ selection: path }),
  toggleExpanded: (key) => set((s) => ({ expanded: { ...s.expanded, [key]: !s.expanded[key] } })),
  markSaved: () => set({ dirty: false }),
  reset: () => set({ model: null, source: null, selection: null, expanded: {}, dirty: false, validation: null }),
}))
```

- [ ] **Step 4: Run test, verify PASS**

Run: `cd editor && npx vitest run src/state/store.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add editor/src/state/store.ts editor/src/state/store.test.ts
git commit -m "feat(editor): Zustand editor store (model + selection + validation)"
```

---

## Task 8: IndexedDB autosave persistence

**Files:**
- Create: `editor/src/persistence/indexeddb.ts`
- Test: `editor/src/persistence/indexeddb.test.ts`

- [ ] **Step 1: Write the failing test**

`editor/src/persistence/indexeddb.test.ts`:
```ts
import 'fake-indexeddb/auto'
import phq9 from '../__fixtures__/phq9.json'
import type { Questionnaire } from '../model/types'
import { saveDraft, loadDraft, clearDraft } from './indexeddb'

test('saveDraft then loadDraft returns the model', async () => {
  await saveDraft(phq9 as Questionnaire, { kind: 'file', name: 'phq9.json' })
  const draft = await loadDraft()
  expect(draft?.model.metadata.id).toBe((phq9 as Questionnaire).metadata.id)
  expect(draft?.source).toEqual({ kind: 'file', name: 'phq9.json' })
})

test('clearDraft removes it', async () => {
  await saveDraft(phq9 as Questionnaire, { kind: 'new' })
  await clearDraft()
  expect(await loadDraft()).toBeNull()
})
```

- [ ] **Step 2: Run it, verify it fails**

Run: `cd editor && npx vitest run src/persistence/indexeddb.test.ts`
Expected: FAIL — cannot resolve `./indexeddb`.

- [ ] **Step 3: Write the module**

`editor/src/persistence/indexeddb.ts`:
```ts
import type { Questionnaire } from '../model/types'
import type { Source } from '../state/store'

const DB_NAME = 'behaverse-editor'
const STORE = 'drafts'
const KEY = 'current'

export interface Draft { model: Questionnaire; source: Source; savedAt: number }

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(STORE)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function tx<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest): Promise<T> {
  const db = await open()
  return new Promise<T>((resolve, reject) => {
    const store = db.transaction(STORE, mode).objectStore(STORE)
    const req = fn(store)
    req.onsuccess = () => resolve(req.result as T)
    req.onerror = () => reject(req.error)
  })
}

export async function saveDraft(model: Questionnaire, source: Source): Promise<void> {
  const draft: Draft = { model, source, savedAt: Date.now() }
  await tx('readwrite', (s) => s.put(draft, KEY))
}

export async function loadDraft(): Promise<Draft | null> {
  const res = await tx<Draft | undefined>('readonly', (s) => s.get(KEY))
  return res ?? null
}

export async function clearDraft(): Promise<void> {
  await tx('readwrite', (s) => s.delete(KEY))
}
```

- [ ] **Step 4: Run test, verify PASS**

Run: `cd editor && npx vitest run src/persistence/indexeddb.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add editor/src/persistence/indexeddb.ts editor/src/persistence/indexeddb.test.ts
git commit -m "feat(editor): IndexedDB draft autosave/restore"
```

---

## Task 9: File I/O + Library read client

**Files:**
- Create: `editor/src/persistence/file.ts`
- Create: `editor/src/persistence/library.ts`
- Test: `editor/src/persistence/file.test.ts`, `editor/src/persistence/library.test.ts`

- [ ] **Step 1: Write the failing file-I/O test**

`editor/src/persistence/file.test.ts`:
```ts
import phq9 from '../__fixtures__/phq9.json'
import type { Questionnaire } from '../model/types'
import { readQuestionnaireFile, downloadFilename } from './file'

test('readQuestionnaireFile parses a File', async () => {
  const file = new File([JSON.stringify(phq9)], 'phq9.json', { type: 'application/json' })
  const model = await readQuestionnaireFile(file)
  expect(model.metadata.id).toBe((phq9 as Questionnaire).metadata.id)
})

test('downloadFilename derives from metadata id', () => {
  expect(downloadFilename(phq9 as Questionnaire)).toBe('qst_phq9.json')
})
```

- [ ] **Step 2: Run it, verify it fails**

Run: `cd editor && npx vitest run src/persistence/file.test.ts`
Expected: FAIL — cannot resolve `./file`.

- [ ] **Step 3: Write the file module**

`editor/src/persistence/file.ts`:
```ts
import type { Questionnaire } from '../model/types'
import { parseQuestionnaire, serializeQuestionnaire } from '../model/serialize'

export async function readQuestionnaireFile(file: File): Promise<Questionnaire> {
  const text = await file.text()
  return parseQuestionnaire(text)
}

export function downloadFilename(model: Questionnaire): string {
  const id = model.metadata?.id ?? 'questionnaire'
  return `${id}.json`
}

/** Browser-only: trigger a download of the serialized model. Not unit-tested (DOM side-effect). */
export function exportToFile(model: Questionnaire): void {
  const blob = new Blob([serializeQuestionnaire(model)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = downloadFilename(model)
  a.click()
  URL.revokeObjectURL(url)
}
```

- [ ] **Step 4: Run test, verify PASS**

Run: `cd editor && npx vitest run src/persistence/file.test.ts`
Expected: PASS.

- [ ] **Step 5: Write the failing Library-client test**

`editor/src/persistence/library.test.ts`:
```ts
import phq9 from '../__fixtures__/phq9.json'
import { fetchFromLibrary } from './library'

test('fetchFromLibrary requests the unresolved definition and parses it', async () => {
  const calls: string[] = []
  const fakeFetch = (async (url: string) => {
    calls.push(url)
    return { ok: true, json: async () => phq9, text: async () => JSON.stringify(phq9) } as Response
  }) as unknown as typeof fetch
  const model = await fetchFromLibrary('qst_phq9', 'v26.0609', { baseUrl: 'http://lib', fetchImpl: fakeFetch })
  expect(model.metadata.id).toBe('qst_phq9')
  expect(calls[0]).toContain('/v1/questionnaires/qst_phq9/versions/v26.0609/definition')
  expect(calls[0]).toContain('resolved=false')
})

test('fetchFromLibrary throws on 404', async () => {
  const fakeFetch = (async () => ({ ok: false, status: 404 } as Response)) as unknown as typeof fetch
  await expect(fetchFromLibrary('qst_missing', 'v1', { baseUrl: 'http://lib', fetchImpl: fakeFetch })).rejects.toThrow()
})
```

- [ ] **Step 6: Run it, verify it fails**

Run: `cd editor && npx vitest run src/persistence/library.test.ts`
Expected: FAIL — cannot resolve `./library`.

- [ ] **Step 7: Write the Library client**

`editor/src/persistence/library.ts`:
```ts
import type { Questionnaire } from '../model/types'

const DEFAULT_BASE = import.meta.env.VITE_LIBRARY_BASE_URL ?? 'https://questionnaire-library.vercel.app'

export interface FetchOpts { baseUrl?: string; fetchImpl?: typeof fetch }

export async function fetchFromLibrary(id: string, version: string, opts: FetchOpts = {}): Promise<Questionnaire> {
  const base = opts.baseUrl ?? DEFAULT_BASE
  const f = opts.fetchImpl ?? fetch
  const url = `${base}/v1/questionnaires/${id}/versions/${version}/definition?resolved=false`
  const res = await f(url)
  if (!res.ok) throw new Error(`Library fetch failed (${res.status}) for ${id}@${version}`)
  const obj = (await res.json()) as Questionnaire
  if (!obj?.metadata) throw new Error('Library returned a non-questionnaire payload')
  return obj
}
```

> NOTE: §7 of the spec flags this — verify against the live API that `resolved=false` returns refs-intact JSON. If the API only serves resolved form, keep this code (the param is harmless) and log a FOLLOWUPS entry; file-import still provides refs-intact content for the gate.

- [ ] **Step 8: Run test, verify PASS**

Run: `cd editor && npx vitest run src/persistence/library.test.ts`
Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add editor/src/persistence/file.ts editor/src/persistence/library.ts editor/src/persistence/file.test.ts editor/src/persistence/library.test.ts
git commit -m "feat(editor): file open/export + Library read client (unresolved defs)"
```

---

## Task 10: App shell + start screen + autosave wiring

**Files:**
- Modify: `editor/src/app/App.tsx`, `editor/src/app/App.test.tsx`
- Create: `editor/src/app/StartScreen.tsx`, `editor/src/app/Topbar.tsx`
- Create: `editor/src/app/StartScreen.test.tsx`

- [ ] **Step 1: Write the failing StartScreen test**

`editor/src/app/StartScreen.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StartScreen } from './StartScreen'

test('New creates an empty questionnaire', async () => {
  const onNew = vi.fn()
  render(<StartScreen onNew={onNew} onOpenFile={vi.fn()} onOpenLibrary={vi.fn()} />)
  await userEvent.click(screen.getByRole('button', { name: /new questionnaire/i }))
  expect(onNew).toHaveBeenCalled()
})

test('shows the three entry points', () => {
  render(<StartScreen onNew={vi.fn()} onOpenFile={vi.fn()} onOpenLibrary={vi.fn()} />)
  expect(screen.getByRole('button', { name: /new questionnaire/i })).toBeInTheDocument()
  expect(screen.getByText(/open file/i)).toBeInTheDocument()
  expect(screen.getByText(/open from library/i)).toBeInTheDocument()
})
```

- [ ] **Step 2: Run it, verify it fails**

Run: `cd editor && npx vitest run src/app/StartScreen.test.tsx`
Expected: FAIL — cannot resolve `./StartScreen`.

- [ ] **Step 3: Write StartScreen, Topbar, and a `newQuestionnaire()` helper**

`editor/src/model/scaffold.ts`:
```ts
import type { Questionnaire } from './types'

export function newQuestionnaire(): Questionnaire {
  return {
    '@context': 'https://behaverse.org/schemas/questionnaire/context.jsonld',
    metadata: { id: 'qst_untitled', title: 'Untitled questionnaire', version: 'v26.0609', language: 'en' },
    pages: [{ id: 'page_1', title: 'Page 1', elements: [{ ref: 'msg_placeholder@v26.0609' }] }],
  }
}
```

`editor/src/app/StartScreen.tsx`:
```tsx
import { useRef, useState } from 'react'

interface Props {
  onNew: () => void
  onOpenFile: (file: File) => void
  onOpenLibrary: (id: string, version: string) => void
}

export function StartScreen({ onNew, onOpenFile, onOpenLibrary }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [id, setId] = useState('')
  const [version, setVersion] = useState('')
  return (
    <main className="mx-auto flex h-full max-w-2xl flex-col justify-center gap-6 p-8">
      <h1 className="text-3xl font-semibold text-slate-800">Questionnaire Editor</h1>
      <div className="grid gap-4">
        <button
          onClick={onNew}
          className="rounded-lg border border-slate-300 p-4 text-left hover:bg-slate-50"
        >
          <div className="font-medium">New questionnaire</div>
          <div className="text-sm text-slate-500">Start from an empty scaffold</div>
        </button>

        <label className="cursor-pointer rounded-lg border border-slate-300 p-4 hover:bg-slate-50">
          <div className="font-medium">Open file</div>
          <div className="text-sm text-slate-500">Load a canonical Schema 2 .json</div>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) onOpenFile(f) }}
          />
        </label>

        <div className="rounded-lg border border-slate-300 p-4">
          <div className="font-medium">Open from Library</div>
          <div className="mt-2 flex gap-2">
            <input value={id} onChange={(e) => setId(e.target.value)} placeholder="qst_phq9"
                   className="flex-1 rounded border border-slate-300 px-2 py-1 text-sm" aria-label="Questionnaire id" />
            <input value={version} onChange={(e) => setVersion(e.target.value)} placeholder="v26.0609"
                   className="w-32 rounded border border-slate-300 px-2 py-1 text-sm" aria-label="Version" />
            <button onClick={() => onOpenLibrary(id, version)} disabled={!id || !version}
                    className="rounded bg-slate-800 px-3 py-1 text-sm text-white disabled:opacity-40">Open</button>
          </div>
        </div>
      </div>
    </main>
  )
}
```

`editor/src/app/Topbar.tsx`:
```tsx
import { useEditorStore } from '../state/store'
import { exportToFile } from '../persistence/file'

export function Topbar({ onValidate }: { onValidate: () => void }) {
  const { model, dirty, validation } = useEditorStore()
  if (!model) return null
  const invalid = validation && !validation.valid
  const doExport = () => {
    if (invalid && !confirm('This questionnaire is not Schema-2-valid. Export anyway?')) return
    exportToFile(model)
  }
  return (
    <header className="flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-2">
      <span className="font-medium text-slate-800">{model.metadata.title ?? model.metadata.id}</span>
      {dirty && <span className="text-xs text-amber-600">● unsaved</span>}
      <div className="ml-auto flex items-center gap-2">
        <button onClick={onValidate} className="rounded border border-slate-300 px-3 py-1 text-sm hover:bg-slate-50">✓ Validate</button>
        <button disabled className="rounded border border-slate-200 px-3 py-1 text-sm text-slate-400" title="Available in ED-B">▢ Preview</button>
        <button onClick={doExport} className="rounded bg-slate-800 px-3 py-1 text-sm text-white">Export</button>
      </div>
    </header>
  )
}
```

- [ ] **Step 4: Run StartScreen test, verify PASS**

Run: `cd editor && npx vitest run src/app/StartScreen.test.tsx`
Expected: PASS.

- [ ] **Step 5: Rewrite App to orchestrate start ↔ editor + autosave/restore**

`editor/src/app/App.tsx`:
```tsx
import { useEffect, useState } from 'react'
import { useEditorStore } from '../state/store'
import { StartScreen } from './StartScreen'
import { Topbar } from './Topbar'
import { EditorWorkspace } from './EditorWorkspace'
import { newQuestionnaire } from '../model/scaffold'
import { readQuestionnaireFile } from '../persistence/file'
import { fetchFromLibrary } from '../persistence/library'
import { saveDraft, loadDraft } from '../persistence/indexeddb'

export function App() {
  const { model, loadModel, validation } = useEditorStore()
  const [error, setError] = useState<string | null>(null)
  const [booting, setBooting] = useState(true)

  // restore autosaved draft on boot
  useEffect(() => {
    loadDraft().then((d) => { if (d) loadModel(d.model, d.source) }).finally(() => setBooting(false))
  }, [loadModel])

  // autosave on model change (debounced)
  useEffect(() => {
    if (!model) return
    const t = setTimeout(() => {
      const { source } = useEditorStore.getState()
      if (source) saveDraft(model, source)
    }, 500)
    return () => clearTimeout(t)
  }, [model])

  if (booting) return <main className="flex h-full items-center justify-center text-slate-400">Loading…</main>

  if (!model) {
    return (
      <>
        {error && <div role="alert" className="bg-red-50 p-2 text-sm text-red-700">{error}</div>}
        <StartScreen
          onNew={() => loadModel(newQuestionnaire(), { kind: 'new' })}
          onOpenFile={async (f) => {
            try { setError(null); loadModel(await readQuestionnaireFile(f), { kind: 'file', name: f.name }) }
            catch (e) { setError(String(e)) }
          }}
          onOpenLibrary={async (id, version) => {
            try { setError(null); loadModel(await fetchFromLibrary(id, version), { kind: 'library', id, version }) }
            catch (e) { setError(String(e)) }
          }}
        />
      </>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <Topbar onValidate={() => useEditorStore.getState().applyEdit((m) => m)} />
      {validation && !validation.valid && (
        <div role="alert" className="border-b border-red-200 bg-red-50 px-4 py-1 text-xs text-red-700">
          {validation.errors.length} validation issue(s): {validation.errors.slice(0, 3).map((e) => e.message).join('; ')}
        </div>
      )}
      <EditorWorkspace />
    </div>
  )
}
```

(`EditorWorkspace` is created in Task 11. To keep App compiling between tasks, add a temporary stub now and replace it in Task 11.)

`editor/src/app/EditorWorkspace.tsx` (temporary stub — replaced in Task 11):
```tsx
export function EditorWorkspace() {
  return <div className="flex-1 p-4 text-slate-400">Workspace</div>
}
```

- [ ] **Step 6: Update the App test to the new behaviour**

Replace `editor/src/app/App.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react'
import 'fake-indexeddb/auto'
import { App } from './App'
import { useEditorStore } from '../state/store'

beforeEach(() => useEditorStore.getState().reset())

test('boots to the start screen when no draft exists', async () => {
  render(<App />)
  expect(await screen.findByRole('heading', { name: /questionnaire editor/i })).toBeInTheDocument()
})
```

- [ ] **Step 7: Run app + start tests + build**

Run: `cd editor && npx vitest run src/app/ && npm run build`
Expected: PASS + clean build.

- [ ] **Step 8: Commit**

```bash
git add editor/src/app editor/src/model/scaffold.ts
git commit -m "feat(editor): app shell, start screen, topbar, autosave/restore wiring"
```

---

## Task 11: StructureTree (left rail, dnd-kit)

**Files:**
- Create: `editor/src/tree/StructureTree.tsx`, `editor/src/tree/treeModel.ts`
- Rewrite: `editor/src/app/EditorWorkspace.tsx`
- Test: `editor/src/tree/treeModel.test.ts`, `editor/src/tree/StructureTree.test.tsx`

`treeModel.ts` turns the questionnaire into a flat list of render rows (pages → elements → section elements; blocks shown as group headers over their referenced pages, ungrouped pages after). This keeps the dnd-kit sortable list and the React rendering simple.

- [ ] **Step 1: Write the failing treeModel test**

`editor/src/tree/treeModel.test.ts`:
```ts
import phq9 from '../__fixtures__/phq9.json'
import type { Questionnaire } from '../model/types'
import { buildTreeRows } from './treeModel'

const q = phq9 as Questionnaire

test('builds rows for pages and their elements', () => {
  const rows = buildTreeRows(q)
  const pageRows = rows.filter((r) => r.kind === 'page')
  expect(pageRows.length).toBe(q.pages.length)
  const elementRows = rows.filter((r) => r.kind === 'item' || r.kind === 'message' || r.kind === 'section')
  expect(elementRows.length).toBeGreaterThan(0)
  // every row has a stable key + a path
  for (const r of rows) { expect(r.key).toBeTruthy(); expect(Array.isArray(r.path)).toBe(true) }
})
```

- [ ] **Step 2: Run it, verify it fails**

Run: `cd editor && npx vitest run src/tree/treeModel.test.ts`
Expected: FAIL — cannot resolve `./treeModel`.

- [ ] **Step 3: Write treeModel**

`editor/src/tree/treeModel.ts`:
```ts
import type { Questionnaire } from '../model/types'
import { nodeKind, pathKey, type NodeKind, type NodePath } from '../model/path'

export interface TreeRow {
  key: string
  path: NodePath
  kind: NodeKind | 'block'
  depth: number
  label: string
}

function elementLabel(el: Record<string, unknown>): string {
  if (typeof el.ref === 'string') return el.ref
  if ('elements' in el) return (el.title as string) ?? 'Section'
  // inline item
  const q = el.question as Record<string, unknown> | undefined
  const promptRef = (q?.prompt as Record<string, unknown> | undefined)?.ref
  return typeof promptRef === 'string' ? `inline · ${promptRef}` : 'inline item'
}

export function buildTreeRows(q: Questionnaire): TreeRow[] {
  const rows: TreeRow[] = []
  q.pages.forEach((page, pi) => {
    rows.push({ key: pathKey(['pages', pi]), path: ['pages', pi], kind: 'page', depth: 0, label: page.title ?? page.id })
    page.elements.forEach((el, ei) => {
      const path: NodePath = ['pages', pi, 'elements', ei]
      const kind = nodeKind(q, path)
      rows.push({ key: pathKey(path), path, kind, depth: 1, label: elementLabel(el as Record<string, unknown>) })
      if (kind === 'section') {
        const sec = el as { elements?: Record<string, unknown>[] }
        sec.elements?.forEach((sub, si) => {
          const subPath: NodePath = ['pages', pi, 'elements', ei, 'elements', si]
          rows.push({ key: pathKey(subPath), path: subPath, kind: nodeKind(q, subPath), depth: 2, label: elementLabel(sub) })
        })
      }
    })
  })
  return rows
}
```

- [ ] **Step 4: Run test, verify PASS**

Run: `cd editor && npx vitest run src/tree/treeModel.test.ts`
Expected: PASS.

- [ ] **Step 5: Write the failing StructureTree component test**

`editor/src/tree/StructureTree.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import phq9 from '../__fixtures__/phq9.json'
import type { Questionnaire } from '../model/types'
import { useEditorStore } from '../state/store'
import { StructureTree } from './StructureTree'

beforeEach(() => {
  useEditorStore.getState().reset()
  useEditorStore.getState().loadModel(phq9 as Questionnaire, { kind: 'file', name: 'phq9.json' })
})

test('renders a row per page and selecting one updates the store', async () => {
  render(<StructureTree />)
  const firstPage = (phq9 as Questionnaire).pages[0]
  const row = screen.getByText(firstPage.title ?? firstPage.id)
  await userEvent.click(row)
  expect(useEditorStore.getState().selection).toEqual(['pages', 0])
})
```

- [ ] **Step 6: Run it, verify it fails**

Run: `cd editor && npx vitest run src/tree/StructureTree.test.tsx`
Expected: FAIL — cannot resolve `./StructureTree`.

- [ ] **Step 7: Write StructureTree (click-select now; dnd-kit reorder wired)**

`editor/src/tree/StructureTree.tsx`:
```tsx
import { DndContext, closestCenter, type DragEndEvent, PointerSensor, KeyboardSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy, sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useEditorStore } from '../state/store'
import { buildTreeRows, type TreeRow } from './treeModel'
import { reorder } from '../model/tree'
import { pathKey } from '../model/path'

function Row({ row }: { row: TreeRow }) {
  const { selection, select } = useEditorStore()
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: row.key })
  const selected = selection && pathKey(selection) === row.key
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, paddingLeft: 8 + row.depth * 16 }}
      className={`flex cursor-pointer items-center gap-1 rounded px-2 py-1 text-sm ${selected ? 'bg-slate-200' : 'hover:bg-slate-100'}`}
      onClick={() => select(row.path)}
      {...attributes}
      {...listeners}
    >
      <span className="text-slate-400">{row.kind === 'page' ? '▤' : row.kind === 'section' ? '▦' : row.kind === 'message' ? '✉' : '◉'}</span>
      <span className="truncate">{row.label}</span>
    </div>
  )
}

export function StructureTree() {
  const { model, applyEdit } = useEditorStore()
  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }))
  if (!model) return null
  const rows = buildTreeRows(model)

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e
    if (!over || active.id === over.id) return
    const from = rows.find((r) => r.key === active.id)
    const to = rows.find((r) => r.key === over.id)
    if (!from || !to) return
    // only reorder within the same container (same parent path)
    const fromParent = pathKey(from.path.slice(0, -1))
    const toParent = pathKey(to.path.slice(0, -1))
    if (fromParent !== toParent) return
    const fromIdx = Number(from.path[from.path.length - 1])
    const toIdx = Number(to.path[to.path.length - 1])
    applyEdit((m) => reorder(m, from.path.slice(0, -1), fromIdx, toIdx))
  }

  return (
    <nav aria-label="Structure" className="h-full overflow-auto border-r border-slate-200 bg-slate-50 py-2">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={rows.map((r) => r.key)} strategy={verticalListSortingStrategy}>
          {rows.map((row) => <Row key={row.key} row={row} />)}
        </SortableContext>
      </DndContext>
    </nav>
  )
}
```

- [ ] **Step 8: Rewrite EditorWorkspace to the 3-pane layout (tree + placeholders)**

`editor/src/app/EditorWorkspace.tsx`:
```tsx
import { StructureTree } from '../tree/StructureTree'
import { Canvas } from '../canvas/Canvas'
import { Inspector } from '../inspector/Inspector'

export function EditorWorkspace() {
  return (
    <div className="grid flex-1 grid-cols-[260px_1fr_320px] overflow-hidden">
      <StructureTree />
      <Canvas />
      <Inspector />
    </div>
  )
}
```

(Create temporary stubs for `Canvas` and `Inspector` so this compiles; they are implemented in Tasks 12–13.)

`editor/src/canvas/Canvas.tsx` (temporary stub):
```tsx
export function Canvas() { return <div className="overflow-auto p-4">Canvas</div> }
```
`editor/src/inspector/Inspector.tsx` (temporary stub):
```tsx
export function Inspector() { return <aside className="overflow-auto border-l border-slate-200 p-4">Inspector</aside> }
```

- [ ] **Step 9: Run tree tests + build**

Run: `cd editor && npx vitest run src/tree/ && npm run build`
Expected: PASS + clean build.

- [ ] **Step 10: Commit**

```bash
git add editor/src/tree editor/src/app/EditorWorkspace.tsx editor/src/canvas/Canvas.tsx editor/src/inspector/Inspector.tsx
git commit -m "feat(editor): structure tree with selection + dnd-kit reorder"
```

---

## Task 12: Canvas (center pane)

Shows the selected node's children as a reorderable list; items/messages as read-only ref chips; `+ Add` for structural children (a new page when the questionnaire/root is the context; a new section inside a page).

**Files:**
- Rewrite: `editor/src/canvas/Canvas.tsx`
- Test: `editor/src/canvas/Canvas.test.tsx`

- [ ] **Step 1: Write the failing test**

`editor/src/canvas/Canvas.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import phq9 from '../__fixtures__/phq9.json'
import type { Questionnaire } from '../model/types'
import { useEditorStore } from '../state/store'
import { Canvas } from './Canvas'

beforeEach(() => {
  useEditorStore.getState().reset()
  useEditorStore.getState().loadModel(phq9 as Questionnaire, { kind: 'file', name: 'phq9.json' })
})

test('with a page selected, shows its elements and an Add control', () => {
  useEditorStore.getState().select(['pages', 0])
  render(<Canvas />)
  expect(screen.getByText(/add/i)).toBeInTheDocument()
  const firstEl = (phq9 as Questionnaire).pages[0].elements[0] as Record<string, unknown>
  if (typeof firstEl.ref === 'string') expect(screen.getByText(firstEl.ref)).toBeInTheDocument()
})

test('Add section inserts a section into the selected page', async () => {
  useEditorStore.getState().select(['pages', 0])
  render(<Canvas />)
  const before = useEditorStore.getState().model!.pages[0].elements.length
  await userEvent.click(screen.getByRole('button', { name: /add section/i }))
  expect(useEditorStore.getState().model!.pages[0].elements.length).toBe(before + 1)
})
```

- [ ] **Step 2: Run it, verify it fails**

Run: `cd editor && npx vitest run src/canvas/Canvas.test.tsx`
Expected: FAIL — stub Canvas has no Add control.

- [ ] **Step 3: Write the Canvas**

`editor/src/canvas/Canvas.tsx`:
```tsx
import { useEditorStore } from '../state/store'
import { getAtPath, nodeKind, pathKey, type NodePath } from '../model/path'
import { insertNode, deleteNode } from '../model/tree'
import type { Page, Section } from '../model/types'

let sectionCounter = 0

export function Canvas() {
  const { model, selection, applyEdit, select } = useEditorStore()
  if (!model) return null
  if (!selection) return <div className="overflow-auto p-6 text-slate-400">Select a page or section in the structure tree.</div>

  const kind = nodeKind(model, selection)
  if (kind !== 'page' && kind !== 'section' && kind !== 'questionnaire') {
    return <div className="overflow-auto p-6 text-slate-400">This node has no children. Editing item content arrives in ED-C.</div>
  }

  const node = getAtPath(model, selection) as Page | Section
  const elements = (node.elements ?? []) as Record<string, unknown>[]
  const elementsPath: NodePath = [...selection, 'elements']

  const addSection = () => {
    const id = `sec_new_${++sectionCounter}`
    const section: Section = { id, title: 'New section', elements: [] }
    applyEdit((m) => insertNode(m, elementsPath, elements.length, section))
  }

  return (
    <div className="overflow-auto p-6">
      <div className="mb-4 flex items-center gap-2">
        <h2 className="text-lg font-medium text-slate-800">{node.title ?? (node as Page).id}</h2>
        <button onClick={addSection} className="ml-auto rounded border border-slate-300 px-2 py-1 text-sm hover:bg-slate-50">+ Add section</button>
      </div>
      <ul className="space-y-2">
        {elements.map((el, i) => {
          const path: NodePath = [...elementsPath, i]
          const k = nodeKind(model, path)
          const label = typeof el.ref === 'string' ? el.ref : k === 'section' ? ((el.title as string) ?? 'Section') : 'inline item'
          return (
            <li key={pathKey(path)}
                className="flex items-center gap-2 rounded border border-slate-200 bg-white px-3 py-2 text-sm">
              <span className="text-slate-400">{k === 'section' ? '▦' : k === 'message' ? '✉' : '◉'}</span>
              <button className="truncate text-left hover:underline" onClick={() => select(path)}>{label}</button>
              <span className="ml-auto rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-500">{k}</span>
              <button aria-label={`Delete ${label}`} onClick={() => applyEdit((m) => deleteNode(m, path))}
                      className="text-slate-400 hover:text-red-600">✕</button>
            </li>
          )
        })}
        {elements.length === 0 && <li className="text-sm text-slate-400">No elements yet.</li>}
      </ul>
    </div>
  )
}
```

- [ ] **Step 4: Run test + build**

Run: `cd editor && npx vitest run src/canvas/Canvas.test.tsx && npm run build`
Expected: PASS + clean build.

- [ ] **Step 5: Commit**

```bash
git add editor/src/canvas/Canvas.tsx editor/src/canvas/Canvas.test.tsx
git commit -m "feat(editor): canvas — element list, add section, delete, drill-in"
```

---

## Task 13: Inspector (right pane, type-aware)

**Files:**
- Rewrite: `editor/src/inspector/Inspector.tsx`
- Create: `editor/src/inspector/fields.tsx`
- Test: `editor/src/inspector/Inspector.test.tsx`

- [ ] **Step 1: Write the failing test**

`editor/src/inspector/Inspector.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import phq9 from '../__fixtures__/phq9.json'
import type { Questionnaire } from '../model/types'
import { useEditorStore } from '../state/store'
import { Inspector } from './Inspector'

beforeEach(() => {
  useEditorStore.getState().reset()
  useEditorStore.getState().loadModel(phq9 as Questionnaire, { kind: 'file', name: 'phq9.json' })
})

test('no selection → shows the metadata panel and edits title', async () => {
  render(<Inspector />)
  const input = screen.getByLabelText(/^title$/i)
  await userEvent.clear(input)
  await userEvent.type(input, 'Edited')
  expect(useEditorStore.getState().model!.metadata.title).toBe('Edited')
})

test('page selected → edits the page title', async () => {
  useEditorStore.getState().select(['pages', 0])
  render(<Inspector />)
  const input = screen.getByLabelText(/page title/i)
  await userEvent.clear(input)
  await userEvent.type(input, 'P1')
  expect(useEditorStore.getState().model!.pages[0].title).toBe('P1')
})

test('item selected → refs shown read-only with an ED-C note', () => {
  // find an element that is a ref
  const q = phq9 as Questionnaire
  const idx = q.pages[0].elements.findIndex((e) => typeof (e as Record<string, unknown>).ref === 'string')
  if (idx < 0) return
  useEditorStore.getState().select(['pages', 0, 'elements', idx])
  render(<Inspector />)
  expect(screen.getByText(/ED-C/i)).toBeInTheDocument()
})
```

- [ ] **Step 2: Run it, verify it fails**

Run: `cd editor && npx vitest run src/inspector/Inspector.test.tsx`
Expected: FAIL — stub Inspector has no fields.

- [ ] **Step 3: Write the field helper + Inspector**

`editor/src/inspector/fields.tsx`:
```tsx
export function TextField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">{label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)}
             className="w-full rounded border border-slate-300 px-2 py-1 text-sm" />
    </label>
  )
}
```

`editor/src/inspector/Inspector.tsx`:
```tsx
import { useEditorStore } from '../state/store'
import { getAtPath, nodeKind } from '../model/path'
import { updateMetadata, updateNodeProps } from '../model/tree'
import { TextField } from './fields'
import type { Block, Page, Section } from '../model/types'

export function Inspector() {
  const { model, selection, applyEdit } = useEditorStore()
  if (!model) return null
  const kind = selection ? nodeKind(model, selection) : 'questionnaire'

  let body: JSX.Element

  if (kind === 'questionnaire') {
    const m = model.metadata
    body = (
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-700">Questionnaire</h3>
        <TextField label="Title" value={m.title ?? ''} onChange={(v) => applyEdit((mm) => updateMetadata(mm, { title: v }))} />
        <TextField label="Id" value={m.id} onChange={(v) => applyEdit((mm) => updateMetadata(mm, { id: v }))} />
        <TextField label="Description" value={m.description ?? ''} onChange={(v) => applyEdit((mm) => updateMetadata(mm, { description: v }))} />
        <TextField label="Language" value={m.language ?? ''} onChange={(v) => applyEdit((mm) => updateMetadata(mm, { language: v }))} />
      </div>
    )
  } else if (kind === 'page' || kind === 'section') {
    const node = getAtPath(model, selection!) as Page | Section
    body = (
      <div className="space-y-3">
        <h3 className="text-sm font-semibold capitalize text-slate-700">{kind}</h3>
        <TextField label={`${kind} title`} value={node.title ?? ''} onChange={(v) => applyEdit((mm) => updateNodeProps(mm, selection!, { title: v }))} />
        <TextField label="Id" value={(node as Page).id ?? ''} onChange={(v) => applyEdit((mm) => updateNodeProps(mm, selection!, { id: v }))} />
        <p className="text-xs text-slate-400">style / flow panels arrive with full coverage in later stages.</p>
      </div>
    )
  } else if (kind === 'block') {
    const node = getAtPath(model, selection!) as Block
    body = (
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-700">Block</h3>
        <TextField label="Block title" value={node.title ?? ''} onChange={(v) => applyEdit((mm) => updateNodeProps(mm, selection!, { title: v }))} />
        <p className="text-xs text-slate-400">Pages in this block: {node.page_ids.join(', ') || '(none)'}</p>
      </div>
    )
  } else {
    const node = getAtPath(model, selection!) as Record<string, unknown>
    body = (
      <div className="space-y-3">
        <h3 className="text-sm font-semibold capitalize text-slate-700">{kind}</h3>
        <pre className="overflow-auto rounded bg-slate-50 p-2 text-xs text-slate-600">{JSON.stringify(node, null, 2)}</pre>
        <p className="text-xs text-slate-400">Content & reference editing arrive in <strong>ED-C</strong>; logic (show_if) in ED-D.</p>
      </div>
    )
  }

  return <aside className="overflow-auto border-l border-slate-200 bg-white p-4">{body}</aside>
}
```

- [ ] **Step 4: Run test + build**

Run: `cd editor && npx vitest run src/inspector/Inspector.test.tsx && npm run build`
Expected: PASS + clean build. (If TS complains about `JSX.Element`, import `type { JSX } from 'react'` or type `body` as `React.ReactNode`.)

- [ ] **Step 5: Commit**

```bash
git add editor/src/inspector
git commit -m "feat(editor): type-aware inspector (metadata/page/section/block/item)"
```

---

## Task 14: Round-trip gate test + full suite green

**Files:**
- Create: `editor/src/model/roundtrip.test.ts`

- [ ] **Step 1: Write the gate test (load → restructure → validate)**

`editor/src/model/roundtrip.test.ts`:
```ts
import phq9 from '../__fixtures__/phq9.json'
import kitchensink from '../__fixtures__/kitchensink.json'
import type { Questionnaire } from './types'
import { parseQuestionnaire, serializeQuestionnaire } from './serialize'
import { validateQuestionnaire } from './validation'
import { reorder, deleteNode } from './tree'

test('no-op round-trip is identical and valid', () => {
  for (const fx of [phq9, kitchensink]) {
    const model = parseQuestionnaire(JSON.stringify(fx))
    expect(validateQuestionnaire(model).valid).toBe(true)
    const out = JSON.parse(serializeQuestionnaire(model))
    expect(out).toEqual(fx)
  }
})

test('restructure (reorder a page elements + delete one) stays Schema-2 valid', () => {
  const model = parseQuestionnaire(JSON.stringify(kitchensink)) as Questionnaire
  const page0 = model.pages[0]
  let next = model
  if (page0.elements.length >= 2) next = reorder(model, ['pages', 0, 'elements'], 0, 1)
  if (next.pages.length > 1) next = deleteNode(next, ['pages', next.pages.length - 1])
  const { valid, errors } = validateQuestionnaire(next)
  expect(errors).toEqual([])
  expect(valid).toBe(true)
})
```

- [ ] **Step 2: Run the FULL suite**

Run: `cd editor && npm test`
Expected: ALL tests PASS.

- [ ] **Step 3: Build**

Run: `cd editor && npm run build`
Expected: clean build, no TS errors.

- [ ] **Step 4: Commit**

```bash
git add editor/src/model/roundtrip.test.ts
git commit -m "test(editor): ED-A round-trip + restructure validity gate"
```

---

## Task 15: Playwright chromium smoke + screenshot

**Files:**
- Create: `editor/tests/e2e/smoke.spec.ts`, `editor/playwright.config.ts`
- Modify: `editor/package.json` (add `@playwright/test` devDep + `e2e` script)

- [ ] **Step 1: Add Playwright + script**

Add to `editor/package.json` devDependencies: `"@playwright/test": "^1.49.0"`, and to scripts: `"e2e": "playwright test"`. Then run `cd editor && npm install`.

`editor/playwright.config.ts`:
```ts
import { defineConfig } from '@playwright/test'
export default defineConfig({
  testDir: './tests/e2e',
  use: { baseURL: 'http://localhost:4175', headless: true },
  webServer: { command: 'npm run build && npm run preview', port: 4175, reuseExistingServer: !process.env.CI },
})
```

- [ ] **Step 2: Write the smoke spec**

`editor/tests/e2e/smoke.spec.ts`:
```ts
import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const fixturePath = fileURLToPath(new URL('../../src/__fixtures__/kitchensink.json', import.meta.url))

test('open a file → reorder → export → screenshot', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: /questionnaire editor/i })).toBeVisible()

  // upload the fixture via the hidden file input
  await page.setInputFiles('input[type=file]', fixturePath)

  // we should now be in the workspace: a structure nav is visible
  await expect(page.getByRole('navigation', { name: /structure/i })).toBeVisible()

  // select the first page
  await page.getByRole('navigation', { name: /structure/i }).getByText(/page|introduction/i).first().click()

  await page.screenshot({ path: 'tests/e2e/screenshots/ed-a-workspace.png', fullPage: true })

  // export downloads a valid JSON
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: /export/i }).click(),
  ])
  const path = await download.path()
  const json = JSON.parse(readFileSync(path!, 'utf8'))
  expect(json.metadata.id).toBeTruthy()
})
```

- [ ] **Step 3: Run the smoke**

Run: `cd editor && npx playwright install chromium && npm run e2e`
Expected: PASS; screenshot at `editor/tests/e2e/screenshots/ed-a-workspace.png`.

- [ ] **Step 4: Show the owner the screenshot**

Present `editor/tests/e2e/screenshots/ed-a-workspace.png` to the owner for visual reaction (per the show-don't-describe workflow). Iterate on visual polish via follow-up edits if requested.

- [ ] **Step 5: Commit**

```bash
git add editor/tests editor/playwright.config.ts editor/package.json editor/package-lock.json
git commit -m "test(editor): Playwright chromium smoke + ED-A workspace screenshot"
```

---

## Task 16: Editor README + FOLLOWUPS

**Files:**
- Create: `editor/README.md`, `editor/FOLLOWUPS.md`

- [ ] **Step 1: Write `editor/README.md`** — dev quickstart (`npm install`, `npm run dev`, `npm test`, `npm run e2e`), the ED-A scope summary, the env var `VITE_LIBRARY_BASE_URL` (defaults to the live library), and the ED-A→F decomposition table (copy from the spec §0).

- [ ] **Step 2: Write `editor/FOLLOWUPS.md`** — log: (a) verify the Library `resolved=false` endpoint serves refs-intact (spec §7); (b) blocks tree-grouping UI is minimal (CRUD + membership via inspector only — no drag-page-into-block yet); (c) `style`/`flow` inspector panels are stubs until later stages; (d) inline-item content + ref chips are read-only until ED-C; (e) any fixture quirks discovered.

- [ ] **Step 3: Commit**

```bash
git add editor/README.md editor/FOLLOWUPS.md
git commit -m "docs(editor): ED-A README + FOLLOWUPS"
```

---

## Self-review notes (author)

**Spec coverage:** scaffold (Task 1) ✓; canonical model + refs-intact (Tasks 2,4) ✓; Ajv validation + offline `$ref` registration (Task 3) ✓; path addressing + tree ops incl. blocks (Tasks 5,6) ✓; Zustand store (Task 7) ✓; IndexedDB autosave + file I/O + Library client (Tasks 8,9) ✓; 3-pane shell + start screen + topbar + preview-placeholder + export-when-invalid-warning (Tasks 10–13) ✓; round-trip gate against real fixtures (Task 14) ✓; Playwright smoke + screenshot (Task 15) ✓; README/FOLLOWUPS (Task 16) ✓.

**Deferred per spec (no task, intentional):** inline preview/renderer (ED-B), item/Question/Option authoring + pick-from-Library + OD-05 fork (ED-C), logic/validation/scoring builders + WASM evaluator (ED-D), translation (ED-E), preview deployment + PDF (ED-F), version diff/branch.

**Type consistency check:** `Questionnaire`, `Page`, `Section`, `Block`, `Metadata` (types.ts) used identically across tree.ts / store.ts / components; `NodePath`, `nodeKind`, `getAtPath`, `getContainer`, `pathKey` (path.ts) used identically in tree.ts / treeModel.ts / Canvas / Inspector; store actions `loadModel`/`applyEdit`/`select`/`reset`/`markSaved` consistent across App / components / tests; persistence `saveDraft`/`loadDraft`/`clearDraft`, `readQuestionnaireFile`/`exportToFile`/`downloadFilename`, `fetchFromLibrary` consistent.

**Known build-order note:** Tasks 10–11 introduce temporary stubs (`EditorWorkspace`, `Canvas`, `Inspector`) so the app compiles between tasks; each is replaced in its own task. This is intentional to keep every task independently green.
