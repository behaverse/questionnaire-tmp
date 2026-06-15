import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

// Real evaluator so condition actually runs against bindings.
vi.mock('../logic/useEvaluator', async () => {
  const real = await import('../logic/evaluator')
  return { useEvaluator: () => real.makeFakeEvaluator({ "q_show == 'yes'": (b) => b.var('q_show') === 'yes' }) }
})

import { PreviewPane } from './PreviewPane'
import { useEditorStore } from '../state/store'
import type { Questionnaire } from '../model/types'

// Use input_data_type:'choice' + selection:'single' so the renderer produces a RadioGroup with
// clickable labels. The structural choices live under `options` (not `choices`) per the renderer's
// mergeOptions helper; locale texts live under `content.[locale].options`.
const model = {
  metadata: { id: 'qst_x', title: 'X', description: 'd', language: 'en', version: 'v26.0601' },
  pages: [{ id: 'p1', elements: [
    { id: 'q_show',
      question: { prompt: { content: { en: { status: 'complete', text: 'Show extra?' } } } },
      option: { input_data_type: 'choice', measurement_type: 'nominal', selection: 'single',
        options: [{ index: 0, value: 'yes' }],
        content: { en: { options: [{ index: 0, text: 'Yes' }] } } } },
    { id: 'q_extra', show_if: "q_show == 'yes'",
      question: { prompt: { content: { en: { status: 'complete', text: 'Extra question' } } } },
      option: { input_data_type: 'text', measurement_type: 'nominal', selection: 'single',
        content: { en: {} } } },
  ] }],
} as unknown as Questionnaire

describe('PreviewPane visibility', () => {
  beforeEach(() => useEditorStore.getState().loadModel(structuredClone(model), { kind: 'new' } as never))

  it('hides a show_if element until its condition is satisfied', async () => {
    render(<PreviewPane />)
    // Wait until the renderer has projected the model (the h2 prompt for q_show appears)
    await waitFor(() => expect(screen.getAllByText('Show extra?').length).toBeGreaterThan(0))
    expect(screen.queryByText('Extra question')).not.toBeInTheDocument()
    // Click the "Yes" radio label — RadioGroup renders <label><span>Yes</span></label>
    fireEvent.click(screen.getByText('Yes'))
    // The renderer renders "Extra question" in both <legend class="sr-only"> and <h2>;
    // use queryAllByText so multiple matches don't error.
    await waitFor(() => expect(screen.queryAllByText('Extra question').length).toBeGreaterThan(0))
  })
})
