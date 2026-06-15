import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

vi.mock('../logic/useEvaluator', async () => {
  const real = await import('../logic/evaluator')
  return { useEvaluator: () => real.makeFakeEvaluator({ "it_pick == 'no'": (b: import('../logic/types').Bindings) => b.var('it_pick') === 'no' }) }
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

const crossModel = {
  metadata: { id: 'qst_cv', title: 'CV', description: 'd', language: 'en', version: 'v26.0601' },
  validation: [{ id: 'val_1', condition: "it_pick == 'no'", message: 'Please reconsider', targets: ['it_pick'] }],
  pages: [{ id: 'p1', elements: [
    { id: 'it_pick',
      question: { prompt: { content: { en: { status: 'complete', text: 'Continue?' } } } },
      option: { input_data_type: 'choice', measurement_type: 'nominal', selection: 'single',
        options: [{ index: 0, value: 'yes' }, { index: 1, value: 'no' }],
        content: { en: { options: [{ index: 0, text: 'Yes' }, { index: 1, text: 'No' }] } } } },
  ] }],
} as unknown as Questionnaire

describe('PreviewPane cross-question validation', () => {
  beforeEach(() => useEditorStore.getState().loadModel(structuredClone(crossModel), { kind: 'new' } as never))
  it('shows the cross-question message on the target when the condition holds', async () => {
    render(<PreviewPane />)
    await waitFor(() => expect(screen.getAllByText('Continue?').length).toBeGreaterThan(0))
    expect(screen.queryByText('Please reconsider')).not.toBeInTheDocument()
    fireEvent.click(screen.getByText('No'))
    await waitFor(() => expect(screen.getByText('Please reconsider')).toBeInTheDocument())
  })
})
