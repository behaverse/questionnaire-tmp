import { displayScores, buildScoreDisplay } from './display'
import type { Runtime } from '../renderer/types'

const rt = (scores: unknown[]) => ({ pages: [], scores } as unknown as Runtime)

test('selects only scores with a non-empty name, deduped by id', () => {
  const out = displayScores(rt([
    { id: 'phq9_total', scorer: 's', path: '/total', impl: {}, name: 'PHQ-9 Total' },
    { id: 'crisis_flag', scorer: 's', path: '/c', impl: {} },
    { id: 'phq9_total', scorer: 's', path: '/total', impl: {}, name: 'dup' },
    { id: 'sev', scorer: 's', path: '/s', impl: {}, name: '' },
  ]))
  expect(out.map((s) => s.id)).toEqual(['phq9_total'])
  expect(out[0].name).toBe('PHQ-9 Total')
})
test('empty / missing scores → empty list', () => {
  expect(displayScores(rt([]))).toEqual([])
  expect(displayScores({ pages: [] } as unknown as Runtime)).toEqual([])
})

test('buildScoreDisplay returns named numeric scores with values; skips unnamed + non-numeric', () => {
  const runtime = { pages: [], scores: [
    { id: 'sc_total', scorer: 'scr_x@v26.0602', path: '/total', name: 'Total' },
    { id: 'sc_branch', scorer: 'scr_x@v26.0602', path: '/b' },                 // no name → excluded
    { id: 'sc_sev', scorer: 'scr_x@v26.0602', path: '/sev', name: 'Severity' },// non-numeric → excluded
  ] } as unknown as import('../renderer/types').Runtime
  const score = (id: string) => (id === 'sc_total' ? 12 : id === 'sc_sev' ? 'moderate' : null)
  expect(buildScoreDisplay(runtime, score)).toEqual([{ id: 'sc_total', name: 'Total', value: 12 }])
})
