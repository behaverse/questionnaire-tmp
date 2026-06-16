import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

vi.mock('../logic/useEvaluator', async () => {
  const real = await import('../logic/evaluator')
  return { useEvaluator: () => real.makeFakeEvaluator({ "q == 'yes'": (b) => b.var('q') === 'yes' }) }
})

import { PreviewView } from './PreviewView'
import type { Runtime } from '@behaverse/questionnaire-renderer'

const runtime = {
  provenance: { preview: true },
  metadata: { id: 'qst_x', title: 'X', language: 'en' },
  locale: 'en',
  available_locales: ['en'],
  pages: [{ id: 'p1', elements: [
    { id: 'q', question: { prompt: { content: { en: { status: 'complete', text: 'Show extra?' } } } },
      option: { input_data_type: 'choice', measurement_type: 'nominal', selection: 'single',
        options: [{ index: 0, value: 'yes' }], content: { en: { options: [{ index: 0, text: 'Yes' }] } } } },
    { id: 'extra', show_if: "q == 'yes'",
      question: { prompt: { content: { en: { status: 'complete', text: 'Extra question' } } } },
      option: { input_data_type: 'text', measurement_type: 'text', content: { en: {} } } },
  ] }],
} as unknown as Runtime

describe('PreviewView', () => {
  it('renders the runtime and shows the problems banner', () => {
    render(<PreviewView runtime={runtime} problems={[{ kind: 'unresolved_ref', where: 'x' }]} logic={[]} validation={[]} />)
    expect(screen.getByText('Show extra?', { selector: 'h2.qv-prompt' })).toBeInTheDocument()
    expect(screen.getByText(/referenced entit/i)).toBeInTheDocument()
  })
  it('evaluates show_if live against throwaway answers', async () => {
    render(<PreviewView runtime={runtime} problems={[]} logic={[]} validation={[]} />)
    expect(screen.queryByText('Extra question', { selector: 'h2.qv-prompt' })).not.toBeInTheDocument()
    fireEvent.click(screen.getByText('Yes'))
    expect(await screen.findByText('Extra question', { selector: 'h2.qv-prompt' })).toBeInTheDocument()
  })
})
