import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useEditorStore } from '../state/store'
import { ForkDialog } from './ForkDialog'
import type { Questionnaire } from '../model/types'

const model = {
  metadata: { id: 'qst_t', title: 'T', description: 'd', version: 'v26.0609', language: 'en' },
  pages: [{ id: 'p1', title: 'P', elements: [{ question: { prompt: { ref: 'pr_lib@v26.0609' } }, option: {} }] }],
} as unknown as Questionnaire

beforeEach(() => { useEditorStore.getState().reset(); useEditorStore.getState().loadModel(model, { kind: 'file', name: 't.json' }) })

test('Derive locally forks the ref (pool copy + repoint) and closes', async () => {
  useEditorStore.getState().openFork('pr_lib@v26.0609')
  const onClose = vi.fn(() => useEditorStore.getState().closeFork())
  render(<ForkDialog refStr="pr_lib@v26.0609" onClose={onClose} fetchBody={async () => ({ id: 'pr_lib', content: { en: { status: 'validated', text: 'Forked' } } })} />)
  await userEvent.click(screen.getByRole('button', { name: /create a local copy/i }))
  await waitFor(() => expect(onClose).toHaveBeenCalled())
  expect(useEditorStore.getState().pool['pr_lib@v26.0609.dev1']).toBeTruthy()
  const q = useEditorStore.getState().model!.pages[0].elements[0] as { question: { prompt: { ref: string } } }
  expect(q.question.prompt.ref).toBe('pr_lib@v26.0609.dev1')
})

test('Propose a new shared version is disabled (OD-08)', () => {
  render(<ForkDialog refStr="pr_lib@v26.0609" onClose={vi.fn()} />)
  expect(screen.getByRole('button', { name: /propose a new shared version/i })).toBeDisabled()
})

test('a failed fork shows an error and stays open', async () => {
  const onClose = vi.fn()
  render(<ForkDialog refStr="pr_lib@v26.0609" onClose={onClose} fetchBody={async () => null} />)
  await userEvent.click(screen.getByRole('button', { name: /create a local copy/i }))
  await waitFor(() => expect(screen.getByText(/could not fork/i)).toBeInTheDocument())
  expect(onClose).not.toHaveBeenCalled()
})
