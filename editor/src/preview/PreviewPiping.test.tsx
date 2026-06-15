import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

// Real fake-evaluator so piping condition + bindings run.
vi.mock('../logic/useEvaluator', async () => {
  const real = await import('../logic/evaluator')
  return { useEvaluator: () => real.makeFakeEvaluator({ 'true': true }) }
})

import { PreviewPane } from './PreviewPane'
import { useEditorStore } from '../state/store'
import type { Questionnaire } from '../model/types'

const model = {
  metadata: { id: 'qst_x', title: 'X', description: 'd', language: 'en', version: 'v26.0601' },
  logic: [{ type: 'piping', condition: 'true', action: { source: 'it_src', field_path: 'pages.p1.elements.1.prompt' } }],
  pages: [{ id: 'p1', elements: [
    { id: 'it_src',
      question: { prompt: { content: { en: { status: 'complete', text: 'Your name?' } } } },
      option: { input_data_type: 'choice', measurement_type: 'nominal', selection: 'single',
        options: [{ index: 0, value: 'Sam' }], content: { en: { options: [{ index: 0, text: 'Sam' }] } } } },
    { id: 'it_tgt',
      question: { prompt: { content: { en: { status: 'complete', text: 'PROMPT_PLACEHOLDER' } } } },
      option: { input_data_type: 'text', measurement_type: 'text', content: { en: {} } } },
  ] }],
} as unknown as Questionnaire

describe('PreviewPane piping', () => {
  beforeEach(() => useEditorStore.getState().loadModel(structuredClone(model), { kind: 'new' } as never))

  it('rewrites the target prompt with the source answer once the source is answered', async () => {
    render(<PreviewPane />)
    await waitFor(() => expect(screen.getAllByText('Your name?').length).toBeGreaterThan(0))
    expect(screen.getAllByText('PROMPT_PLACEHOLDER').length).toBeGreaterThan(0) // not yet piped (source unanswered)
    fireEvent.click(screen.getByText('Sam'))
    await waitFor(() => expect(screen.queryByText('PROMPT_PLACEHOLDER')).not.toBeInTheDocument())
    expect(screen.getAllByText('Sam').length).toBeGreaterThan(0) // target prompt now shows the piped value
  })
})
