import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'

vi.mock('../logic/useEvaluator', async () => {
  const real = await import('../logic/evaluator')
  return { useEvaluator: () => real.makeFakeEvaluator({ "q == 'yes'": (b) => b.var('q') === 'yes' }) }
})

import { PreviewView } from './PreviewView'
import { useEditorStore } from '../state/store'
import type { Runtime } from '@behaverse/questionnaire-renderer'
import type { Questionnaire } from '../model/types'

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

// ── Score-cache wiring: spy on setPreviewScores ──────────────────────────────
//
// Approach: spy the store's setPreviewScores. Because useScoreCache returns
// null when there are no bundled scorers (the wasm fetch would be a dead-end
// in jsdom), we instead test the "unknown scorer" branch: a runtime with a
// scorer that isKnownScorer() returns false for → cache stays null, but the
// useEffect still runs and publishes { values: {}, unavailable: ['scr_unknown'] }.
//
// This validates:
//   1. setPreviewScores is called at all (wiring is correct),
//   2. isKnownScorer filters correctly (unavailable list correct),
//   3. unmount cleanup calls setPreviewScores(null).
//
// The "values becomes live" path (score() returns non-null) is covered by the
// Task 8 e2e that has full wasm.

// The projected runtime has scores DROPPED for unknown scorers (projectForPreview
// only keeps scorers with a bundled impl). So to test that unavailable badges still
// appear we must load the authored model (with unknown scorer) into the store.
const modelWithUnknownScorer: Questionnaire = {
  metadata: { id: 'qst_score', title: 'Score', language: 'en' },
  pages: [{ id: 'p1', elements: [
    { question: { prompt: { content: { en: { status: 'complete', text: 'Q1' } } } },
      option: { input_data_type: 'text', measurement_type: 'text', content: { en: {} } } },
  ] }],
  scores: [{ id: 'total', scorer: 'scr_unknown_xyz@v1.0', path: '/total' }],
}

// Runtime as produced by the preview projection: unknown scorer stripped from scores
const runtimeWithUnknownScorerProjected: Runtime = {
  provenance: { preview: true },
  metadata: { id: 'qst_score', title: 'Score', language: 'en' },
  locale: 'en',
  available_locales: ['en'],
  pages: [{ id: 'p1', elements: [
    { id: 'q1',
      question: { prompt: { content: { en: { status: 'complete', text: 'Q1' } } } },
      option: { input_data_type: 'text', measurement_type: 'text', content: { en: {} } } },
  ] }],
  // scores intentionally omitted — simulates projectForPreview stripping unknown scorers
} as unknown as Runtime

describe('PreviewView score-cache wiring', () => {
  let spy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    spy = vi.spyOn(useEditorStore.getState(), 'setPreviewScores')
    // Load the authored model into the store so model.scores contains the unknown scorer
    useEditorStore.getState().loadModel(modelWithUnknownScorer, { kind: 'new' })
  })

  afterEach(() => {
    spy.mockRestore()
    // reset store
    useEditorStore.getState().setPreviewScores(null)
    useEditorStore.getState().reset()
  })

  it('calls setPreviewScores with unavailable list for unknown scorer on mount', async () => {
    // Pass a projected runtime (no scores) — unavailable must come from model.scores in store
    const { unmount } = render(
      <PreviewView runtime={runtimeWithUnknownScorerProjected} problems={[]} logic={[]} validation={[]} />
    )

    // The useEffect fires after render; wait for the spy to be called
    await waitFor(() => expect(spy).toHaveBeenCalled())

    // The first non-null call should have empty values + 'scr_unknown_xyz@v1.0' in unavailable
    const calls = spy.mock.calls.filter((c) => c[0] !== null)
    expect(calls.length).toBeGreaterThan(0)
    const arg = calls[0][0] as { values: Record<string, unknown>; unavailable: string[] }
    expect(arg.values).toEqual({})
    expect(arg.unavailable).toContain('scr_unknown_xyz@v1.0')

    // Unmount should clear
    act(() => unmount())
    const nullCalls = spy.mock.calls.filter((c) => c[0] === null)
    expect(nullCalls.length).toBeGreaterThan(0)
  })
})
