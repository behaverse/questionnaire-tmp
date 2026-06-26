// library-web/src/export/surveyjs.test.ts
import { describe, it, expect } from 'vitest'
import { toSurveyJS } from './surveyjs'
import type { RenderModel } from '../definition/renderModel'
import type { ScoreDecl } from '../api/types'

const model: RenderModel = {
  pages: [{
    id: 'p1', title: 'Page One',
    blocks: [
      { kind: 'item', number: 1, stem: 'I plan tasks.', required: true, unresolved: false,
        widget: 'choice.nominal.single', showIf: 'true',
        options: [{ index: 0, text: 'No', value: 1 }, { index: 1, text: 'Yes', value: 2 }] },
      { kind: 'item', number: 2, stem: 'Ordinal item.', required: false, unresolved: false,
        widget: 'choice.ordinal.single', showIf: 'q1 == 2',
        options: [{ index: 0, text: 'Low', value: 1 }, { index: 1, text: 'High', value: 2 }] },
      { kind: 'item', number: 3, stem: 'Complex.', required: false, unresolved: false,
        widget: 'choice.nominal.single', showIf: 'length(name) > 0',
        options: [{ index: 0, text: 'Only', value: 1 }] },
    ],
  }],
}
const scores: ScoreDecl[] = [{ id: 'total', scorer: 'scr_demo@v1', path: '/x', name: 'Demo total' }]

describe('toSurveyJS', () => {
  const { json, dropped } = toSurveyJS(model, scores)
  const els = (json.pages as any[])[0].elements as any[]

  it('builds a page of elements with the title', () => {
    expect(json.title).toBe(undefined) // title comes from meta in the wrapper; serializer omits it
    expect(els.length).toBe(3)
  })
  it('maps nominal-single → radiogroup with value/text choices + isRequired; show_if true omitted', () => {
    const q1 = els.find((e) => e.name === 'q1')
    expect(q1.type).toBe('radiogroup')
    expect(q1.isRequired).toBe(true)
    expect(q1.choices).toEqual([{ value: 1, text: 'No' }, { value: 2, text: 'Yes' }])
    expect(q1.visibleIf).toBeUndefined()
  })
  it('maps ordinal-single → rating and translates a simple equality show_if', () => {
    const q2 = els.find((e) => e.name === 'q2')
    expect(q2.type).toBe('rating')
    expect(q2.rateValues).toEqual([{ value: 1, text: 'Low' }, { value: 2, text: 'High' }])
    expect(q2.visibleIf).toBe('{q1} = 2')
  })
  it('drops complex show_if and scoring with messages', () => {
    const q3 = els.find((e) => e.name === 'q3')
    expect(q3.visibleIf).toBeUndefined()
    expect(dropped.some((d) => /q3/.test(d) && /show_if|visibility/i.test(d))).toBe(true)
    expect(dropped.some((d) => /Demo total|scoring/i.test(d))).toBe(true)
  })
})
