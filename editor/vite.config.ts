import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'

const distLib = resolve(__dirname, '../web-viewer/dist-lib')

export default defineConfig({
  plugins: [react() as never],
  resolve: {
    alias: {
      '@behaverse/questionnaire-renderer/style.css': resolve(distLib, 'renderer.css'),
      '@behaverse/questionnaire-renderer': resolve(distLib, 'renderer.js'),
    },
  },
  server: { fs: { allow: [resolve(__dirname, '..')] } },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/vitest.setup.ts'],
    css: false,
    exclude: ['tests/e2e/**', 'node_modules/**'],
  },
})
