import { defineConfig, mergeConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { resolve } from 'node:path'

export default defineConfig(({ mode }) =>
  mergeConfig(
    defineConfig({
      plugins: [react() as never, VitePWA({
        registerType: 'autoUpdate',
        injectRegister: null,
        manifest: false,
        workbox: {
          globPatterns: ['**/*.{js,css,html,wasm,svg}'],
          maximumFileSizeToCacheInBytes: 4_000_000,
          runtimeCaching: [{ urlPattern: ({ url }: { url: URL }) => url.pathname.startsWith('/v1/'), handler: 'NetworkOnly' }],
        },
      }) as never],
      build: {
        rollupOptions: {
          input: mode === 'production'
            ? { main: resolve(__dirname, 'index.html') }
            : { main: resolve(__dirname, 'index.html'), gallery: resolve(__dirname, 'gallery.html') },
        },
      },
    }),
    defineConfig({
      test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: ['./src/vitest.setup.ts'],
        css: false,
        exclude: ['tests/e2e/**', 'tests/lib/**', 'node_modules/**'],
      },
    }),
  )
)
