import { describe, it, expect } from 'vitest'
import { collectLogicTargets } from './targets'
import type { Questionnaire } from '../model/types'

const model = {
  metadata: { id: 'qst_x', title: 'X', language: 'en' },
  pages: [
    { id: 'p1', elements: [
      { id: 'it_a', question: {}, option: {} },
      { id: 'sec1', elements: [{ id: 'it_b', question: {} }] },
    ] },
    { id: 'p2', elements: [{ id: 'it_c', question: {}, option: {} }] },
  ],
} as unknown as Questionnaire

describe('collectLogicTargets', () => {
  it('collects page ids for skip/branch targets', () => {
    expect(collectLogicTargets(model).pageIds.sort()).toEqual(['p1', 'p2'])
  })
  it('collects element + section + section-child keys for visibility targets', () => {
    expect(collectLogicTargets(model).elementKeys.sort()).toEqual(['it_a', 'it_b', 'it_c', 'sec1'].sort())
  })
  it('is safe on a model with no pages', () => {
    expect(collectLogicTargets({ metadata: { id: 'x' } } as unknown as Questionnaire)).toEqual({ pageIds: [], elementKeys: [] })
  })
})
