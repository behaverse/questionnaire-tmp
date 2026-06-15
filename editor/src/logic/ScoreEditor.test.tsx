import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ScoreEditor } from './ScoreEditor'
import { useEditorStore } from '../state/store'
import type { Score } from '../model/types'
import type { Questionnaire } from '../model/types'

const base = { metadata: { id: 'qst_x', title: 'X', language: 'en', version: 'v26.0601', description: 'd' }, pages: [] } as unknown as Questionnaire
const score: Score = { id: 'score_1', scorer: 'scr_phq9@v26.0602', path: '/total' }

function setup(s: Score, onChange = vi.fn()) {
  render(<ScoreEditor score={s} allScores={[s]} onChange={onChange} onDelete={vi.fn()} />)
  return onChange
}

describe('ScoreEditor', () => {
  beforeEach(() => useEditorStore.getState().loadModel(structuredClone(base), { kind: 'new' } as never))

  it('renders id / scorer / path inputs with values', () => {
    setup(score)
    expect((screen.getByLabelText('Score id') as HTMLInputElement).value).toBe('score_1')
    expect((screen.getByLabelText('Scorer ref') as HTMLInputElement).value).toBe('scr_phq9@v26.0602')
    expect((screen.getByLabelText('Score path') as HTMLInputElement).value).toBe('/total')
  })
  it('editing the path emits the updated score', () => {
    const onChange = setup(score)
    fireEvent.change(screen.getByLabelText('Score path'), { target: { value: '/severity' } })
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ path: '/severity' }))
  })
  it('editing the scorer emits the updated score', () => {
    const onChange = setup({ ...score, scorer: '' })
    fireEvent.change(screen.getByLabelText('Scorer ref'), { target: { value: 'scr_gad7@v26.0602' } })
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ scorer: 'scr_gad7@v26.0602' }))
  })
  it('Pick from Library opens the scorer picker', () => {
    setup(score)
    fireEvent.click(screen.getByRole('button', { name: /pick from library/i }))
    expect(useEditorStore.getState().picker?.etype).toBe('scorer')
  })
  it('shows errors for empty path / bad scorer', () => {
    setup({ id: 'score_1', scorer: 'nope', path: '' })
    expect(screen.getByText(/path required/i)).toBeInTheDocument()
    expect(screen.getByText(/scr_…@vYY.MMDD/i)).toBeInTheDocument()
  })
})
