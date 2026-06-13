import type { ViewerTheme } from '../types'

export const artsy: ViewerTheme = {
  id: 'artsy',
  name: 'Artsy',
  fonts: ['Bricolage Grotesque:wght@600;700;800'],
  surface: { kind: 'grid', background: '#FFE066', pattern: 'rgba(26,26,26,0.11)', patternSize: '30px' },
  card: { enabled: true, surface: '#ffffff', border: '#1A1A1A', borderWidth: '3px', radius: '6px',
    shadow: '12px 12px 0 0 #D81B60', padding: '2.5rem' },
  prompt: { fontFamily: "'Bricolage Grotesque', system-ui, sans-serif", weight: 800, size: '2.35rem', color: '#1A1A1A', letterSpacing: '-0.01em' },
  secondary: { color: '#8A4A6E' },
  options: {
    variant: 'brutal',
    surface: '#ffffff', border: '#1A1A1A', radius: '4px',
    hoverSurface: '#ffffff', hoverBorder: '#1A1A1A',
    selected: { surface: '#D81B60', border: '#1A1A1A', color: '#ffffff', shadow: '4px 4px 0 0 #1A1A1A' },
  },
  badge: {
    border: '#1A1A1A', color: '#1A1A1A', surface: '#FFE066', radius: '3px',
    selected: { border: '#1A1A1A', color: '#D81B60', surface: '#ffffff' },
  },
  button: { surface: '#D81B60', color: '#ffffff', radius: '4px', shadow: '4px 4px 0 0 #1A1A1A', fontFamily: "'Bricolage Grotesque', sans-serif", weight: 700 },
  accent: '#D81B60',
}
