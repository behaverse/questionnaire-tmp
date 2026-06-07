import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Restrained scholarly accent — a deep ink-indigo, calmer than consumer blue.
        accent: { DEFAULT: '#3a4cb5', fg: '#2b3a8f' },
        // Warm "paper & ink" neutrals layered on top of Tailwind's slate scale.
        paper: { DEFAULT: '#faf9f6', raised: '#ffffff', sunken: '#f3f1ea' },
        ink: { DEFAULT: '#1f2430', soft: '#454c5c', faint: '#7a8194' },
        rule: { DEFAULT: '#e7e3d8', soft: '#efece3' },
      },
      fontFamily: {
        serif: ['Fraunces', 'Georgia', 'ui-serif', 'serif'],
        sans: ['"IBM Plex Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      letterSpacing: {
        tightish: '-0.011em',
      },
      boxShadow: {
        card: '0 1px 2px rgba(31, 36, 48, 0.04), 0 1px 1px rgba(31, 36, 48, 0.03)',
        raised: '0 1px 3px rgba(31, 36, 48, 0.06), 0 6px 16px -8px rgba(31, 36, 48, 0.10)',
      },
    },
  },
  plugins: [],
} satisfies Config
