import { describe, it, expect } from 'vitest'
import { newScore, summarizeScore, validateScore } from './scoreOps'
import type { Score } from '../model/types'

describe('newScore', () => {
  it('picks the first free score_N id', () => {
    expect(newScore([]).id).toBe('score_1')
    expect(newScore([{ id: 'score_1' }, { id: 'score_3' }] as Score[]).id).toBe('score_2')
  })
  it('starts with empty scorer + path', () => {
    expect(newScore([])).toEqual({ id: 'score_1', scorer: '', path: '' })
  })
})

describe('summarizeScore', () => {
  it('summarizes a complete score', () => {
    expect(summarizeScore({ id: 'phq9_total', scorer: 'scr_phq9@v26.0602', path: '/total' }))
      .toBe('phq9_total: scr_phq9@v26.0602 → /total')
  })
  it('shows placeholders when empty', () => {
    expect(summarizeScore({ id: 'score_1', scorer: '', path: '' })).toBe('score_1: (no scorer) → (no path)')
  })
})

describe('validateScore', () => {
  const s = (o: Partial<Score>): Score => ({ id: 'score_1', scorer: 'scr_phq9@v26.0602', path: '/total', ...o })
  it('a fully-valid score has no errors', () => {
    expect(validateScore(s({}), [s({})]).errors).toEqual([])
  })
  it('flags empty / bad-pattern id and warns on duplicate', () => {
    expect(validateScore(s({ id: '' }), []).errors.some((e) => e.field === 'id' && e.level === 'error')).toBe(true)
    expect(validateScore(s({ id: 'Bad Id' }), []).errors.some((e) => e.field === 'id' && e.level === 'error')).toBe(true)
    const d = s({})
    expect(validateScore(d, [d, s({ path: '/severity' })]).errors.some((e) => e.field === 'id' && e.level === 'warning')).toBe(true)
  })
  it('flags empty / bad-pattern scorer', () => {
    expect(validateScore(s({ scorer: '' }), []).errors.some((e) => e.field === 'scorer' && e.level === 'error')).toBe(true)
    expect(validateScore(s({ scorer: 'scr_phq9' }), []).errors.some((e) => e.field === 'scorer' && e.level === 'error')).toBe(true)
  })
  it('flags empty / bad-pattern path', () => {
    expect(validateScore(s({ path: '' }), []).errors.some((e) => e.field === 'path' && e.level === 'error')).toBe(true)
    expect(validateScore(s({ path: 'total' }), []).errors.some((e) => e.field === 'path' && e.level === 'error')).toBe(true)
  })
})
