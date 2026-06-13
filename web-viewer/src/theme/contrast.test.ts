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
