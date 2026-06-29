import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: 'var(--qv-primary)',
        secondary: 'var(--qv-secondary)',
        success: 'var(--qv-success)',
        warning: 'var(--qv-warning)',
        error: 'var(--qv-error)',
        surface: 'var(--qv-surface-bg)',
      },
      fontFamily: { theme: ['var(--qv-font-family)'] },
    },
  },
  plugins: [],
} satisfies Config
