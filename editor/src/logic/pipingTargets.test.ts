import { describe, it, expect } from 'vitest'
import { collectPipingTargets } from './pipingTargets'
import type { Questionnaire } from '../model/types'

const model = {
  metadata: { id: 'qst_x', title: 'X', language: 'en' },
  pages: [
    { id: 'p1', title: 'Page 1', elements: [
      { id: 'it_inline', question: {}, option: {} },   // inline item
      { ref: 'it_saved@v26.0601' },                     // saved item ref
      { ref: 'msg_intro@v26.0601' },                    // message → excluded
      { id: 'sec1', elements: [{ id: 'it_child', question: {} }] }, // section → excluded (not a top-level prompt)
    ] },
  ],
} as unknown as Questionnaire

describe('collectPipingTargets', () => {
  it('emits one target per top-level item (inline + saved-item-ref), with canonical paths', () => {
    const t = collectPipingTargets(model)
    expect(t.map((x) => x.fieldPath)).toEqual([
      'pages.p1.elements.0.prompt',
      'pages.p1.elements.1.prompt',
    ])
  })
  it('labels with page + element id (or index)', () => {
    const t = collectPipingTargets(model)
    expect(t[0].label).toContain('Page 1')
    expect(t[0].label).toContain('it_inline')
  })
  it('excludes messages and sections', () => {
    const paths = collectPipingTargets(model).map((x) => x.fieldPath)
    expect(paths).not.toContain('pages.p1.elements.2.prompt') // message
    expect(paths).not.toContain('pages.p1.elements.3.prompt') // section
  })
  it('is null-safe', () => {
    expect(collectPipingTargets({ metadata: { id: 'x' } } as unknown as Questionnaire)).toEqual([])
  })
})
