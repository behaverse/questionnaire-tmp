import { themeToCssVars } from './theme'

const vsTheme = {
  theme_id: 'default', name: 'Behaverse Default',
  palette: { primary: '#1a5fb4', secondary: '#613583', success: '#26734d', warning: '#8f6000', error: '#a51d2d', background: '#ffffff' },
  typography: { font_family: 'Georgia, serif', base_size: 18 },
  spacing: { unit: 8 }, logo_url: null, custom_css: null,
}

test('maps the VS theme bundle onto --qv-* vars', () => {
  expect(themeToCssVars(vsTheme)).toEqual({
    '--qv-primary': '#1a5fb4', '--qv-secondary': '#613583', '--qv-success': '#26734d',
    '--qv-warning': '#8f6000', '--qv-error': '#a51d2d', '--qv-background': '#ffffff',
    '--qv-font-family': 'Georgia, serif', '--qv-base-size': '18px', '--qv-space-unit': '8px',
  })
})
test('null theme → no overrides (index.css defaults stand)', () => {
  expect(themeToCssVars(null)).toEqual({})
})
test('partial theme maps only what it has', () => {
  expect(themeToCssVars({ palette: { primary: '#000000' } })).toEqual({ '--qv-primary': '#000000' })
})
