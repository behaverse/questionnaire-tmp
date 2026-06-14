import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useEditorStore } from '../state/store'
import { ItemEditor } from './ItemEditor'
import type { Questionnaire } from '../model/types'

const model = {
  metadata: { id: 'qst_t', title: 'T', description: 'd', version: 'v26.0609', language: 'en' },
  pages: [{ id: 'page_1', title: 'P', elements: [
    { question: { prompt: { ref: 'pr_x@v26.0609' } }, option: {
      input_data_type: 'choice', measurement_type: 'ordinal', selection: 'single',
      options: [{ index: 1, value: 0 }, { index: 2, value: 1 }],
      content: { en: { status: 'draft', label: 'Scale', options: [{ index: 1, text: 'No' }, { index: 2, text: 'Yes' }] } } } },
  ] }],
} as unknown as Questionnaire

beforeEach(() => { useEditorStore.getState().reset(); useEditorStore.getState().loadModel(model, { kind: 'file', name: 't.json' }) })

test('edits the selected inline item option in the model', async () => {
  useEditorStore.getState().select(['pages', 0, 'elements', 0])
  render(<ItemEditor path={['pages', 0, 'elements', 0]} />)
  await userEvent.click(screen.getByRole('button', { name: /add choice/i }))
  const opt = (useEditorStore.getState().model!.pages[0].elements[0] as { option: { options: unknown[] } }).option
  expect(opt.options).toHaveLength(3)
})

test('shows the prompt ref chip read-only with an ED-C2 note', () => {
  render(<ItemEditor path={['pages', 0, 'elements', 0]} />)
  expect(screen.getByText('pr_x@v26.0609')).toBeInTheDocument()
  expect(screen.getByText(/ED-C2/i)).toBeInTheDocument()
})
