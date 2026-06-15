# Editor ED-E (Translation Interface) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let authors translate the whole `content`-based surface by adding an "Editing language" switcher (drives the existing per-locale editors to edit any locale), a `metadata.available_languages` manager, and per-locale `status` + a source-text hint.

**Architecture:** The content editors + `option/ops` setters already take a `locale`; only `ItemEditor`/`MessagePane` hardcode the primary. ED-E adds store UI-state `editingLocale` + a topbar switcher, wires it into `ItemEditor`/`MessagePane` (replacing the hardcoded primary), adds a `setAvailableLanguages` tree helper + an Inspector `LanguagesField`, and adds a `status` control + source-text hint to the content editors. Missing `content[locale]` entries auto-create on first edit (existing behaviour). No preview change.

**Tech Stack:** Vite 6 · React 19 · TypeScript 5.7 · Tailwind · Zustand · Immer · vitest + RTL · Playwright.

---

## File Structure

**Create:**
- `editor/src/inspector/LanguagesField.tsx` — available_languages manager.
- `editor/src/app/EditingLocaleSwitcher.tsx` — topbar editing-language `<select>`.
- Test files alongside.

**Modify:**
- `editor/src/state/store.ts` — `editingLocale` + `setEditingLocale` (+ clear on load/reset).
- `editor/src/model/tree.ts` — `setAvailableLanguages`.
- `editor/src/inspector/Inspector.tsx` — mount `<LanguagesField/>`.
- `editor/src/app/Topbar.tsx` — mount `<EditingLocaleSwitcher/>`.
- `editor/src/canvas/ItemEditor.tsx` + `editor/src/canvas/MessagePane.tsx` — use `editingLocale ?? primary`; pass `primaryLocale` to editors.
- `editor/src/entity/ContentTextEditor.tsx` + `editor/src/entity/PromptEditor.tsx` — status `<select>` + optional source-text hint.
- `editor/src/option/ops.ts` + `editor/src/option/OptionEditor.tsx` — `setStatus` + a status control.
- `editor/FOLLOWUPS.md` — ED-E follow-ups.

---

## Task 1: store `editingLocale` + `setAvailableLanguages`

**Files:**
- Modify: `editor/src/state/store.ts`, `editor/src/model/tree.ts`
- Test: `editor/src/state/store.test.ts` (append), `editor/src/model/tree.test.ts` (append)

- [ ] **Step 1: Write the failing tests**

Append to `editor/src/model/tree.test.ts`:

```ts
import { setAvailableLanguages } from './tree'

describe('setAvailableLanguages', () => {
  const base = { metadata: { id: 'qst_x', language: 'en' }, pages: [] } as unknown as import('./types').Questionnaire
  it('sets available_languages (deduped, primary dropped) without mutating input', () => {
    const out = setAvailableLanguages(base, ['fr', 'fr', 'en', 'de'])
    expect(out.metadata.available_languages).toEqual(['fr', 'de'])
    expect(base.metadata.available_languages).toBeUndefined()
  })
  it('deletes the key when the set is empty (or just the primary)', () => {
    const out = setAvailableLanguages(setAvailableLanguages(base, ['fr']), ['en'])
    expect('available_languages' in out.metadata).toBe(false)
  })
})
```

Append to `editor/src/state/store.test.ts` (reuse its existing imports of `useEditorStore`; if it loads a model in a helper, mirror that):

```ts
describe('editingLocale', () => {
  it('defaults to null and is set by setEditingLocale', () => {
    useEditorStore.setState({ editingLocale: null })
    expect(useEditorStore.getState().editingLocale).toBeNull()
    useEditorStore.getState().setEditingLocale('fr')
    expect(useEditorStore.getState().editingLocale).toBe('fr')
  })
  it('is cleared to null on loadModel', () => {
    useEditorStore.getState().setEditingLocale('fr')
    useEditorStore.getState().loadModel({ metadata: { id: 'qst_x', language: 'en' }, pages: [] } as never, { kind: 'new' } as never)
    expect(useEditorStore.getState().editingLocale).toBeNull()
  })
})
```

- [ ] **Step 2: Run them to verify they fail**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps/editor && npx vitest run src/model/tree.test.ts src/state/store.test.ts`
Expected: FAIL — `setAvailableLanguages` not exported; `editingLocale`/`setEditingLocale` missing.

- [ ] **Step 3: Implement**

In `editor/src/model/tree.ts`, add (near `updateMetadata`):

```ts
export function setAvailableLanguages(model: Questionnaire, langs: string[]): Questionnaire {
  return produce(model, (draft) => {
    const primary = draft.metadata.language
    const set = [...new Set(langs.filter((l) => l && l !== primary))]
    if (set.length === 0) delete draft.metadata.available_languages
    else draft.metadata.available_languages = set
  })
}
```

In `editor/src/state/store.ts`:
- Add to the `EditorState` interface: `editingLocale: string | null` + `setEditingLocale: (locale: string | null) => void`.
- Add to the initial state object: `editingLocale: null,`.
- Add the action: `setEditingLocale: (locale) => set({ editingLocale: locale }),`.
- In `loadModel`'s `set({...})`, add `editingLocale: null`.
- In `reset`'s `set({...})`, add `editingLocale: null`.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps/editor && npx vitest run src/model/tree.test.ts src/state/store.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
cd /home/pedro/Repos/Cursor/questionnaire_apps
git add editor/src/state/store.ts editor/src/model/tree.ts editor/src/model/tree.test.ts editor/src/state/store.test.ts
git commit -m "feat(editor): ED-E editingLocale store state + setAvailableLanguages helper"
```

---

## Task 2: `LanguagesField` (available_languages manager)

**Files:**
- Create: `editor/src/inspector/LanguagesField.tsx`, `editor/src/inspector/LanguagesField.test.tsx`
- Modify: `editor/src/inspector/Inspector.tsx`

- [ ] **Step 1: Write the failing test**

Create `editor/src/inspector/LanguagesField.test.tsx`:

```tsx
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { LanguagesField } from './LanguagesField'
import { useEditorStore } from '../state/store'
import type { Questionnaire } from '../model/types'

const base = { metadata: { id: 'qst_x', title: 'X', language: 'en' }, pages: [] } as unknown as Questionnaire

describe('LanguagesField', () => {
  beforeEach(() => useEditorStore.getState().loadModel(structuredClone(base), { kind: 'new' } as never))

  it('shows the primary language as a non-removable chip', () => {
    render(<LanguagesField />)
    expect(screen.getByText('en')).toBeInTheDocument()
    expect(screen.getByText(/primary/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /remove en/i })).not.toBeInTheDocument()
  })
  it('adds a valid locale to available_languages', () => {
    render(<LanguagesField />)
    fireEvent.change(screen.getByLabelText('Add language'), { target: { value: 'fr' } })
    fireEvent.click(screen.getByRole('button', { name: /^add$/i }))
    expect(useEditorStore.getState().model!.metadata.available_languages).toEqual(['fr'])
  })
  it('rejects a malformed locale code', () => {
    render(<LanguagesField />)
    fireEvent.change(screen.getByLabelText('Add language'), { target: { value: 'Bad Code!' } })
    fireEvent.click(screen.getByRole('button', { name: /^add$/i }))
    expect(useEditorStore.getState().model!.metadata.available_languages).toBeUndefined()
  })
  it('removes a language', () => {
    useEditorStore.getState().applyEdit((m) => ({ ...m, metadata: { ...m.metadata, available_languages: ['fr', 'de'] } }))
    render(<LanguagesField />)
    fireEvent.click(screen.getByRole('button', { name: /remove fr/i }))
    expect(useEditorStore.getState().model!.metadata.available_languages).toEqual(['de'])
  })
})
```

- [ ] **Step 2: Run it to verify it fails**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps/editor && npx vitest run src/inspector/LanguagesField.test.tsx`
Expected: FAIL — `Cannot find module './LanguagesField'`.

- [ ] **Step 3: Implement**

Create `editor/src/inspector/LanguagesField.tsx`:

```tsx
import { useState } from 'react'
import { useEditorStore } from '../state/store'
import { setAvailableLanguages } from '../model/tree'

const LOCALE_RE = /^[a-z]{2,3}(-[A-Z][a-z]{3})?(-[A-Z]{2})?$/

export function LanguagesField() {
  const { model, applyEdit } = useEditorStore()
  const [draft, setDraft] = useState('')
  if (!model) return null
  const primary = String(model.metadata.language ?? 'en')
  const langs = (model.metadata.available_languages ?? []) as string[]
  const code = draft.trim()
  const invalid = code.length > 0 && !LOCALE_RE.test(code)
  const add = () => {
    if (!LOCALE_RE.test(code) || code === primary || langs.includes(code)) return
    applyEdit((m) => setAvailableLanguages(m, [...langs, code]))
    setDraft('')
  }
  const remove = (l: string) => applyEdit((m) => setAvailableLanguages(m, langs.filter((x) => x !== l)))

  return (
    <div className="space-y-1">
      <span className="block text-xs font-medium uppercase tracking-wide text-slate-500">Languages</span>
      <div className="flex flex-wrap items-center gap-1">
        <span className="rounded bg-slate-200 px-2 py-0.5 text-xs">{primary} <span className="text-slate-400">primary</span></span>
        {langs.map((l) => (
          <span key={l} className="flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-xs">
            {l}
            <button type="button" aria-label={`Remove ${l}`} onClick={() => remove(l)} className="text-slate-400 hover:text-red-600">×</button>
          </span>
        ))}
      </div>
      <div className="flex gap-1">
        <input aria-label="Add language" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="fr"
               className="w-20 rounded border border-slate-300 px-1 py-0.5 text-sm" />
        <button type="button" onClick={add} className="rounded border border-slate-300 px-2 py-0.5 text-xs hover:bg-slate-50">Add</button>
      </div>
      {invalid && <p className="text-[11px] text-red-600">Invalid locale code</p>}
    </div>
  )
}
```

- [ ] **Step 4: Mount it in the Inspector**

In `editor/src/inspector/Inspector.tsx`: add the import:

```tsx
import { LanguagesField } from './LanguagesField'
```

In the `kind === 'questionnaire'` branch, render `<LanguagesField />` right after the Language `TextField`:

```tsx
        <TextField label="Language" value={m.language ?? ''} onChange={(v) => applyEdit((mm) => updateMetadata(mm, { language: v }))} />
        <LanguagesField />
```

- [ ] **Step 5: Run tests + suite + typecheck**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps/editor && npx vitest run src/inspector/LanguagesField.test.tsx && npm run typecheck`
Expected: PASS (4 tests); typecheck clean.

- [ ] **Step 6: Commit**

```bash
cd /home/pedro/Repos/Cursor/questionnaire_apps
git add editor/src/inspector/LanguagesField.tsx editor/src/inspector/LanguagesField.test.tsx editor/src/inspector/Inspector.tsx
git commit -m "feat(editor): ED-E available_languages manager (Inspector LanguagesField)"
```

---

## Task 3: Editing-locale switcher + wire into ItemEditor/MessagePane

**Files:**
- Create: `editor/src/app/EditingLocaleSwitcher.tsx`, `editor/src/app/EditingLocaleSwitcher.test.tsx`
- Modify: `editor/src/app/Topbar.tsx`, `editor/src/canvas/ItemEditor.tsx`, `editor/src/canvas/MessagePane.tsx`
- Test: `editor/src/canvas/ItemEditor.test.tsx` (append a locale-wiring test)

- [ ] **Step 1: Write the failing tests**

Create `editor/src/app/EditingLocaleSwitcher.test.tsx`:

```tsx
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { EditingLocaleSwitcher } from './EditingLocaleSwitcher'
import { useEditorStore } from '../state/store'
import type { Questionnaire } from '../model/types'

const base = { metadata: { id: 'qst_x', language: 'en', available_languages: ['fr'] }, pages: [] } as unknown as Questionnaire

describe('EditingLocaleSwitcher', () => {
  beforeEach(() => useEditorStore.getState().loadModel(structuredClone(base), { kind: 'new' } as never))

  it('lists [primary, ...available_languages] and defaults to primary', () => {
    render(<EditingLocaleSwitcher />)
    const sel = screen.getByLabelText('Editing language') as HTMLSelectElement
    expect(sel.value).toBe('en')
    expect([...sel.options].map((o) => o.value)).toEqual(['en', 'fr'])
  })
  it('selecting a locale sets editingLocale', () => {
    render(<EditingLocaleSwitcher />)
    fireEvent.change(screen.getByLabelText('Editing language'), { target: { value: 'fr' } })
    expect(useEditorStore.getState().editingLocale).toBe('fr')
  })
})
```

Append a locale-wiring test to `editor/src/canvas/ItemEditor.test.tsx` (mirror the file's existing model+pool setup for an inline item whose prompt is a pool entity; the key assertions are below). If the existing setup differs, adapt the fixture but keep the assertions:

```tsx
it('edits the editing-locale content, not the primary', () => {
  // Load a model with an inline item whose prompt is a pool draft (mirror the file's existing setup),
  // then set the editing locale to 'fr' and edit the prompt text.
  useEditorStore.getState().setEditingLocale('fr')
  render(<ItemEditor path={/* the inline-item path used elsewhere in this file */ ['pages', 0, 'elements', 0]} />)
  // The PromptEditor label reflects the active locale:
  expect(screen.getByText(/Prompt text \(fr\)/)).toBeInTheDocument()
  fireEvent.change(screen.getByLabelText('Prompt text'), { target: { value: 'Bonjour' } })
  // The pool prompt now has content.fr.text = 'Bonjour'; content.en (primary) is untouched.
  const pool = useEditorStore.getState().pool
  const promptBody = Object.values(pool).find((b) => (b as { content?: Record<string, { text?: string }> }).content?.fr) as { content: Record<string, { text?: string }> }
  expect(promptBody.content.fr.text).toBe('Bonjour')
})
```

> Note: use the SAME inline-item-with-pool-prompt fixture the existing ItemEditor tests use (so the prompt resolves to a pool entity the PromptEditor renders). The two assertions that matter: the prompt-text label shows `(fr)`, and editing writes `content.fr.text` (leaving `content.en` intact).

- [ ] **Step 2: Run them to verify they fail**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps/editor && npx vitest run src/app/EditingLocaleSwitcher.test.tsx src/canvas/ItemEditor.test.tsx`
Expected: FAIL — `Cannot find module './EditingLocaleSwitcher'`; ItemEditor still edits `content.en` (label shows `(en)`).

- [ ] **Step 3: Implement the switcher**

Create `editor/src/app/EditingLocaleSwitcher.tsx`:

```tsx
import { useEditorStore } from '../state/store'

export function EditingLocaleSwitcher() {
  const model = useEditorStore((s) => s.model)
  const editingLocale = useEditorStore((s) => s.editingLocale)
  const setEditingLocale = useEditorStore((s) => s.setEditingLocale)
  if (!model) return null
  const primary = String(model.metadata.language ?? 'en')
  const locales = [primary, ...((model.metadata.available_languages ?? []) as string[]).filter((l) => l !== primary)]
  const value = editingLocale ?? primary
  return (
    <label className="flex items-center gap-1 text-sm">Editing
      <select aria-label="Editing language" value={value} onChange={(e) => setEditingLocale(e.target.value)}
              className="rounded border border-slate-300 px-1 py-0.5">
        {locales.map((l) => <option key={l} value={l}>{l}</option>)}
      </select>
      {value !== primary && <span className="text-[11px] text-amber-600">translating</span>}
    </label>
  )
}
```

- [ ] **Step 4: Mount it in the Topbar + wire the editing locale**

In `editor/src/app/Topbar.tsx`: add `import { EditingLocaleSwitcher } from './EditingLocaleSwitcher'` and render `<EditingLocaleSwitcher />` as the first child of the `ml-auto` button group (before the staleness/Validate items).

In `editor/src/canvas/ItemEditor.tsx`: replace `const locale = String(model.metadata.language ?? 'en')` with:

```tsx
  const editingLocale = useEditorStore((s) => s.editingLocale)
  const locale = editingLocale ?? String(model.metadata.language ?? 'en')
  const primaryLocale = String(model.metadata.language ?? 'en')
```

and pass `primaryLocale={primaryLocale}` to each `<PromptEditor>`/`<ContextEditor>`/`<InstructionEditor>` (the `primaryLocale` prop is added in Task 4; passing it now is forward-compatible — TS will accept it once Task 4 adds the optional prop, so do Task 4's editor-signature change first OR add the prop as optional here). To avoid an ordering hazard: in THIS task, only change the `locale` wiring (the `editingLocale ?? primary` line); add the `primaryLocale=` props in Task 4 alongside the editor signature change.

In `editor/src/canvas/MessagePane.tsx`: replace `const locale = String(model.metadata.language ?? 'en')` with the same `editingLocale ?? primary` pattern (add `const editingLocale = useEditorStore((s) => s.editingLocale)`; the store is already used in MessagePane — confirm and reuse its selector).

- [ ] **Step 5: Run the tests to verify they pass**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps/editor && npx vitest run src/app/EditingLocaleSwitcher.test.tsx src/canvas/ItemEditor.test.tsx && npm run typecheck`
Expected: PASS — switcher tests + the ItemEditor locale-wiring test (label `(fr)`, writes `content.fr`); typecheck clean.

- [ ] **Step 6: Full suite**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps/editor && npx vitest run`
Expected: all tests pass (existing ItemEditor/MessagePane tests still green — with `editingLocale` null they resolve to the primary, unchanged behaviour).

- [ ] **Step 7: Commit**

```bash
cd /home/pedro/Repos/Cursor/questionnaire_apps
git add editor/src/app/EditingLocaleSwitcher.tsx editor/src/app/EditingLocaleSwitcher.test.tsx editor/src/app/Topbar.tsx editor/src/canvas/ItemEditor.tsx editor/src/canvas/MessagePane.tsx editor/src/canvas/ItemEditor.test.tsx
git commit -m "feat(editor): ED-E editing-language switcher wired into ItemEditor/MessagePane"
```

---

## Task 4: Per-locale status + source-text hint

**Files:**
- Modify: `editor/src/entity/ContentTextEditor.tsx`, `editor/src/entity/PromptEditor.tsx`, `editor/src/entity/ContextEditor.tsx`, `editor/src/entity/InstructionEditor.tsx`, `editor/src/entity/MessageEditor.tsx`, `editor/src/option/ops.ts`, `editor/src/option/OptionEditor.tsx`, `editor/src/canvas/ItemEditor.tsx`
- Test: `editor/src/entity/ContentTextEditor.test.tsx` (create/append), `editor/src/option/ops.test.ts` (append)

- [ ] **Step 1: Write the failing tests**

Create/append `editor/src/entity/ContentTextEditor.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ContentTextEditor } from './ContentTextEditor'

describe('ContentTextEditor status + source hint', () => {
  it('renders a status select bound to content[locale].status', () => {
    const onChange = vi.fn()
    render(<ContentTextEditor content={{ fr: { status: 'draft', text: 'Bonjour' } }} locale="fr" label="Text" onChange={onChange} />)
    fireEvent.change(screen.getByLabelText('Text status'), { target: { value: 'complete' } })
    expect(onChange).toHaveBeenCalledWith({ fr: { status: 'complete', text: 'Bonjour' } })
  })
  it('shows the primary source text when translating a non-primary locale', () => {
    render(<ContentTextEditor content={{ en: { status: 'validated', text: 'Hello' } }} locale="fr" label="Text" primaryLocale="en" onChange={() => {}} />)
    expect(screen.getByText(/Hello/)).toBeInTheDocument()
  })
})
```

Append to `editor/src/option/ops.test.ts`:

```ts
import { setStatus } from './ops'

describe('setStatus', () => {
  const opt = { input_data_type: 'choice', measurement_type: 'nominal', content: { en: { status: 'draft' } } } as unknown as import('./ops').EditableOption
  it('sets content[locale].status without mutating input', () => {
    const out = setStatus(opt, 'fr', 'complete')
    expect(out.content.fr.status).toBe('complete')
    expect(opt.content.fr).toBeUndefined()
  })
})
```

- [ ] **Step 2: Run them to verify they fail**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps/editor && npx vitest run src/entity/ContentTextEditor.test.tsx src/option/ops.test.ts`
Expected: FAIL — no status select / no source hint / `setStatus` not exported.

- [ ] **Step 3: Implement `ContentTextEditor`**

Replace `editor/src/entity/ContentTextEditor.tsx` with:

```tsx
export interface ContentMap { [lang: string]: { status: string; text?: string } }

const STATUSES = ['draft', 'complete', 'validated']

export function ContentTextEditor({ content, locale, label, primaryLocale, onChange }: {
  content: ContentMap; locale: string; label: string; primaryLocale?: string; onChange: (c: ContentMap) => void
}) {
  const entry = content?.[locale] ?? { status: 'draft' }
  const setText = (text: string) => onChange({ ...content, [locale]: { ...entry, status: entry.status ?? 'draft', text } })
  const setStatus = (status: string) => onChange({ ...content, [locale]: { ...entry, status } })
  const source = primaryLocale && primaryLocale !== locale ? content?.[primaryLocale]?.text : undefined
  return (
    <div className="space-y-1">
      <label className="block text-sm">{label} ({locale})
        <textarea aria-label={label} value={entry.text ?? ''} onChange={(e) => setText(e.target.value)} rows={2}
                  className="mt-1 w-full rounded border border-slate-300 px-2 py-1" />
      </label>
      {source !== undefined && <p className="text-[11px] text-slate-400">primary: {source || '(empty)'}</p>}
      <label className="text-xs text-slate-500">Status
        <select aria-label={`${label} status`} value={entry.status ?? 'draft'} onChange={(e) => setStatus(e.target.value)}
                className="ml-1 rounded border border-slate-300 px-1 py-0.5">
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </label>
    </div>
  )
}
```

- [ ] **Step 4: Thread `primaryLocale` through the entity editors + PromptEditor status**

In `editor/src/entity/ContextEditor.tsx`, `InstructionEditor.tsx`, `MessageEditor.tsx`: add an optional `primaryLocale?: string` prop and pass it to `<ContentTextEditor primaryLocale={primaryLocale} … />`. (Read each file; they wrap `ContentTextEditor` — add the prop to their signature + the passthrough.)

In `editor/src/entity/PromptEditor.tsx`: add `primaryLocale?: string` to the props; add a status `<select>` (aria "Prompt text status") bound to `prompt.content[locale].status` (a `setStatus` local mirroring `setText`); and, when `primaryLocale && primaryLocale !== locale`, a read-only `primary: {prompt.content?.[primaryLocale]?.text || '(empty)'}` line under the textarea:

```tsx
  const setStatus = (status: string) =>
    onChange({ ...prompt, content: { ...prompt.content, [locale]: { ...entry, status } } })
  const source = primaryLocale && primaryLocale !== locale ? prompt.content?.[primaryLocale]?.text : undefined
```

Render after the Prompt text `<label>`:

```tsx
      {source !== undefined && <p className="text-[11px] text-slate-400">primary: {source || '(empty)'}</p>}
      <label className="text-xs text-slate-500">Status
        <select aria-label="Prompt text status" value={entry.status ?? 'draft'} onChange={(e) => setStatus(e.target.value)}
                className="ml-1 rounded border border-slate-300 px-1 py-0.5">
          {['draft', 'complete', 'validated'].map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </label>
```

In `editor/src/canvas/ItemEditor.tsx`: pass `primaryLocale={primaryLocale}` (defined in Task 3) to each `<PromptEditor>`/`<ContextEditor>`/`<InstructionEditor>`.

- [ ] **Step 5: Implement `setStatus` op + OptionEditor status**

In `editor/src/option/ops.ts`, add (mirror `setLabel`):

```ts
export function setStatus(opt: EditableOption, locale: string, status: string): EditableOption {
  const next = clone(opt); const e = ensureEntry(next, locale); e.status = status; return next
}
```

In `editor/src/option/OptionEditor.tsx`: import `setStatus`; add a status `<select>` (aria "Option status") near the Label field, bound to `option.content?.[locale]?.status ?? 'draft'` → `onChange(setStatus(option, locale, e.target.value))`.

- [ ] **Step 6: Run the tests to verify they pass**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps/editor && npx vitest run src/entity/ContentTextEditor.test.tsx src/option/ops.test.ts && npm run typecheck`
Expected: PASS; typecheck clean.

- [ ] **Step 7: Full suite**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps/editor && npx vitest run`
Expected: all tests pass (existing ContentTextEditor/PromptEditor/OptionEditor consumers still work — `primaryLocale` is optional; the status select is additive).

- [ ] **Step 8: Commit**

```bash
cd /home/pedro/Repos/Cursor/questionnaire_apps
git add editor/src/entity/ContentTextEditor.tsx editor/src/entity/PromptEditor.tsx editor/src/entity/ContextEditor.tsx editor/src/entity/InstructionEditor.tsx editor/src/entity/MessageEditor.tsx editor/src/option/ops.ts editor/src/option/OptionEditor.tsx editor/src/canvas/ItemEditor.tsx editor/src/entity/ContentTextEditor.test.tsx editor/src/option/ops.test.ts
git commit -m "feat(editor): ED-E per-locale status control + source-text hint"
```

---

## Task 5: Playwright smoke + screenshot

**Files:**
- Create: `editor/tests/e2e/translation.spec.ts`

Reuse `editor/src/__fixtures__/show_if_demo.json` (a loaded questionnaire with pool prompt refs resolved via the stubbed endpoint). NOTE: its items reference Library prompts (read-only), so to translate via the panel the e2e needs an editable POOL prompt. Simplest: create a new questionnaire in-app and add an item (its prompt is a pool draft), OR reuse the "new item" flow. Use whichever the existing e2e specs make easiest (the ED-C2a smoke `add a new item, type a prompt` in `smoke.spec.ts` creates a pool prompt via "New questionnaire" + "+ Add item").

- [ ] **Step 1: Write the smoke spec**

Create `editor/tests/e2e/translation.spec.ts`. Mirror the ED-C2a "new item" smoke (`editor/tests/e2e/smoke.spec.ts`) to get an editable pool prompt, then exercise translation:

```ts
import { test, expect } from '@playwright/test'

test('translate a prompt into a second language', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /new questionnaire/i }).click()
  await expect(page.getByRole('navigation', { name: /structure/i })).toBeVisible()

  // Add a supported language in the Inspector (questionnaire root shown by default).
  await page.getByLabel('Add language').fill('fr')
  await page.getByRole('button', { name: /^add$/i }).click()

  // Add an item + author the primary (en) prompt.
  await page.getByRole('navigation', { name: /structure/i }).getByText(/page 1/i).first().click()
  await page.getByRole('button', { name: /add item/i }).click()
  await page.getByLabel(/prompt text/i).fill('How are you?')

  // Switch the editing language to fr and translate.
  await page.getByLabel('Editing language').selectOption('fr')
  await expect(page.getByText(/primary: How are you\?/)).toBeVisible() // source-text hint
  await page.getByLabel(/prompt text/i).fill('Comment ça va ?')

  // Preview in fr → the translated text renders.
  await page.getByRole('button', { name: /preview/i }).click()
  const preview = page.getByRole('region', { name: /preview/i })
  await preview.getByLabel('Preview language').selectOption('fr')
  await expect(preview.locator('h2.qv-prompt', { hasText: 'Comment ça va ?' })).toBeVisible()

  await page.screenshot({ path: 'tests/e2e/screenshots/ed-e-translation.png', fullPage: true })
})
```

> Verify selectors against the running app + the ED-C2a smoke (the "+ Add item" + "prompt text" labels are from PromptEditor; "Add language"/"Editing language" from this stage; "Preview language" from PreviewPane). Use `page.getByLabel`/`getByRole` only. If the "new questionnaire" path differs, mirror the exact ED-C2a smoke steps.

- [ ] **Step 2: Run the smoke**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps/editor && npm run e2e -- translation`
Expected: PASS + screenshot at `tests/e2e/screenshots/ed-e-translation.png` (install chromium first if needed). If chromium can't run here, commit the spec + report the exact failure; do NOT weaken assertions. Confirm the screenshot shows the editing-language switcher set to `fr` + the translated preview.

- [ ] **Step 3: Commit**

```bash
cd /home/pedro/Repos/Cursor/questionnaire_apps
git add editor/tests/e2e/translation.spec.ts
git commit -m "test(editor): ED-E Playwright translation smoke + screenshot"
```

---

## Task 6: FOLLOWUPS + final verification

**Files:**
- Modify: `editor/FOLLOWUPS.md`

- [ ] **Step 1: Append the ED-E follow-ups**

Add to `editor/FOLLOWUPS.md`:

```markdown
# ED-E Follow-ups

Known limitations and open items carried out of ED-E (translation interface).

## (uuu) Side-by-side translation matrix is deferred (E2)

ED-E translates via an editing-language switcher (reusing the per-locale editors). The richer
design §7 side-by-side source/target matrix (all translatable strings × locales + bulk status)
is a follow-on (E2).

## (vvv) Page/Section/Block + metadata title translations not covered

Page/Section/Block titles use a separate `translations: { <locale>: {status, title?} }` map (not
`content`), and `metadata.title`/`description` are plain strings — ED-E translates only the
`content`-based surface (prompts/options/contexts/instructions/messages/placeholders/help). Title
translation is deferred.

## (www) Validation-message + metadata-title localization is a schema gap

Per-question/cross-question validation `message`s and `metadata.title`/`description` are PLAIN
STRINGS in Schema 2 (not language-keyed), despite design §5 calling messages "translatable".
Making them per-locale is an upstream schema change (owner decision), out of editor scope.

## (xxx) Removing a language is non-destructive

Removing a locale from `available_languages` does NOT prune authored `content[locale]` entries
(avoids silent data loss). An orphaned translation stays in the data until manually cleared; the
deployed viewer ignores locales not in `available_languages`.

## (yyy) Translating a Library entity requires forking

Library-ref entities are read-only; the editing-language switcher only affects POOL entities +
inline options. To translate a Library entity, fork it first (ED-C4) — then its content is
editable per-locale.

## (zzz) Editing locale vs preview locale are independent

The topbar "Editing language" (which locale you edit) and the preview's "Preview language"
(which you view) are separate controls — you can edit `fr` while viewing `en`. By design.
```

- [ ] **Step 2: Final full suite + typecheck**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps/editor && npm run typecheck && npx vitest run`
Expected: typecheck clean; all tests pass.

- [ ] **Step 3: Production build smoke**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps/editor && npm run build`
Expected: succeeds, emits the wasm asset.

- [ ] **Step 4: Commit**

```bash
cd /home/pedro/Repos/Cursor/questionnaire_apps
git add editor/FOLLOWUPS.md
git commit -m "docs(editor): ED-E FOLLOWUPS"
```

---

## Done criteria (mirror of spec §5)

1. `metadata.available_languages` manageable from the Inspector (add/remove; primary always included); round-trips Schema-2-valid. — Tasks 1, 2.
2. The "Editing language" switcher makes the `content`-based surface edit the chosen locale, reusing the existing editors; missing entries auto-create. — Tasks 1, 3.
3. Per-locale `status` editable + a source-text hint. — Task 4.
4. The preview renders the chosen locale (its picker reflects added languages). — verified by Task 5 (no preview code change needed).
5. All suites green; screenshot delivered. — Tasks 5, 6.

After the branch is green: merge to master locally + push (NO PR — owner preference), then write `project_editor_ed_e` memory + MEMORY.md line + HANDOFF update.
```
