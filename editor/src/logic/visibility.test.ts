import { describe, it, expect } from 'vitest'
import { makeBindings, isElementShown, filterPageVisible } from './visibility'
import { makeFakeEvaluator } from './evaluator'
import type { RuntimePage } from '@behaverse/questionnaire-renderer'

const ev = makeFakeEvaluator({ "q == 'yes'": (b) => b.var('q') === 'yes' })
const binds = (answers: Record<string, unknown>) => makeBindings(answers, { score: () => null })

describe('isElementShown', () => {
  it('shows elements without show_if', () => {
    expect(isElementShown({ id: 'a' }, ev, binds({}))).toBe(true)
  })
  it('evaluates show_if against bindings', () => {
    expect(isElementShown({ id: 'a', show_if: "q == 'yes'" }, ev, binds({ q: 'yes' }))).toBe(true)
    expect(isElementShown({ id: 'a', show_if: "q == 'yes'" }, ev, binds({ q: 'no' }))).toBe(false)
  })
  it('shows (not hides) on malformed show_if', () => {
    const evBad = { ...ev, check: () => 'parse error' }
    expect(isElementShown({ id: 'a', show_if: '<<bad>>' }, evBad, binds({}))).toBe(true)
  })
})

describe('filterPageVisible', () => {
  it('drops hidden page elements and hidden section children', () => {
    const page = { id: 'p1', elements: [
      { id: 'keep' },
      { id: 'drop', show_if: "q == 'yes'" },
      { id: 'sec', elements: [{ id: 'child_keep' }, { id: 'child_drop', show_if: "q == 'yes'" }] },
    ] } as unknown as RuntimePage
    const out = filterPageVisible(page, ev, binds({ q: 'no' }))
    expect(out.elements.map((e) => (e as { id: string }).id)).toEqual(['keep', 'sec'])
    const sec = out.elements.find((e) => (e as { id: string }).id === 'sec') as { elements: { id: string }[] }
    expect(sec.elements.map((e) => e.id)).toEqual(['child_keep'])
  })
  it('returns a new page object (does not mutate input)', () => {
    const page = { id: 'p1', elements: [{ id: 'drop', show_if: "q == 'yes'" }] } as unknown as RuntimePage
    const out = filterPageVisible(page, ev, binds({ q: 'no' }))
    expect(page.elements.length).toBe(1)
    expect(out.elements.length).toBe(0)
  })
})
