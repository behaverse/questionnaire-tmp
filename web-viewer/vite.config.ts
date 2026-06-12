import { defineConfig, mergeConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default mergeConfig(
  defineConfig({ plugins: [react() as never, VitePWA({
    registerType: 'autoUpdate',
    injectRegister: null,
    manifest: false,
    workbox: {
      globPatterns: ['**/*.{js,css,html,wasm,svg}'],
      maximumFileSizeToCacheInBytes: 4_000_000,
      runtimeCaching: [{ urlPattern: ({ url }: { url: URL }) => url.pathname.startsWith('/v1/'), handler: 'NetworkOnly' }],
    },
  }) as never] }),
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
