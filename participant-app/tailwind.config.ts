import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: { primary: 'var(--qv-primary)' },
      fontFamily: { theme: ['var(--qv-font-family)'] },
    },
  },
  plugins: [],
} satisfies Config
