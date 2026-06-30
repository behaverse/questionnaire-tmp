import { defineConfig } from 'vitest/config'
// e2e specs run under Playwright, not Vitest.
export default defineConfig({ test: { include: ['src/**/*.test.ts'], exclude: ['tests/e2e/**'] } })
