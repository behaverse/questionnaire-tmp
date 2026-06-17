import type { Config } from 'tailwindcss'
const v = (name: string) => `var(--qv-ed-${name})`
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: { extend: { colors: {
    'ed-surface': v('surface'), 'ed-panel': v('panel'), 'ed-subtle': v('subtle'),
    'ed-border': v('border'), 'ed-border-strong': v('border-strong'),
    'ed-text': v('text'), 'ed-muted': v('muted'),
    'ed-accent': v('accent'), 'ed-accent-soft': v('accent-soft'), 'ed-danger': v('danger'),
  } } },
  plugins: [],
} satisfies Config
