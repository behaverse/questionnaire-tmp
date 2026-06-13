import type { ViewerTheme } from '../types'

export const minimal: ViewerTheme = {
  id: 'minimal',
  name: 'Minimal',
  surface: { kind: 'plain', background: '#ffffff' },
  card: { enabled: false },
  prompt: { fontFamily: 'Inter, system-ui, sans-serif', weight: 500, size: '2.05rem', color: '#18181b', letterSpacing: '-0.02em' },
  secondary: { color: '#71717a' },
  options: {
    variant: 'borderless',
    surface: 'transparent', border: 'transparent', radius: '10px',
    hoverSurface: '#f4f4f5', hoverBorder: 'transparent',
    selected: { surface: 'transparent', border: 'transparent', color: '#18181b', shadow: 'inset 3px 0 0 #18181b' },
  },
  badge: {
    border: 'transparent', color: '#a1a1aa', surface: 'transparent', radius: '7px',
    selected: { border: 'transparent', color: '#18181b', surface: 'transparent' },
  },
  button: { surface: '#18181b', color: '#ffffff', radius: '9px' },
  accent: '#18181b',
}
