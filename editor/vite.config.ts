import { defineConfig } from 'vitest/config'
import { loadEnv, type PluginOption, type ViteDevServer } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'

const distLib = resolve(__dirname, '../web-viewer/dist-lib')
// Load .env / .env.local (all vars, no VITE_ filter) for the dev shim below. Server-side only;
// these never reach the browser bundle. Harmless in build/test (the shim self-gates to `serve`).
const devEnv = loadEnv('development', __dirname, '')

// Dev-only shim: serve POST /api/translate locally so auto-translate works on `npm run dev`
// (plain Vite does NOT run the Vercel function in editor/api/). Mirrors api/translate.ts:
// it builds the prompt via the shared translateCore and calls the model through the `ai` package,
// reading the key + model from .env.local (server-side only — never exposed to the browser).
function devTranslateApi(env: Record<string, string>): PluginOption {
  return {
    name: 'dev-translate-api',
    apply: 'serve',
    configureServer(server: ViteDevServer) {
      console.log('[dev-translate-api] /api/translate dev shim active')
      server.middlewares.use((req, res, next) => {
        if (req.method !== 'POST' || !(req.url || '').startsWith('/api/translate')) return next()
        let body = ''
        req.on('data', (c) => { body += c })
        req.on('end', () => {
          void (async () => {
            const send = (status: number, obj: unknown) => {
              res.statusCode = status
              res.setHeader('content-type', 'application/json')
              res.end(JSON.stringify(obj))
            }
            try {
              const input = JSON.parse(body || '{}')
              // expose keys to the AI SDK providers (server-side only)
              if (env.AI_GATEWAY_API_KEY) process.env.AI_GATEWAY_API_KEY = env.AI_GATEWAY_API_KEY
              if (env.ANTHROPIC_API_KEY) process.env.ANTHROPIC_API_KEY = env.ANTHROPIC_API_KEY
              const { translateField } = await server.ssrLoadModule('/src/translate/translateCore.ts')
              const { makeGenerate } = await server.ssrLoadModule('/api/_provider.ts')
              const translation = await translateField(input, await makeGenerate(env))
              send(200, { translation })
            } catch (e) {
              const status = (e as { status?: number }).status ?? 502
              send(status, { error: (e as Error).message ?? 'translation failed' })
            }
          })()
        })
      })
    },
  }
}

export default defineConfig({
  // devTranslateApi self-gates to `serve` via `apply`, so it's inert in build/test.
  plugins: [react() as never, devTranslateApi(devEnv) as never],
  resolve: {
    alias: {
      '@behaverse/questionnaire-renderer/style.css': resolve(distLib, 'renderer.css'),
      '@behaverse/questionnaire-renderer': resolve(distLib, 'renderer.js'),
      '@behaverse/questionnaire-scorer': resolve(distLib, 'scoring.js'),
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
