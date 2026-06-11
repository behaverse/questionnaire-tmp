import { defineConfig, mergeConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default mergeConfig(
  defineConfig({ plugins: [react() as never] }),
  defineConfig({
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./src/vitest.setup.ts'],
      css: false,
      exclude: ['tests/e2e/**', 'node_modules/**'],
    },
  }),
)
