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
  if (typeof firstEl.ref === 'string') expect(screen.getByText(firstEl.ref)).toBeInTheDocument()
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
  const st = useEditorStore.getState()
  expect(st.model!.pages[0].elements.length).toBe(before + 1)
  const added = st.model!.pages[0].elements[before] as { ref?: string }
  expect(added.ref).toMatch(/^msg_new_\d+@/)
  expect(st.pool[added.ref!]).toBeTruthy()
})
