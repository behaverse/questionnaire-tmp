import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

vi.mock('../logic/useEvaluator', async () => {
  const real = await import('../logic/evaluator')
  return { useEvaluator: () => real.makeFakeEvaluator({}) }
})

import { PreviewPane } from './PreviewPane'
import { useEditorStore } from '../state/store'
import type { Questionnaire } from '../model/types'

const model = {
  metadata: { id: 'qst_x', title: 'X', description: 'd', language: 'en', version: 'v26.0601' },
  pages: [{ id: 'p1', elements: [
    { id: 'it_n',
      question: { prompt: { content: { en: { status: 'complete', text: 'Your age?' } } } },
      option: { input_data_type: 'number', measurement_type: 'ratio', content: { en: {} }, validation: { range: [0, 10], range_message: 'Too big' } } },
  ] }],
} as unknown as Questionnaire

describe('PreviewPane per-question validation', () => {
  beforeEach(() => useEditorStore.getState().loadModel(structuredClone(model), { kind: 'new' } as never))

  it('shows the range error for an out-of-range value, none when valid', async () => {
    render(<PreviewPane />)
    await waitFor(() => expect(screen.getAllByText('Your age?').length).toBeGreaterThan(0))
    const input = screen.getByRole('spinbutton') // the number widget
    fireEvent.change(input, { target: { value: '15' } })
    await waitFor(() => expect(screen.getByText('Too big')).toBeInTheDocument())
    fireEvent.change(input, { target: { value: '5' } })
    await waitFor(() => expect(screen.queryByText('Too big')).not.toBeInTheDocument())
  })
})
