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
