import { defineConfig, mergeConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'

export default defineConfig(() =>
  mergeConfig(
    defineConfig({
      plugins: [react() as never],
      server: { port: 5174 },
      resolve: {
        // single source of truth for the auth/session layer (shared with web-viewer)
        alias: {
          '@behaverse/participant-session': resolve(__dirname, '../participant-session/src/index.ts'),
        },
        // one React copy even though the shared package's source is aliased in
        dedupe: ['react', 'react-dom'],
      },
    }),
    defineConfig({
      test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: ['./src/vitest.setup.ts'],
        css: false,
      },
    }),
  ),
)
