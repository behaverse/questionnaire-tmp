import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PreviewPane } from './PreviewPane'
import type { FetchEntity } from './resolver'
import { useEditorStore } from '../state/store'
import type { Questionnaire } from '../model/types'

const bodies: Record<string, Record<string, unknown>> = {
  'pr_a@v1': { id: 'pr_a', content: { en: { status: 'validated', text: 'How are you?' }, pt: { status: 'validated', text: 'Como está?' } } },
  'opt_a@v1': { id: 'opt_a', input_data_type: 'choice', measurement_type: 'ordinal', selection: 'single',
    options: [{ index: 1, value: 0 }, { index: 2, value: 1 }],
    content: { en: { status: 'validated', options: [{ index: 1, text: 'No' }, { index: 2, text: 'Yes' }] },
               pt: { status: 'validated', options: [{ index: 1, text: 'Não' }, { index: 2, text: 'Sim' }] } } },
}
const fetchEntity: FetchEntity = async (ref) => bodies[ref] ?? null

const model = {
  metadata: { id: 'qst_t', title: 'T', language: 'en', available_languages: ['en', 'pt'] },
  pages: [{ id: 'p1', title: 'Page 1', elements: [{ question: { prompt: { ref: 'pr_a@v1' } }, option: { ref: 'opt_a@v1' } }] }],
} as unknown as Questionnaire

beforeEach(() => { useEditorStore.getState().reset(); useEditorStore.getState().loadModel(model, { kind: 'file', name: 't.json' }) })

// The renderer emits each prompt twice: once as an sr-only <legend> for the
// item fieldset and once as the visible <h2 class="qv-prompt">. Scope queries
// to the visible heading so a single match is asserted (not a weakened check).
const visiblePrompt = (text: string) =>
  screen.findByText(text, { selector: 'h2.qv-prompt' })

test('renders resolved prompt text via the real renderer', async () => {
  render(<PreviewPane fetchEntity={fetchEntity} />)
  expect(await visiblePrompt('How are you?')).toBeInTheDocument()
})

test('language picker switches the rendered locale', async () => {
  render(<PreviewPane fetchEntity={fetchEntity} />)
  await visiblePrompt('How are you?')
  await userEvent.selectOptions(screen.getByLabelText(/language/i), 'pt')
  await waitFor(() => expect(screen.getByText('Como está?', { selector: 'h2.qv-prompt' })).toBeInTheDocument())
})
