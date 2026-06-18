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
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        preview: resolve(__dirname, 'preview.html'),
      },
    },
  },
  // Pin to 5173 (strictPort): the live Library's CORS allowlist includes
  // http://localhost:5173. Without strictPort, vite silently falls back to 5174+
  // when 5173 is busy, and every Library fetch (pickers, browse) is then CORS-blocked.
  // Failing loudly on a busy port is the correct signal (reuse the existing 5173 server).
  server: { port: 5173, strictPort: true, fs: { allow: [resolve(__dirname, '..')] } },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/vitest.setup.ts'],
    css: false,
    exclude: ['tests/e2e/**', 'node_modules/**'],
  },
})
