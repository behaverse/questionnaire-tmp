import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ScoringPanel } from './ScoringPanel'
import { Inspector } from '../inspector/Inspector'
import { useEditorStore } from '../state/store'
import type { Questionnaire } from '../model/types'

const base = {
  metadata: { id: 'qst_x', title: 'X', language: 'en', version: 'v26.0601', description: 'd' },
  pages: [{ id: 'p1', elements: [{ id: 'it_a', question: {}, option: {} }] }],
} as unknown as Questionnaire

describe('ScoringPanel', () => {
  beforeEach(() => useEditorStore.getState().loadModel(structuredClone(base), { kind: 'new' } as never))

  it('adds an auto-id score via + Add score', () => {
    render(<ScoringPanel />)
    fireEvent.click(screen.getByRole('button', { name: /add score/i }))
    expect(useEditorStore.getState().model!.scores?.[0]?.id).toBe('score_1')
  })
  it('deletes a score', () => {
    useEditorStore.getState().applyEdit((m) => ({ ...m, scores: [{ id: 'score_1', scorer: 'scr_phq9@v26.0602', path: '/total' }] }))
    render(<ScoringPanel />)
    fireEvent.click(screen.getByRole('button', { name: /edit score 1/i }))
    fireEvent.click(screen.getByRole('button', { name: /delete score/i }))
    expect(useEditorStore.getState().model!.scores).toBeUndefined()
  })
  it('shows an attention count for invalid scores', () => {
    useEditorStore.getState().applyEdit((m) => ({ ...m, scores: [{ id: '', scorer: '', path: '' }] }))
    render(<ScoringPanel />)
    expect(screen.getByText(/need.* attention/i)).toBeInTheDocument()
  })
})

describe('ScoringPanel live preview values', () => {
  const model = {
    metadata: { id: 'q', title: 'q', language: 'en' }, pages: [],
    scores: [
      { id: 'phq9_total', scorer: 'scr_phq9@v26.0602', path: '/total', name: 'Total' },
      { id: 'x', scorer: 'scr_unknown@v26.0602', path: '/x', name: 'X' },
    ],
  } as unknown as Questionnaire

  beforeEach(() => {
    const s = useEditorStore.getState()
    s.reset()
    s.loadModel(structuredClone(model), { kind: 'file', name: 'q.json' })
  })

  it('shows the live value for a runnable score and an unavailable badge for an unknown scorer', () => {
    useEditorStore.getState().setPreviewScores({ values: { phq9_total: 12 }, unavailable: ['scr_unknown@v26.0602'] })
    render(<ScoringPanel />)
    expect(screen.getByText('12')).toBeInTheDocument()                 // live value
    expect(screen.getByText(/unavailable in preview/i)).toBeInTheDocument() // unknown scorer badge
  })

  it('hints to open the preview when no live values are present (and there are scores)', () => {
    useEditorStore.getState().setPreviewScores(null)
    render(<ScoringPanel />)
    expect(screen.getByText(/open the preview/i)).toBeInTheDocument()
  })

  it('does NOT show the preview hint when there are 0 scores', () => {
    const s = useEditorStore.getState()
    s.reset()
    s.loadModel({ metadata: { id: 'q', title: 'q', language: 'en' }, pages: [] } as unknown as Questionnaire, { kind: 'file', name: 'q.json' })
    s.setPreviewScores(null)
    render(<ScoringPanel />)
    expect(screen.queryByText(/open the preview/i)).not.toBeInTheDocument()
  })
})

describe('Inspector mounts ScoringPanel at the questionnaire root', () => {
  beforeEach(() => useEditorStore.getState().loadModel(structuredClone(base), { kind: 'new' } as never))
  it('shows Scores at root (via Scoring tab)', () => {
    useEditorStore.getState().select(null)
    render(<Inspector />)
    fireEvent.click(screen.getByRole('tab', { name: /scoring/i }))
    expect(screen.getByText(/^scores$/i)).toBeInTheDocument()
  })
  it('does not show Scores for a page selection', () => {
    useEditorStore.getState().select(['pages', 0])
    render(<Inspector />)
    expect(screen.queryByText(/^scores$/i)).not.toBeInTheDocument()
  })
})
