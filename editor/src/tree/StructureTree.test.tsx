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
