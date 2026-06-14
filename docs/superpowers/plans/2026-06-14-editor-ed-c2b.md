# Editor ED-C2b (Context / Instruction + Message Authoring) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let an author add a Context and an Instruction to a question and author standalone Messages on pages — all as draft pool entities that render in the live preview and export in the bundle.

**Architecture:** A reusable `ContentTextEditor` over the shared `{content:{lang:{status,text}}}` shape, three thin entity editors (Context/Instruction/Message), pure pool minters (`newEntities.ts`), a `tree.unsetNodeProp` helper, ItemEditor Context/Instruction sections, and a Canvas "+ Add message" + pool-message routing. Reuses ED-C2a's pool/mint/bundle/live-preview wholesale.

**Tech Stack:** Vite · React 19 · TS · Tailwind · Zustand+Immer · vitest+RTL · Playwright.

**Spec:** [docs/superpowers/specs/2026-06-14-editor-ed-c2b-design.md](../specs/2026-06-14-editor-ed-c2b-design.md)

**Pinned facts (verified against current code + schema):**
- `editor/src/model/tree.ts` has `updateNodeProps(model, path, patch)` (Object.assign — can't delete a key) but **no key-delete op** → Task 1 adds `unsetNodeProp`. `tree.ts` already imports `produce` (immer), `getAtPath`, `NodePath`.
- `editor/src/pool/mint.ts` exports `draftVersion(metadataVersion)`, `mintEntityId(prefix, Set)`, `collectIds(model, pool)`. `editor/src/pool/newItem.ts` is the minter pattern to mirror.
- Store (`editor/src/state/store.ts`): `pool`, `upsertPoolEntity(ref, body)`, `removePoolEntity(ref)`, `applyEdit`, `select`. `EntityBody` from `editor/src/model/types.ts`.
- `editor/src/canvas/ItemEditor.tsx`: `{model, applyEdit, pool, upsertPoolEntity}` from store; `node = getAtPath(model, path)`; renders a **Question** block (prompt: pool→`PromptEditor`, else chip) then a **Response (Option)** block. `node.question` exists for inline items; `optionKey` is `shared_option` for sections. `path` is the item/section path.
- `editor/src/canvas/Canvas.tsx`: computes `selNode`/`kind`; routes inline-item + shared-option-section to `ItemEditor`; element-list view has `elementsPath = [...sel,'elements']`, `addItem`/`addSection` actions + their buttons (gated `kind === 'page' || 'section'`). `select`, `pool`, `upsertPoolEntity`, `insertNode`, `collectIds`, `draftVersion`, `buildNewItem` already wired there.
- Schema: `Message` requires `id`+`type`(array minItems 1, unique)+`content`; `Context`/`Instruction` require `id`+`content` (Instruction optional `dimension` `^[a-z][a-z0-9_]+$`); content `{status, text(minLength 1)}`. `QuestionInline` = `prompt`(ref) + optional `context`/`instruction`(refs). Page element `MessageRef` = `{ref:"msg_…@v…"}`.
- Run tests: `cd editor && npx vitest run <path>` (git from repo root).

---

## Task 1: Pure helpers — `tree.unsetNodeProp` + `pool/newEntities.ts`

**Files:**
- Modify: `editor/src/model/tree.ts`
- Create: `editor/src/pool/newEntities.ts`
- Test: `editor/src/model/tree.test.ts` (append), `editor/src/pool/newEntities.test.ts`

- [ ] **Step 1: Write the failing tests**

Append to `editor/src/model/tree.test.ts`:
```ts
import { unsetNodeProp } from './tree'
test('unsetNodeProp deletes a key from the node at path (immutably)', () => {
  const q = base()
  // give page 0 a marker key, then remove it
  let next = updateNodeProps(q, ['pages', 0], { x_marker: true })
  expect((next.pages[0] as Record<string, unknown>).x_marker).toBe(true)
  next = unsetNodeProp(next, ['pages', 0], 'x_marker')
  expect('x_marker' in (next.pages[0] as object)).toBe(false)
  expect((q.pages[0] as Record<string, unknown>).x_marker).toBeUndefined() // original untouched
})
```
(`base()` + `updateNodeProps` already exist in that test file.)

`editor/src/pool/newEntities.test.ts`:
```ts
import { buildContext, buildInstruction, buildMessage } from './newEntities'

test('buildContext mints a ctx ref + empty-text body', () => {
  const { ref, body } = buildContext(new Set(), 'v26.0609.dev1', 'en')
  expect(ref).toBe('ctx_new_1@v26.0609.dev1')
  expect(body).toEqual({ id: 'ctx_new_1', content: { en: { status: 'draft', text: '' } } })
})
test('buildInstruction mints an ins ref + empty-text body (no dimension yet)', () => {
  const { ref, body } = buildInstruction(new Set(['ins_new_1']), 'v26.0609.dev1', 'en')
  expect(ref).toBe('ins_new_2@v26.0609.dev1')
  expect(body).toEqual({ id: 'ins_new_2', content: { en: { status: 'draft', text: '' } } })
})
test('buildMessage mints a msg ref + default type + empty text', () => {
  const { ref, body } = buildMessage(new Set(), 'v26.0609.dev1', 'en')
  expect(ref).toBe('msg_new_1@v26.0609.dev1')
  expect(body).toEqual({ id: 'msg_new_1', type: ['information'], content: { en: { status: 'draft', text: '' } } })
})
```

- [ ] **Step 2: Run → fail**

Run: `cd editor && npx vitest run src/model/tree.test.ts src/pool/newEntities.test.ts` → FAIL.

- [ ] **Step 3: Add `unsetNodeProp` to `tree.ts`**

Append (uses the file's existing `produce`/`getAtPath`/`NodePath` imports):
```ts
export function unsetNodeProp(model: Questionnaire, path: NodePath, key: string): Questionnaire {
  return produce(model, (draft) => {
    const node = getAtPath(draft, path) as Record<string, unknown> | undefined
    if (node) delete node[key]
  })
}
```

- [ ] **Step 4: Write `editor/src/pool/newEntities.ts`**

```ts
import type { EntityBody } from '../model/types'
import { mintEntityId } from './mint'

export function buildContext(ids: Set<string>, draftVer: string, locale: string): { ref: string; body: EntityBody } {
  const id = mintEntityId('ctx', ids)
  return { ref: `${id}@${draftVer}`, body: { id, content: { [locale]: { status: 'draft', text: '' } } } }
}

export function buildInstruction(ids: Set<string>, draftVer: string, locale: string): { ref: string; body: EntityBody } {
  const id = mintEntityId('ins', ids)
  return { ref: `${id}@${draftVer}`, body: { id, content: { [locale]: { status: 'draft', text: '' } } } }
}

export function buildMessage(ids: Set<string>, draftVer: string, locale: string): { ref: string; body: EntityBody } {
  const id = mintEntityId('msg', ids)
  return { ref: `${id}@${draftVer}`, body: { id, type: ['information'], content: { [locale]: { status: 'draft', text: '' } } } }
}
```

- [ ] **Step 5: Run → PASS; commit**

Run: `cd editor && npx vitest run src/model/tree.test.ts src/pool/newEntities.test.ts` → PASS.
```bash
git add editor/src/model/tree.ts editor/src/model/tree.test.ts editor/src/pool/newEntities.ts editor/src/pool/newEntities.test.ts
git commit -m "feat(editor): unsetNodeProp + Context/Instruction/Message minters"
```

---

## Task 2: Entity editors (ContentTextEditor + Context/Instruction/Message)

**Files:**
- Create: `editor/src/entity/ContentTextEditor.tsx`, `editor/src/entity/ContextEditor.tsx`, `editor/src/entity/InstructionEditor.tsx`, `editor/src/entity/MessageEditor.tsx`
- Test: `editor/src/entity/entityEditors.test.tsx`

- [ ] **Step 1: Write the failing test**

`editor/src/entity/entityEditors.test.tsx`:
```tsx
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ContentTextEditor, type ContentMap } from './ContentTextEditor'
import { ContextEditor, type ContextBody } from './ContextEditor'
import { InstructionEditor, type InstructionBody } from './InstructionEditor'
import { MessageEditor, type MessageBody } from './MessageEditor'

test('ContentTextEditor edits the locale text', async () => {
  const onChange = vi.fn()
  const content: ContentMap = { en: { status: 'draft', text: 'Hi' } }
  render(<ContentTextEditor content={content} locale="en" label="Body" onChange={onChange} />)
  await userEvent.type(screen.getByLabelText('Body'), '!')
  expect(onChange.mock.calls.at(-1)![0].en.text).toBe('Hi!')
})

test('ContextEditor wraps content back into the context body', async () => {
  const onChange = vi.fn()
  const ctx: ContextBody = { id: 'ctx_1', content: { en: { status: 'draft', text: 'x' } } }
  render(<ContextEditor context={ctx} locale="en" onChange={onChange} />)
  await userEvent.type(screen.getByLabelText(/context text/i), 'y')
  expect(onChange.mock.calls.at(-1)![0].content.en.text).toBe('xy')
  expect(onChange.mock.calls.at(-1)![0].id).toBe('ctx_1')
})

test('InstructionEditor edits dimension (delete-on-empty)', () => {
  const onChange = vi.fn()
  const ins: InstructionBody = { id: 'ins_1', content: { en: { status: 'draft', text: 'r' } } }
  render(<InstructionEditor instruction={ins} locale="en" onChange={onChange} />)
  fireEvent.change(screen.getByLabelText(/dimension/i), { target: { value: 'agreement' } })
  expect(onChange.mock.calls.at(-1)![0].dimension).toBe('agreement')
  fireEvent.change(screen.getByLabelText(/dimension/i), { target: { value: '' } })
  expect('dimension' in onChange.mock.calls.at(-1)![0]).toBe(false)
})

test('MessageEditor edits type tags (comma <-> array) + text', () => {
  const onChange = vi.fn()
  const msg: MessageBody = { id: 'msg_1', type: ['information'], content: { en: { status: 'draft', text: 'w' } } }
  render(<MessageEditor message={msg} locale="en" onChange={onChange} />)
  fireEvent.change(screen.getByLabelText(/type/i), { target: { value: 'welcome, consent' } })
  expect(onChange.mock.calls.at(-1)![0].type).toEqual(['welcome', 'consent'])
})
```

- [ ] **Step 2: Run → fail**

Run: `cd editor && npx vitest run src/entity/entityEditors.test.tsx` → FAIL.

- [ ] **Step 3: Write `ContentTextEditor.tsx`**

```tsx
export interface ContentMap { [lang: string]: { status: string; text?: string } }

export function ContentTextEditor({ content, locale, label, onChange }: {
  content: ContentMap; locale: string; label: string; onChange: (c: ContentMap) => void
}) {
  const entry = content?.[locale] ?? { status: 'draft' }
  const setText = (text: string) => onChange({ ...content, [locale]: { ...entry, status: entry.status ?? 'draft', text } })
  return (
    <label className="block text-sm">{label} ({locale})
      <textarea aria-label={label} value={entry.text ?? ''} onChange={(e) => setText(e.target.value)} rows={2}
                className="mt-1 w-full rounded border border-slate-300 px-2 py-1" />
    </label>
  )
}
```

- [ ] **Step 4: Write `ContextEditor.tsx`**

```tsx
import { ContentTextEditor, type ContentMap } from './ContentTextEditor'

export interface ContextBody { id: string; content: ContentMap; [k: string]: unknown }

export function ContextEditor({ context, locale, onChange }: { context: ContextBody; locale: string; onChange: (c: ContextBody) => void }) {
  return <ContentTextEditor content={context.content} locale={locale} label="Context text"
                            onChange={(c) => onChange({ ...context, content: c })} />
}
```

- [ ] **Step 5: Write `InstructionEditor.tsx`**

```tsx
import { ContentTextEditor, type ContentMap } from './ContentTextEditor'

export interface InstructionBody { id: string; dimension?: string; content: ContentMap; [k: string]: unknown }

export function InstructionEditor({ instruction, locale, onChange }: { instruction: InstructionBody; locale: string; onChange: (i: InstructionBody) => void }) {
  const setDim = (v: string) => { const next = { ...instruction }; if (v) next.dimension = v; else delete next.dimension; onChange(next) }
  return (
    <div className="space-y-2">
      <ContentTextEditor content={instruction.content} locale={locale} label="Instruction text"
                         onChange={(c) => onChange({ ...instruction, content: c })} />
      <label className="block text-sm">Dimension
        <input aria-label="Dimension" value={instruction.dimension ?? ''} onChange={(e) => setDim(e.target.value)}
               className="ml-1 rounded border border-slate-300 px-1 py-0.5" />
      </label>
    </div>
  )
}
```

- [ ] **Step 6: Write `MessageEditor.tsx`**

```tsx
import { ContentTextEditor, type ContentMap } from './ContentTextEditor'

export interface MessageBody { id: string; type: string[]; content: ContentMap; [k: string]: unknown }

export function MessageEditor({ message, locale, onChange }: { message: MessageBody; locale: string; onChange: (m: MessageBody) => void }) {
  const setType = (v: string) => onChange({ ...message, type: v.split(',').map((t) => t.trim()).filter(Boolean) })
  return (
    <div className="space-y-2">
      <label className="block text-sm">Type (comma-separated)
        <input aria-label="Type" value={(message.type ?? []).join(', ')} onChange={(e) => setType(e.target.value)}
               className="mt-1 w-full rounded border border-slate-300 px-2 py-1" />
      </label>
      <ContentTextEditor content={message.content} locale={locale} label="Message text"
                         onChange={(c) => onChange({ ...message, content: c })} />
    </div>
  )
}
```

- [ ] **Step 7: Run → PASS; commit**

Run: `cd editor && npx vitest run src/entity/entityEditors.test.tsx && npm run typecheck` → green. (If a controlled multi-char `userEvent.type` assertion is flaky in isolation, switch that one to `fireEvent.change` with the full value and report it — the parse/wrap behavior is what's verified.)
```bash
git add editor/src/entity/ContentTextEditor.tsx editor/src/entity/ContextEditor.tsx editor/src/entity/InstructionEditor.tsx editor/src/entity/MessageEditor.tsx editor/src/entity/entityEditors.test.tsx
git commit -m "feat(editor): ContentTextEditor + Context/Instruction/Message editors"
```

---

## Task 3: ItemEditor Context + Instruction sections

**Files:**
- Modify: `editor/src/canvas/ItemEditor.tsx`
- Test: `editor/src/canvas/ItemEditor.test.tsx` (append)

- [ ] **Step 1: Write the failing tests**

Append to `editor/src/canvas/ItemEditor.test.tsx`:
```tsx
import { buildContext } from '../pool/newEntities'

test('Add context mints a pool context + sets question.context ref', async () => {
  const ref = 'pr_p@v26.0609.dev1'
  const model = {
    metadata: { id: 'qst_t', title: 'T', description: 'd', version: 'v26.0609', language: 'en' },
    pages: [{ id: 'page_1', title: 'P', elements: [{ question: { prompt: { ref } }, option: {
      input_data_type: 'text', measurement_type: 'nominal', content: { en: { status: 'draft', label: 'L' } } } }] }],
  } as unknown as import('../model/types').Questionnaire
  useEditorStore.getState().reset()
  useEditorStore.getState().loadModel(model, { kind: 'file', name: 't.json' })
  useEditorStore.getState().upsertPoolEntity(ref, { id: 'pr_p', content: { en: { status: 'draft', text: 'Q' } } })
  render(<ItemEditor path={['pages', 0, 'elements', 0]} />)
  await userEvent.click(screen.getByRole('button', { name: /add context/i }))
  const q = (useEditorStore.getState().model!.pages[0].elements[0] as { question: { context?: { ref: string } } }).question
  expect(q.context?.ref).toMatch(/^ctx_new_\d+@v26\.0609\.dev1$/)
  expect(useEditorStore.getState().pool[q.context!.ref]).toBeTruthy()
})

test('Remove context unsets the ref and drops the pool entity', async () => {
  const ref = 'pr_p@v26.0609.dev1'
  const ctxRef = 'ctx_x@v26.0609.dev1'
  const model = {
    metadata: { id: 'qst_t', title: 'T', description: 'd', version: 'v26.0609', language: 'en' },
    pages: [{ id: 'page_1', title: 'P', elements: [{ question: { prompt: { ref }, context: { ref: ctxRef } }, option: {
      input_data_type: 'text', measurement_type: 'nominal', content: { en: { status: 'draft', label: 'L' } } } }] }],
  } as unknown as import('../model/types').Questionnaire
  useEditorStore.getState().reset()
  useEditorStore.getState().loadModel(model, { kind: 'file', name: 't.json' })
  useEditorStore.getState().upsertPoolEntity(ref, { id: 'pr_p', content: { en: { status: 'draft', text: 'Q' } } })
  useEditorStore.getState().upsertPoolEntity(ctxRef, { id: 'ctx_x', content: { en: { status: 'draft', text: 'C' } } })
  render(<ItemEditor path={['pages', 0, 'elements', 0]} />)
  await userEvent.click(screen.getByRole('button', { name: /remove context/i }))
  const q = (useEditorStore.getState().model!.pages[0].elements[0] as { question: { context?: unknown } }).question
  expect(q.context).toBeUndefined()
  expect(useEditorStore.getState().pool[ctxRef]).toBeUndefined()
})
```
(`useEditorStore`, `render`, `screen`, `userEvent` already imported in this test file.)

- [ ] **Step 2: Run → fail**

Run: `cd editor && npx vitest run src/canvas/ItemEditor.test.tsx` → FAIL (no "Add context" button).

- [ ] **Step 3: Extend `ItemEditor.tsx`**

Read the current file. Add imports:
```tsx
import { ContextEditor, type ContextBody } from '../entity/ContextEditor'
import { InstructionEditor, type InstructionBody } from '../entity/InstructionEditor'
import { buildContext, buildInstruction } from '../pool/newEntities'
import { collectIds, draftVersion } from '../pool/mint'
import { updateNodeProps, unsetNodeProp } from '../model/tree'
```
Destructure `removePoolEntity` too: `const { model, applyEdit, pool, upsertPoolEntity, removePoolEntity } = useEditorStore()`. Compute the question + sub-refs (after the existing `promptRef`/`poolPrompt` lines), gated on the node being a question-bearing item:
```tsx
const question = node.question as Record<string, unknown> | undefined
const questionPath = [...path, 'question']
const ids = () => collectIds(model, pool)
const dv = () => draftVersion(model.metadata.version as string | undefined)

const ctxRef = (question?.context as { ref?: string } | undefined)?.ref
const insRef = (question?.instruction as { ref?: string } | undefined)?.ref
const poolCtx = ctxRef ? (pool[ctxRef] as ContextBody | undefined) : undefined
const poolIns = insRef ? (pool[insRef] as InstructionBody | undefined) : undefined

const addContext = () => { const { ref, body } = buildContext(ids(), dv(), locale); upsertPoolEntity(ref, body); applyEdit((m) => updateNodeProps(m, questionPath, { context: { ref } })) }
const removeContext = () => { applyEdit((m) => unsetNodeProp(m, questionPath, 'context')); if (ctxRef) removePoolEntity(ctxRef) }
const addInstruction = () => { const { ref, body } = buildInstruction(ids(), dv(), locale); upsertPoolEntity(ref, body); applyEdit((m) => updateNodeProps(m, questionPath, { instruction: { ref } })) }
const removeInstruction = () => { applyEdit((m) => unsetNodeProp(m, questionPath, 'instruction')); if (insRef) removePoolEntity(insRef) }
```
Then render Context + Instruction sections **only when `question` exists** (i.e. it's an item, not a shared-option section), placed AFTER the existing Question/prompt block and BEFORE the "Response (Option)" block:
```tsx
{question && (
  <div className="mb-4 space-y-4">
    <div>
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-slate-400">Context</span>
        {!ctxRef && <button onClick={addContext} className="rounded border border-slate-300 px-1.5 py-0.5 text-xs hover:bg-slate-50">+ Add context</button>}
        {ctxRef && poolCtx && <button onClick={removeContext} className="text-xs text-slate-400 hover:text-red-600">Remove context</button>}
      </div>
      {ctxRef && (poolCtx
        ? <div className="mt-1"><ContextEditor context={poolCtx} locale={locale} onChange={(c) => upsertPoolEntity(ctxRef, c)} /></div>
        : <div className="mt-1 rounded border border-slate-200 bg-slate-50 px-3 py-2 text-sm"><span className="font-mono">{ctxRef}</span> <span className="text-xs text-slate-400">— fork to edit (ED-C4)</span></div>)}
    </div>
    <div>
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-slate-400">Instruction</span>
        {!insRef && <button onClick={addInstruction} className="rounded border border-slate-300 px-1.5 py-0.5 text-xs hover:bg-slate-50">+ Add instruction</button>}
        {insRef && poolIns && <button onClick={removeInstruction} className="text-xs text-slate-400 hover:text-red-600">Remove instruction</button>}
      </div>
      {insRef && (poolIns
        ? <div className="mt-1"><InstructionEditor instruction={poolIns} locale={locale} onChange={(i) => upsertPoolEntity(insRef, i)} /></div>
        : <div className="mt-1 rounded border border-slate-200 bg-slate-50 px-3 py-2 text-sm"><span className="font-mono">{insRef}</span> <span className="text-xs text-slate-400">— fork to edit (ED-C4)</span></div>)}
    </div>
  </div>
)}
```

- [ ] **Step 4: Run → PASS; build; commit**

Run: `cd editor && npx vitest run src/canvas/ItemEditor.test.tsx && npm run typecheck && npm run build` → green.
```bash
git add editor/src/canvas/ItemEditor.tsx editor/src/canvas/ItemEditor.test.tsx
git commit -m "feat(editor): Context + Instruction sections in ItemEditor (add/edit/remove)"
```

---

## Task 4: Canvas "+ Add message" + MessagePane routing

**Files:**
- Create: `editor/src/canvas/MessagePane.tsx`, `editor/src/canvas/MessagePane.test.tsx`
- Modify: `editor/src/canvas/Canvas.tsx`
- Test: `editor/src/canvas/Canvas.test.tsx` (append)

- [ ] **Step 1: Write the failing MessagePane test**

`editor/src/canvas/MessagePane.test.tsx`:
```tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { useEditorStore } from '../state/store'
import { MessagePane } from './MessagePane'
import type { Questionnaire } from '../model/types'

const ref = 'msg_m@v26.0609.dev1'
const model = {
  metadata: { id: 'qst_t', title: 'T', description: 'd', version: 'v26.0609', language: 'en' },
  pages: [{ id: 'page_1', title: 'P', elements: [{ ref }] }],
} as unknown as Questionnaire

beforeEach(() => {
  useEditorStore.getState().reset()
  useEditorStore.getState().loadModel(model, { kind: 'file', name: 't.json' })
  useEditorStore.getState().upsertPoolEntity(ref, { id: 'msg_m', type: ['information'], content: { en: { status: 'draft', text: 'Welcome' } } })
})

test('edits a pool message body via the store', () => {
  render(<MessagePane path={['pages', 0, 'elements', 0]} />)
  fireEvent.change(screen.getByLabelText(/message text/i), { target: { value: 'Hello there' } })
  expect((useEditorStore.getState().pool[ref] as { content: { en: { text: string } } }).content.en.text).toBe('Hello there')
})
```

- [ ] **Step 2: Run → fail, then write `editor/src/canvas/MessagePane.tsx`**

```tsx
import { useEditorStore } from '../state/store'
import { getAtPath, type NodePath } from '../model/path'
import { MessageEditor, type MessageBody } from '../entity/MessageEditor'

export function MessagePane({ path }: { path: NodePath }) {
  const { model, pool, upsertPoolEntity } = useEditorStore()
  if (!model) return null
  const ref = (getAtPath(model, path) as { ref?: string } | undefined)?.ref
  const message = ref ? (pool[ref] as MessageBody | undefined) : undefined
  const locale = String(model.metadata.language ?? 'en')
  return (
    <div className="overflow-auto p-6">
      <span className="text-xs font-medium uppercase tracking-wide text-slate-400">Message</span>
      {ref && message ? (
        <div className="mt-2"><MessageEditor message={message} locale={locale} onChange={(m) => upsertPoolEntity(ref, m)} /></div>
      ) : (
        <div className="mt-2 rounded border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
          <span className="font-mono">{ref}</span> <span className="text-xs text-slate-400">— fork to edit (ED-C4)</span>
        </div>
      )}
    </div>
  )
}
```
Run: `cd editor && npx vitest run src/canvas/MessagePane.test.tsx` → PASS.

- [ ] **Step 3: Canvas — "+ Add message" + route pool messages**

In `editor/src/canvas/Canvas.tsx`:
- Import: `import { MessagePane } from './MessagePane'`, `import { buildMessage } from '../pool/newEntities'` (and confirm `collectIds`/`draftVersion`/`buildNewItem` already imported from `../pool/...`).
- Route a selected pool message to MessagePane — add this beside the existing inline-item/shared-option routing (where `selNode`/`kind` are computed), before the element-list view:
```tsx
const isPoolMessage = !!selNode && kind === 'message' && typeof (selNode as { ref?: unknown }).ref === 'string' && !!pool[(selNode as { ref: string }).ref]
if (isPoolMessage) return <MessagePane path={sel} />
```
- Add an `addMessage` action next to `addItem` (in the element-list view, where `elementsPath`/`elements`/`pool`/`upsertPoolEntity`/`select` are available):
```tsx
const addMessage = () => {
  const { ref, body } = buildMessage(collectIds(model, pool), draftVersion(model.metadata.version as string | undefined), String(model.metadata.language ?? 'en'))
  upsertPoolEntity(ref, body)
  applyEdit((m) => insertNode(m, elementsPath, elements.length, { ref }))
  select([...elementsPath, elements.length])
}
```
- Add a "+ Add message" button beside "+ Add item" (gated `kind === 'page' || 'section'`):
```tsx
{(kind === 'page' || kind === 'section') && (
  <button onClick={addMessage} className="rounded border border-slate-300 px-2 py-1 text-sm hover:bg-slate-50">+ Add message</button>
)}
```
Keep the existing `ml-auto` placement working (put `+ Add item` first with `ml-auto`, then `+ Add message`, then `+ Add section` — adjust the `ml-auto` so the group is right-aligned; the implementer picks the cleanest arrangement that keeps all three buttons visible for page/section).

- [ ] **Step 4: Append a Canvas add-message test**

```tsx
test('Add message mints a pool message and appends a MessageRef element', async () => {
  useEditorStore.getState().select(['pages', 0])
  render(<Canvas />)
  const before = useEditorStore.getState().model!.pages[0].elements.length
  await userEvent.click(screen.getByRole('button', { name: /add message/i }))
  const st = useEditorStore.getState()
  expect(st.model!.pages[0].elements.length).toBe(before + 1)
  const added = st.model!.pages[0].elements[before] as { ref?: string }
  expect(added.ref).toMatch(/^msg_new_\d+@/)
  expect(st.pool[added.ref!]).toBeTruthy()
})
```

- [ ] **Step 5: Run + build + commit**

Run: `cd editor && npx vitest run src/canvas/ && npm run typecheck && npm run build` → green (existing Canvas tests still pass).
```bash
git add editor/src/canvas/MessagePane.tsx editor/src/canvas/MessagePane.test.tsx editor/src/canvas/Canvas.tsx editor/src/canvas/Canvas.test.tsx
git commit -m "feat(editor): + Add message + MessagePane routing for pool messages"
```

---

## Task 5: Playwright smoke + screenshot

**Files:**
- Modify: `editor/tests/e2e/smoke.spec.ts`

- [ ] **Step 1: Append the smoke test**

```ts
test('add a message + a context to a new item, type both, preview them', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /new questionnaire/i }).click()
  await page.getByRole('navigation', { name: /structure/i }).getByText(/page 1/i).first().click()

  // add a message, fill its text
  await page.getByRole('button', { name: /add message/i }).click()
  await page.getByLabel(/message text/i).fill('Welcome to the study')

  // add an item, add a context to it, fill prompt + context
  await page.getByRole('navigation', { name: /structure/i }).getByText(/page 1/i).first().click()
  await page.getByRole('button', { name: /add item/i }).click()
  await page.getByLabel(/prompt text/i).fill('How do you feel?')
  await page.getByRole('button', { name: /add context/i }).click()
  await page.getByLabel(/context text/i).fill('Think about the past week.')

  // preview shows the prompt + context
  await page.getByRole('button', { name: /preview/i }).click()
  const preview = page.getByRole('region', { name: /preview/i })
  await expect(preview.locator('h2.qv-prompt', { hasText: 'How do you feel?' })).toBeVisible()

  await page.screenshot({ path: 'tests/e2e/screenshots/ed-c2b-context-message.png', fullPage: true })
})
```
(Use `page.getByLabel` not `getByLabelText`. If selecting the new item before "+ Add context" is needed, the item auto-selects on add; if the context button isn't visible, the item view may need re-selecting via the tree — adjust + report. If the preview prompt assertion is the only reliable one, keep it; the screenshot captures the message+context.)

- [ ] **Step 2: Run**

Run: `cd editor && npm run build && npx playwright test` → all smokes pass; screenshot at `editor/tests/e2e/screenshots/ed-c2b-context-message.png`.

- [ ] **Step 3: Show owner the screenshot, then commit**

```bash
git add editor/tests/e2e/smoke.spec.ts
git commit -m "test(editor): Playwright context+message authoring smoke + ED-C2b screenshot"
```

---

## Task 6: README + FOLLOWUPS

**Files:**
- Modify: `editor/README.md`, `editor/FOLLOWUPS.md`

- [ ] **Step 1: README** — add an "ED-C2b — Context/Instruction + Message" section: add a Context and/or Instruction to a question (new pool entities; Instruction has a `dimension`); add standalone Messages to pages ("+ Add message", `type` tags + text); all live-preview + bundle-export. Update the does/doesn't list (does: author Context/Instruction/Message; doesn't yet: pick-from-Library [ED-C3], fork Library content [ED-C4], translate [ED-E], Placeholder/Help/RegEx/Solution standalone editors).

- [ ] **Step 2: FOLLOWUPS** — append:
  - (w) Removing a Context/Instruction drops its pool entity; if the same entity were referenced elsewhere this would orphan that reference — not a C2b scenario (minted per-add), revisit if shared refs become possible.
  - (x) Message `type` is a free comma-tag input (open vocabulary); an empty tag list is invalid (Schema-2 `minItems:1`) and banner-surfaced, not silently re-defaulted.
  - (y) Standalone Placeholder/Help/RegEx/Solution authoring isn't surfaced (Placeholder/Help are inline-editable inside the Option editor); add if a need arises.
  - (z) ED-C1 FOLLOWUP (q) — shared-option-section child list — still open; not addressed in C2b.

- [ ] **Step 3: Commit**

```bash
git add editor/README.md editor/FOLLOWUPS.md
git commit -m "docs(editor): ED-C2b README + FOLLOWUPS"
```

---

## Final verification

```bash
cd editor && npm test && npm run typecheck && npm run build && npx playwright test
```
All green. ED-C2b success: add Context + Instruction to a question and a Message to a page (all pool drafts), edit them, see them in the live preview, remove context/instruction; everything in the bundle export; questionnaire round-trips Schema-2-valid once text filled.

---

## Self-review notes (author)

**Spec coverage:** ContentTextEditor (Task 2) ✓; Context/Instruction add/edit/remove on a Question, pool-aware + Library-pin read-only (Task 3) ✓; Instruction `dimension` (Task 2) ✓; Message authoring + "+ Add message" + MessagePane routing (Tasks 2,4) ✓; pure minters (Task 1) ✓; `unsetNodeProp` for removing question sub-refs (Task 1) ✓; remove drops pool entity (Task 3) ✓; reuse pool→preview→bundle (no new wiring — inherited) ✓; Playwright smoke (Task 5) ✓; README/FOLLOWUPS (Task 6) ✓.

**Deferred per spec (no task, intentional):** pick-from-Library (C3); fork Library-pinned content (C4); translation (ED-E); standalone Placeholder/Help/RegEx/Solution; saved Question/Item entities; ED-C1 (q) shared-option child list.

**Type consistency:** `ContentMap` (ContentTextEditor) used by Context/Instruction/Message editors; `ContextBody`/`InstructionBody`/`MessageBody` used in their editors + ItemEditor/MessagePane casts; `buildContext`/`buildInstruction`/`buildMessage` `{ref, body}` shape used in ItemEditor + Canvas; `unsetNodeProp(model, path, key)` (tree.ts) used in ItemEditor removes; `collectIds`/`draftVersion`/`mintEntityId` reused from mint.ts; store `upsertPoolEntity`/`removePoolEntity`/`pool` consistent.

**Build-order:** Task 1 (pure helpers) → Task 2 (editors) → Task 3 (ItemEditor uses editors+minters+unsetNodeProp) → Task 4 (Canvas+MessagePane use editor+minter) → 5/6. Each independently green.
