import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import phq9 from '../__fixtures__/phq9.json'
import type { Questionnaire } from '../model/types'
import { useEditorStore } from '../state/store'
import { deleteNode } from '../model/tree'
import { Canvas } from './Canvas'

beforeEach(() => {
  useEditorStore.getState().reset()
  useEditorStore.getState().loadModel(phq9 as Questionnaire, { kind: 'file', name: 'phq9.json' })
})

test('with a page selected, shows its elements and an Add control', () => {
  useEditorStore.getState().select(['pages', 0])
  render(<Canvas />)
  expect(screen.getByRole('button', { name: /add section/i })).toBeInTheDocument()
  const firstEl = (phq9 as Questionnaire).pages[0].elements[0] as Record<string, unknown>
  const ref = typeof firstEl.ref === 'string' ? firstEl.ref
    : ((firstEl.question as Record<string, unknown>)?.prompt as { ref?: string })?.ref
  if (ref) expect(screen.getByText(ref.split('@')[0])).toBeInTheDocument()
})

it('shows resolved prompt text (and the bare id as secondary) in an item row', () => {
  // purpose-built model with a TOP-LEVEL item so the row renders directly under the page
  const model = {
    metadata: { id: 'qst_t', title: 'T', version: 'v26.0606', language: 'en' },
    pages: [{ id: 'p1', title: 'P', elements: [
      { option: { ref: 'opt_a@v26.0606' }, question: { prompt: { ref: 'pr_q1@v26.0606' } } },
    ] }],
  } as unknown as Questionnaire
  useEditorStore.getState().reset()
  useEditorStore.getState().loadModel(model, { kind: 'new' }, {
    'pr_q1@v26.0606': { id: 'pr_q1', content: { en: { text: 'Canvas readable text' } } } as never,
  })
  useEditorStore.getState().select(['pages', 0])
  render(<Canvas />)
  expect(screen.getByText('Canvas readable text')).toBeInTheDocument() // primary = resolved text
  expect(screen.getByText('pr_q1')).toBeInTheDocument()               // secondary = bare id (no @version)
})

test('selecting an item with a ref-based option opens the item editor (not a stub)', () => {
  // BIS/BAS-style item: prompt AND option are Library refs (not inline). This must
  // route to the ItemEditor, not the old "Editing item content arrives in ED-C" stub.
  const model = {
    metadata: { id: 'qst_t', title: 'T', version: 'v26.0606', language: 'en' },
    pages: [{ id: 'p1', title: 'P', elements: [
      { option: { ref: 'opt_agreement_7@v26.0606' }, question: { prompt: { ref: 'pr_x@v26.0606' } } },
    ] }],
  } as unknown as Questionnaire
  useEditorStore.getState().reset()
  useEditorStore.getState().loadModel(model, { kind: 'file', name: 't.json' })
  useEditorStore.getState().select(['pages', 0, 'elements', 0])
  render(<Canvas />)
  expect(screen.getByText('Option (Response)')).toBeInTheDocument()
  expect(screen.getByText('opt_agreement_7@v26.0606')).toBeInTheDocument()
  expect(screen.queryByText(/arrives in ED-C/i)).toBeNull()
})

test('Add section inserts a section into the selected page', async () => {
  useEditorStore.getState().select(['pages', 0])
  render(<Canvas />)
  const before = useEditorStore.getState().model!.pages[0].elements.length
  await userEvent.click(screen.getByRole('button', { name: /add section/i }))
  expect(useEditorStore.getState().model!.pages[0].elements.length).toBe(before + 1)
})

test('deleting the selected node does not crash the canvas', () => {
  // Select the section at pages[0].elements[0] and render the canvas for it.
  useEditorStore.getState().select(['pages', 0, 'elements', 0])
  const { rerender } = render(<Canvas />)
  // Delete the selected node out from under the canvas (as a tree delete would).
  act(() => {
    useEditorStore.getState().applyEdit((m) => deleteNode(m, ['pages', 0, 'elements', 0]))
  })
  // Re-render: with a stale selection, nodeKind(model, selection) would throw.
  // It must not. The model still has the page.
  rerender(<Canvas />)
  expect(useEditorStore.getState().model!.pages[0]).toBeTruthy()
})

test('Add item mints a pool prompt and appends an inline item, then selects it', async () => {
  useEditorStore.getState().select(['pages', 0])
  render(<Canvas />)
  const before = useEditorStore.getState().model!.pages[0].elements.length
  await userEvent.click(screen.getByRole('button', { name: /add item/i }))
  // "+ Add item" opens the picker (reuse-first); "Create new" runs the mint via onCreate.
  const picker = useEditorStore.getState().picker
  expect(picker?.etype).toBe('item')
  act(() => picker!.onCreate!())
  const st = useEditorStore.getState()
  expect(st.model!.pages[0].elements.length).toBe(before + 1)
  expect(Object.keys(st.pool).length).toBeGreaterThan(0)
  const added = st.model!.pages[0].elements[before] as { question: { prompt: { ref: string } } }
  expect(st.pool[added.question.prompt.ref]).toBeTruthy()
})

test('Add message mints a pool message and appends a MessageRef element', async () => {
  useEditorStore.getState().select(['pages', 0])
  render(<Canvas />)
  const before = useEditorStore.getState().model!.pages[0].elements.length
  await userEvent.click(screen.getByRole('button', { name: /add message/i }))
  const picker = useEditorStore.getState().picker
  expect(picker?.etype).toBe('message')
  act(() => picker!.onCreate!())
  const st = useEditorStore.getState()
  expect(st.model!.pages[0].elements.length).toBe(before + 1)
  const added = st.model!.pages[0].elements[before] as { ref?: string }
  expect(added.ref).toMatch(/^msg_new_\d+@/)
  expect(st.pool[added.ref!]).toBeTruthy()
})

test('Add item opens the item picker; onPick inserts a saved-item ref', async () => {
  useEditorStore.getState().select(['pages', 0])
  render(<Canvas />)
  const before = useEditorStore.getState().model!.pages[0].elements.length
  await userEvent.click(screen.getByRole('button', { name: /add item/i }))
  expect(useEditorStore.getState().picker?.etype).toBe('item')
  useEditorStore.getState().picker!.onPick('it_lib@v26.0609')
  const els = useEditorStore.getState().model!.pages[0].elements
  expect(els.length).toBe(before + 1)
  expect((els[before] as { ref: string }).ref).toBe('it_lib@v26.0609')
})

test('keeps an accessible Delete name on item rows', () => {
  useEditorStore.getState().select(['pages', 0])
  render(<Canvas />)
  expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument()
})

test('toggling Required on an item row sets the element required flag', async () => {
  // phq9 page 0 is a matrix section (no item rows), so load a small model with an
  // inline item element to genuinely exercise the Required checkbox.
  const model = {
    metadata: { id: 'qst_t', title: 'T', description: 'd', version: 'v26.0609', language: 'en' },
    pages: [{ id: 'p1', title: 'P', elements: [{ question: { prompt: { ref: 'pr_x@v26.0609.dev1' } }, option: {
      input_data_type: 'text', measurement_type: 'nominal', content: { en: { status: 'draft', label: 'L' } } } }] }],
  } as unknown as Questionnaire
  useEditorStore.getState().reset()
  useEditorStore.getState().loadModel(model, { kind: 'file', name: 't.json' })
  useEditorStore.getState().select(['pages', 0])
  render(<Canvas />)
  const checks = screen.queryAllByRole('checkbox', { name: /required/i })
  expect(checks.length).toBeGreaterThan(0) // an inline item row exists
  await userEvent.click(checks[0])
  // the first item element on the page now has required true (or toggled)
  const els = useEditorStore.getState().model!.pages[0].elements as Array<Record<string, unknown>>
  const firstItem = els.find((e) => 'question' in e || (typeof e.ref === 'string' && (e.ref as string).startsWith('it_')))
  expect(firstItem && 'required' in firstItem).toBe(true)
  expect(firstItem && firstItem.required).toBe(true)
})
