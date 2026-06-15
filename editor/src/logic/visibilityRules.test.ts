import { describe, it, expect } from 'vitest'
import { makeBindings, isElementShown, filterPageVisible } from './visibility'
import { makeFakeEvaluator } from './evaluator'
import type { LogicRule } from '../model/types'
import type { RuntimePage } from '@behaverse/questionnaire-renderer'

const ev = makeFakeEvaluator({ "q == 'yes'": (b) => b.var('q') === 'yes' })
const binds = (answers: Record<string, unknown>) => makeBindings(answers, { score: () => null })
const hideRule: LogicRule = { type: 'visibility', condition: "q == 'yes'", action: { target_id: 'it_x', show: false } }

describe('isElementShown with visibility rules', () => {
  it('hides the target when a hide-rule condition holds', () => {
    expect(isElementShown({ id: 'it_x' }, ev, binds({ q: 'yes' }), [hideRule])).toBe(false)
  })
  it('shows the target when the rule condition is false (falls through to default)', () => {
    expect(isElementShown({ id: 'it_x' }, ev, binds({ q: 'no' }), [hideRule])).toBe(true)
  })
  it('a visibility rule takes precedence over show_if', () => {
    // show_if would show it (q==yes true), but the hide-rule wins
    const el = { id: 'it_x', show_if: "q == 'yes'" }
    expect(isElementShown(el, ev, binds({ q: 'yes' }), [hideRule])).toBe(false)
  })
  it('ignores rules targeting a different element', () => {
    expect(isElementShown({ id: 'it_other' }, ev, binds({ q: 'yes' }), [hideRule])).toBe(true)
  })
  it('malformed rule condition is skipped (element falls through to visible)', () => {
    const evBad = { ...ev, check: () => 'parse error' }
    expect(isElementShown({ id: 'it_x' }, evBad, binds({ q: 'yes' }), [hideRule])).toBe(true)
  })
  it('default rules=[] preserves D1 behaviour', () => {
    expect(isElementShown({ id: 'it_x', show_if: "q == 'yes'" }, ev, binds({ q: 'no' }))).toBe(false)
  })
})

describe('filterPageVisible threads rules', () => {
  it('drops a page element hidden by a visibility rule', () => {
    const page = { id: 'p1', elements: [{ id: 'it_x' }, { id: 'it_y' }] } as unknown as RuntimePage
    const out = filterPageVisible(page, ev, binds({ q: 'yes' }), [hideRule])
    expect(out.elements.map((e) => (e as { id: string }).id)).toEqual(['it_y'])
  })
})
