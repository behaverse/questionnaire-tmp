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

test('New block adds a block to the model', async () => {
  render(<StructureTree />)
  await userEvent.click(screen.getByRole('button', { name: /\+ block/i }))
  expect(useEditorStore.getState().model!.blocks?.length).toBe(1)
})

it('marks the selected row with aria-current', async () => {
  render(<StructureTree />)
  const firstPage = (phq9 as Questionnaire).pages[0]
  const row = screen.getByText(firstPage.title ?? firstPage.id)
  await userEvent.click(row)
  expect(screen.getByText(firstPage.title ?? firstPage.id).closest('[aria-current="true"]')).toBeTruthy()
})

it('shows resolved prompt text for an item row when content is in the pool', () => {
  // seed one item prompt body into the store pool, then render
  const st = useEditorStore.getState()
  const m = st.model!
  // PHQ-9 items live in sections; search recursively for first element with question.prompt.ref
  function findRef(elements: Record<string, unknown>[]): string | undefined {
    for (const el of elements) {
      const q = el.question as Record<string, unknown> | undefined
      const ref = (q?.prompt as { ref?: string } | undefined)?.ref
      if (ref) return ref
      const sub = el.elements as Record<string, unknown>[] | undefined
      if (sub) { const r = findRef(sub); if (r) return r }
    }
  }
  const allEls = m.pages.flatMap((p) => p.elements as Record<string, unknown>[])
  const ref = findRef(allEls)
  expect(ref).toBeTruthy() // fixture must have at least one item
  useEditorStore.setState({ pool: { ...st.pool, [ref!]: { id: ref!.split('@')[0], content: { en: { text: 'Readable prompt text' } } } } as never })
  render(<StructureTree />)
  expect(screen.getByText('Readable prompt text')).toBeInTheDocument()
})

it('lists an item\'s sub-elements (option) under the item row', () => {
  const model = {
    metadata: { id: 'qst_t', title: 'T', version: 'v26.0606', language: 'en' },
    pages: [{ id: 'p1', title: 'P', elements: [
      { option: { ref: 'opt_agreement_7@v26.0606' },
        question: { prompt: { ref: 'pr_q1@v26.0606' }, instruction: { ref: 'ins_x@v26.0606' } } },
    ] }],
  } as unknown as Questionnaire
  useEditorStore.getState().reset()
  useEditorStore.getState().loadModel(model, { kind: 'new' })
  render(<StructureTree />)
  expect(screen.getByText(/option opt_agreement_7 · instruction ins_x/)).toBeInTheDocument()
})
