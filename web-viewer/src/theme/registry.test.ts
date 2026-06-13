import { THEMES, DEFAULT_THEME_ID, getTheme, resolveThemeId } from './registry'

test('default theme is minimal and is registered', () => {
  expect(DEFAULT_THEME_ID).toBe('minimal')
  expect(THEMES.minimal).toBeDefined()
})
test('getTheme falls back to default for unknown/empty id', () => {
  expect(getTheme('nope').id).toBe('minimal')
  expect(getTheme(null).id).toBe('minimal')
  expect(getTheme('minimal').id).toBe('minimal')
})
test('resolveThemeId precedence: param > bundle > default', () => {
  expect(resolveThemeId({ themeParam: 'minimal', bundleId: null })).toBe('minimal')
  expect(resolveThemeId({ themeParam: 'unknown', bundleId: null })).toBe('minimal')
  expect(resolveThemeId({ bundleId: 'minimal', themeParam: null })).toBe('minimal')
  expect(resolveThemeId({})).toBe('minimal')
})
