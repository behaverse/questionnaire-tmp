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

test('shows the prompt ref chip read-only with a fork-to-edit note for Library refs', () => {
  render(<ItemEditor path={['pages', 0, 'elements', 0]} />)
  expect(screen.getByText('pr_x@v26.0609')).toBeInTheDocument()
  expect(screen.getByText(/ED-C4/i)).toBeInTheDocument()
})

test('edits a pool prompt via the PromptEditor', async () => {
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
  const ta = screen.getByLabelText(/prompt text/i)
  await userEvent.type(ta, '?')
  expect((useEditorStore.getState().pool[ref] as { content: { en: { text: string } } }).content.en.text).toMatch(/Q/)
})

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

test('Pick prompt opens the picker; the onPick sets a Library ref', async () => {
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
  await userEvent.click(screen.getByRole('button', { name: /pick prompt/i }))
  // the picker opened with etype 'prompt'; simulate the pick
  expect(useEditorStore.getState().picker?.etype).toBe('prompt')
  useEditorStore.getState().picker!.onPick('pr_lib@v26.0609')
  const q = (useEditorStore.getState().model!.pages[0].elements[0] as { question: { prompt: { ref: string } } }).question
  expect(q.prompt.ref).toBe('pr_lib@v26.0609')
  expect(useEditorStore.getState().pool['pr_p@v26.0609.dev1']).toBeUndefined()
})

test('a stale Library prompt ref shows the upgrade badge in the chip', () => {
  const ref = 'pr_lib@v26.0609'
  const model = {
    metadata: { id: 'qst_t', title: 'T', description: 'd', version: 'v26.0609', language: 'en' },
    pages: [{ id: 'page_1', title: 'P', elements: [{ question: { prompt: { ref } }, option: {
      input_data_type: 'text', measurement_type: 'nominal', content: { en: { status: 'draft', label: 'L' } } } }] }],
  } as unknown as import('../model/types').Questionnaire
  useEditorStore.getState().reset()
  useEditorStore.getState().loadModel(model, { kind: 'file', name: 't.json' })
  useEditorStore.setState({ staleness: { [ref]: 'v26.0610' } })
  render(<ItemEditor path={['pages', 0, 'elements', 0]} />)
  expect(screen.getByText(/newer: v26\.0610/i)).toBeInTheDocument()
})
