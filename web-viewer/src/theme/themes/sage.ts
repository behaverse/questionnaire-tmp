import type { ViewerTheme } from '../types'

export const sage: ViewerTheme = {
  id: 'sage',
  name: 'Sage',
  surface: { kind: 'plain', background: '#F6F8F5' },
  card: { enabled: true, surface: '#D4E3CE', border: '#BBD2B3', borderWidth: '1px', radius: '24px',
    shadow: '0 22px 50px -20px rgba(40,80,40,.30), 0 2px 8px rgba(40,80,40,.06)', padding: '2.75rem 2.75rem 2.25rem' },
  prompt: { fontFamily: 'Inter, system-ui, sans-serif', weight: 600, size: '2.05rem', color: '#243024', letterSpacing: '-0.015em' },
  secondary: { color: '#566B52' },
  options: {
    variant: 'outline',
    surface: '#ffffff', border: '#C3D7BC', radius: '12px',
    hoverSurface: '#ffffff', hoverBorder: '#9FBF96',
    selected: { surface: '#4F6F52', border: '#4F6F52', color: '#ffffff', shadow: '0 6px 16px rgba(79,111,82,.25)' },
  },
  badge: {
    border: '#C3D7BC', color: '#5C6E58', surface: '#ffffff', radius: '7px',
    selected: { border: '#ffffff', color: '#4F6F52', surface: '#ffffff' },
  },
  button: { surface: '#4F6F52', color: '#ffffff', radius: '11px' },
  accent: '#4F6F52',
}
