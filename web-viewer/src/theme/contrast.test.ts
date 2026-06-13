import { contrastRatio, meetsAA } from './contrast'

test('black on white is 21:1', () => {
  expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 0)
})
test('white on white is 1:1', () => {
  expect(contrastRatio('#ffffff', '#ffffff')).toBeCloseTo(1, 1)
})
test('handles 3-digit hex', () => {
  expect(contrastRatio('#000', '#fff')).toBeCloseTo(21, 0)
})
test('meetsAA: white on deep green #4F6F52 passes (>=4.5)', () => {
  expect(meetsAA('#ffffff', '#4F6F52')).toBe(true)
})
test('meetsAA: mid-grey #a1a1aa on white fails for normal text', () => {
  expect(meetsAA('#a1a1aa', '#ffffff')).toBe(false)
})

import { THEMES } from './registry'
import type { ViewerTheme } from './types'

/** Background a given text sits on (card surface if carded, else page background). */
function effectiveBg(t: ViewerTheme): string {
  return t.card.enabled && t.card.surface ? t.card.surface : t.surface.background
}
/** Resolve a possibly-'transparent' fill to the solid colour the text actually sits on. */
function solidBg(surface: string, t: ViewerTheme): string {
  return surface === 'transparent' ? effectiveBg(t) : surface
}

describe('every built-in theme meets WCAG AA on its load-bearing pairs', () => {
  for (const t of Object.values(THEMES)) {
    const bg = effectiveBg(t)
    test(`${t.id}: prompt vs surface`, () => {
      expect(meetsAA(t.prompt.color, bg, true)).toBe(true)
    })
    test(`${t.id}: secondary text vs surface`, () => {
      expect(meetsAA(t.secondary.color, bg)).toBe(true)
    })
    test(`${t.id}: selected option text vs selected surface`, () => {
      expect(meetsAA(t.options.selected.color, solidBg(t.options.selected.surface, t))).toBe(true)
    })
    test(`${t.id}: button text vs button surface`, () => {
      expect(meetsAA(t.button.color, solidBg(t.button.surface, t))).toBe(true)
    })
    test(`${t.id}: selected badge text vs selected badge surface`, () => {
      expect(meetsAA(t.badge.selected.color, solidBg(t.badge.selected.surface, t))).toBe(true)
    })
  }
})
