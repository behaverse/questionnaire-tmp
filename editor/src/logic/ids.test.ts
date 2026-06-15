import { describe, it, expect } from 'vitest'
import { collectIdCatalogue } from './ids'
import type { Questionnaire } from '../model/types'

const model = {
  metadata: { id: 'qst_x', title: 'X', description: 'd', language: 'en', version: 'v26.0601' },
  pages: [
    { id: 'p1', elements: [
      { id: 'q_age', question: { id: 'qn_age' } },
      { id: 'sec1', elements: [{ id: 'q_mood' }] },
    ] },
  ],
  scores: [{ id: 'phq9_total', scorer: 'scr_phq9@v26.0602', path: '/total' }],
} as unknown as Questionnaire

describe('collectIdCatalogue', () => {
  it('collects element/question ids and score ids, deduped', () => {
    const cat = collectIdCatalogue(model, {})
    expect(cat.questionIds.sort()).toEqual(['q_age', 'q_mood', 'qn_age', 'sec1'].sort())
    expect(cat.scoreIds).toEqual(['phq9_total'])
  })
  it('excludes the questionnaire metadata id', () => {
    const cat = collectIdCatalogue(model, {})
    expect(cat.questionIds).not.toContain('qst_x')
  })
})
