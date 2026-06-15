import { render, screen, fireEvent } from '@testing-library/react'
import { useEditorStore } from '../state/store'
import { MessagePane } from './MessagePane'
import type { Questionnaire } from '../model/types'

const ref = 'msg_m@v26.0609.dev1'
const model = {
  metadata: { id: 'qst_t', title: 'T', description: 'd', version: 'v26.0609', language: 'en' },
  pages: [{ id: 'page_1', title: 'P', elements: [{ ref }] }],
} as unknown as Questionnaire

beforeEach(() => {
  useEditorStore.getState().reset()
  useEditorStore.getState().loadModel(model, { kind: 'file', name: 't.json' })
  useEditorStore.getState().upsertPoolEntity(ref, { id: 'msg_m', type: ['information'], content: { en: { status: 'draft', text: 'Welcome' } } })
})

test('edits a pool message body via the store', () => {
  render(<MessagePane path={['pages', 0, 'elements', 0]} />)
  fireEvent.change(screen.getByLabelText(/message text/i), { target: { value: 'Hello there' } })
  expect((useEditorStore.getState().pool[ref] as { content: { en: { text: string } } }).content.en.text).toBe('Hello there')
})

test('a Library-pinned message ref (not in pool) shows a read-only fork note', () => {
  const libRef = 'msg_lib@v26.0609'
  const m = {
    metadata: { id: 'qst_t', title: 'T', description: 'd', version: 'v26.0609', language: 'en' },
    pages: [{ id: 'page_1', title: 'P', elements: [{ ref: libRef }] }],
  } as unknown as Questionnaire
  useEditorStore.getState().reset()
  useEditorStore.getState().loadModel(m, { kind: 'file', name: 't.json' })
  render(<MessagePane path={['pages', 0, 'elements', 0]} />)
  expect(screen.getByRole('button', { name: /fork to edit/i })).toBeInTheDocument()
  expect(screen.getByText(libRef)).toBeInTheDocument()
})
