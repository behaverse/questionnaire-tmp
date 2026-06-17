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
