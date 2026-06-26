// library-web/src/export/surveyjs.test.ts
import { describe, it, expect } from 'vitest'
import { toSurveyJS } from './surveyjs'
import type { RenderModel } from '../definition/renderModel'
import type { ScoreDecl } from '../api/types'

const noScores: ScoreDecl[] = []

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

describe('toSurveyJS — additional branches', () => {
  it('checkbox: nominal.multiple maps to checkbox with choices', () => {
    const m: RenderModel = {
      pages: [{
        id: 'p1', title: undefined,
        blocks: [
          { kind: 'item', number: 4, stem: 'Pick all.', required: false, unresolved: false,
            widget: 'choice.nominal.multiple', showIf: undefined,
            options: [{ index: 0, text: 'A', value: 1 }, { index: 1, text: 'B', value: 2 }] },
        ],
      }],
    }
    const { json } = toSurveyJS(m, noScores)
    const els = (json.pages as any[])[0].elements as any[]
    const q4 = els.find((e) => e.name === 'q4')
    expect(q4.type).toBe('checkbox')
    expect(q4.choices).toEqual([{ value: 1, text: 'A' }, { value: 2, text: 'B' }])
  })

  it('!= translates to <> in visibleIf', () => {
    const m: RenderModel = {
      pages: [{
        id: 'p1', title: undefined,
        blocks: [
          { kind: 'item', number: 5, stem: 'Conditional.', required: false, unresolved: false,
            widget: 'choice.nominal.single', showIf: 'q1 != 2',
            options: [{ index: 0, text: 'Opt', value: 1 }] },
        ],
      }],
    }
    const { json } = toSurveyJS(m, noScores)
    const els = (json.pages as any[])[0].elements as any[]
    const q5 = els.find((e) => e.name === 'q5')
    expect(q5.visibleIf).toBe('{q1} <> 2')
  })

  it('showIf: false → visible: false, no visibleIf', () => {
    const m: RenderModel = {
      pages: [{
        id: 'p1', title: undefined,
        blocks: [
          { kind: 'item', number: 6, stem: 'Hidden.', required: false, unresolved: false,
            widget: 'choice.nominal.single', showIf: 'false',
            options: [{ index: 0, text: 'X', value: 1 }] },
        ],
      }],
    }
    const { json } = toSurveyJS(m, noScores)
    const els = (json.pages as any[])[0].elements as any[]
    const q6 = els.find((e) => e.name === 'q6')
    expect(q6.visible).toBe(false)
    expect(q6.visibleIf).toBeUndefined()
  })

  it('empty choices: drops item and emits message with q<number> and "no choices"', () => {
    const m: RenderModel = {
      pages: [{
        id: 'p1', title: undefined,
        blocks: [
          { kind: 'item', number: 7, stem: 'Empty opts.', required: false, unresolved: false,
            widget: 'choice.nominal.single', showIf: undefined,
            options: [] },
        ],
      }],
    }
    const { json, dropped } = toSurveyJS(m, noScores)
    const els = (json.pages as any[])[0].elements as any[]
    expect(els.find((e) => e.name === 'q7')).toBeUndefined()
    expect(dropped.some((d) => /q7/.test(d) && /no choices/i.test(d))).toBe(true)
  })

  it('null widget: drops item and emits message with q<number>', () => {
    const m: RenderModel = {
      pages: [{
        id: 'p1', title: undefined,
        blocks: [
          { kind: 'item', number: 8, stem: 'Unknown widget.', required: false, unresolved: false,
            widget: null as any, showIf: undefined,
            options: [] },
        ],
      }],
    }
    const { json, dropped } = toSurveyJS(m, noScores)
    const els = (json.pages as any[])[0].elements as any[]
    expect(els.find((e) => e.name === 'q8')).toBeUndefined()
    expect(dropped.some((d) => /q8/.test(d))).toBe(true)
  })

  it('section items: nested item is promoted into page elements', () => {
    const m: RenderModel = {
      pages: [{
        id: 'p1', title: undefined,
        blocks: [
          { kind: 'section', id: 'sec', sharedOptions: [],
            items: [
              { kind: 'item', number: 9, stem: 'Section Q.', required: false, unresolved: false,
                widget: 'choice.nominal.single', showIf: undefined,
                options: [{ index: 0, text: 'Yes', value: 1 }] },
            ] },
        ],
      }],
    }
    const { json } = toSurveyJS(m, noScores)
    const els = (json.pages as any[])[0].elements as any[]
    const q9 = els.find((e) => e.name === 'q9')
    expect(q9).toBeDefined()
    expect(q9.type).toBe('radiogroup')
  })
})
