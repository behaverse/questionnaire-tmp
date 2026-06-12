import { defineConfig, mergeConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// Dedicated vitest config for the built-library smoke test. The default
// vite.config.ts excludes tests/lib/** (so `npm test` never imports the
// not-yet-built dist-lib artifact); this config re-includes only that dir
// and is used by `npm run test:lib` after `build:lib`.
export default mergeConfig(
  defineConfig({ plugins: [react() as never] }),
  defineConfig({
    test: {
      globals: true,
      environment: 'jsdom',
      include: ['tests/lib/**/*.test.tsx'],
      exclude: ['node_modules/**'],
    },
  }),
)
