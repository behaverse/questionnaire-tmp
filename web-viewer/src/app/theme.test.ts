import { applyTheme, bundleToThemeId } from './theme'
import { getTheme } from '../theme/registry'

afterEach(() => {
  document.documentElement.removeAttribute('style')
  document.documentElement.removeAttribute('data-card')
  document.documentElement.removeAttribute('data-option-variant')
  document.documentElement.removeAttribute('data-surface')
})

test('applyTheme(minimal) sets vars + structural attrs on <html>', () => {
  applyTheme(getTheme('minimal'))
  const el = document.documentElement
  expect(el.style.getPropertyValue('--qv-prompt-color')).toBe('#18181b')
  expect(el.style.getPropertyValue('--qv-card-padding')).toBe('0px')
  expect(el.getAttribute('data-card')).toBe('off')
  expect(el.getAttribute('data-option-variant')).toBe('borderless')
})
test('applyTheme(sage) sets the coloured card surface + data-card=on', () => {
  applyTheme(getTheme('sage'))
  expect(document.documentElement.style.getPropertyValue('--qv-card-surface')).toBe('#D4E3CE')
  expect(document.documentElement.getAttribute('data-card')).toBe('on')
})
test('bundleToThemeId returns the bundle theme_id when it names a built-in, else null', () => {
  expect(bundleToThemeId({ theme_id: 'sage' })).toBe('sage')
  expect(bundleToThemeId({ theme_id: 'corporate-blue' })).toBe(null)
  expect(bundleToThemeId(null)).toBe(null)
})
test('applyTheme overlays a VS palette override on top of the base theme', () => {
  applyTheme(getTheme('minimal'), { palette: { primary: '#0055ff' } })
  expect(document.documentElement.style.getPropertyValue('--qv-primary')).toBe('#0055ff')
})
