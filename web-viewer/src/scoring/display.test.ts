import { displayScores } from './display'
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
