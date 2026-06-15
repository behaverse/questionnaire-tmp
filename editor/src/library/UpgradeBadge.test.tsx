import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useEditorStore } from '../state/store'
import { UpgradeBadge } from './UpgradeBadge'
import type { Questionnaire } from '../model/types'

const model = {
  metadata: { id: 'qst_t', title: 'T', description: 'd', version: 'v26.0609', language: 'en' },
  pages: [{ id: 'p1', title: 'P', elements: [{ question: { prompt: { ref: 'pr_x@v26.0609' } }, option: {} }] }],
} as unknown as Questionnaire

beforeEach(() => { useEditorStore.getState().reset(); useEditorStore.getState().loadModel(model, { kind: 'file', name: 't.json' }) })

test('renders nothing when the ref is not stale', () => {
  const { container } = render(<UpgradeBadge refStr="pr_x@v26.0609" />)
  expect(container).toBeEmptyDOMElement()
})

test('shows the newer version + Upgrade repoints the ref', async () => {
  useEditorStore.setState({ staleness: { 'pr_x@v26.0609': 'v26.0610' } })
  render(<UpgradeBadge refStr="pr_x@v26.0609" />)
  expect(screen.getByText(/newer: v26\.0610/i)).toBeInTheDocument()
  await userEvent.click(screen.getByRole('button', { name: /upgrade/i }))
  const q = useEditorStore.getState().model!.pages[0].elements[0] as { question: { prompt: { ref: string } } }
  expect(q.question.prompt.ref).toBe('pr_x@v26.0610')
})
