import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: { accent: { DEFAULT: '#2563eb', fg: '#1e3a8a' } },
    },
  },
  plugins: [],
} satisfies Config
