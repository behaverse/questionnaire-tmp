import { themeToVars } from './cssvars'
import { minimal } from './themes/minimal'
import { sage } from './themes/sage'
import { artsy } from './themes/artsy'

test('minimal: no-card → transparent card vars + borderless option variant attr', () => {
  const { vars, attrs } = themeToVars(minimal)
  expect(vars['--qv-card-surface']).toBe('transparent')
  expect(vars['--qv-card-padding']).toBe('0px')
  expect(vars['--qv-prompt-color']).toBe('#18181b')
  expect(vars['--qv-option-selected-shadow']).toBe('inset 3px 0 0 #18181b')
  expect(attrs['data-card']).toBe('off')
  expect(attrs['data-option-variant']).toBe('borderless')
  expect(attrs['data-surface']).toBe('plain')
})
test('sage: card vars carry the coloured surface + padding', () => {
  const { vars, attrs } = themeToVars(sage)
  expect(vars['--qv-card-surface']).toBe('#D4E3CE')
  expect(vars['--qv-card-padding']).toBe('2.75rem 2.75rem 2.25rem')
  expect(attrs['data-card']).toBe('on')
  expect(attrs['data-option-variant']).toBe('outline')
})
test('artsy grid: surface image is a two-axis grid gradient sized by patternSize', () => {
  const { vars, attrs } = themeToVars(artsy)
  expect(vars['--qv-surface-bg']).toBe('#FFE066')
  expect(vars['--qv-surface-image']).toContain('linear-gradient')
  expect(vars['--qv-surface-size']).toBe('30px 30px')
  expect(vars['--qv-card-border-width']).toBe('3px')
  expect(attrs['data-surface']).toBe('grid')
  expect(attrs['data-option-variant']).toBe('brutal')
})
