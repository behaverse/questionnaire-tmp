import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

vi.mock('../logic/useEvaluator', async () => {
  const real = await import('../logic/evaluator')
  return { useEvaluator: () => real.makeFakeEvaluator({}) }
})

import { StandalonePreview } from './StandalonePreview'

const bundle = {
  questionnaire: {
    metadata: { id: 'qst_x', title: 'Demo', language: 'en' },
    pages: [{ id: 'p1', elements: [
      { id: 'q', question: { prompt: { content: { en: { status: 'complete', text: 'Hello there' } } } },
        option: { input_data_type: 'text', measurement_type: 'text', content: { en: {} } } },
    ] }],
  },
  entities: {},
}

describe('StandalonePreview', () => {
  beforeEach(() => sessionStorage.clear())

  it('renders a bundle handed off via sessionStorage', async () => {
    sessionStorage.setItem('qv-preview-bundle', JSON.stringify(bundle))
    render(<StandalonePreview />)
    expect(await screen.findByRole('heading', { name: 'Hello there' })).toBeInTheDocument()
    expect(screen.getByText(/not a deployment/i)).toBeInTheDocument()
  })
  it('shows a file-open prompt when no bundle is present', () => {
    render(<StandalonePreview />)
    expect(screen.getByLabelText(/load a bundle/i)).toBeInTheDocument()
  })
  it('renders a bundle chosen via the file input', async () => {
    render(<StandalonePreview />)
    const file = new File([JSON.stringify(bundle)], 'demo.bundle.json', { type: 'application/json' })
    fireEvent.change(screen.getByLabelText(/load a bundle/i), { target: { files: [file] } })
    expect(await screen.findByRole('heading', { name: 'Hello there' })).toBeInTheDocument()
  })
  it('shows an inline error for a malformed bundle file', async () => {
    render(<StandalonePreview />)
    const file = new File(['{ not a bundle'], 'bad.json', { type: 'application/json' })
    fireEvent.change(screen.getByLabelText(/load a bundle/i), { target: { files: [file] } })
    expect(await screen.findByText(/not a valid questionnaire bundle/i)).toBeInTheDocument()
  })
})
