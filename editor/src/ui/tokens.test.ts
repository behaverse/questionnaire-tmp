// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

// Read the SOURCE files as text. Importing `../../tailwind.config` is fragile: Vite
// resolves `.js` before `.ts`, so it would read the gitignored, tsc-generated
// tailwind.config.js (stale/absent depending on build state) instead of the source.
const read = (rel: string) => readFileSync(fileURLToPath(new URL(rel, import.meta.url)), 'utf8')
const css = read('../index.css')
const twSource = read('../../tailwind.config.ts')

describe('editor design tokens', () => {
  it('defines the core chrome CSS variables', () => {
    for (const v of ['--qv-ed-surface', '--qv-ed-panel', '--qv-ed-border', '--qv-ed-text', '--qv-ed-muted', '--qv-ed-accent']) {
      expect(css).toContain(v)
    }
  })
  it('maps semantic colors into the tailwind theme', () => {
    for (const c of ['ed-surface', 'ed-panel', 'ed-border', 'ed-text', 'ed-muted', 'ed-accent']) {
      expect(twSource).toContain(`'${c}'`)
    }
    expect(twSource).toMatch(/var\(--qv-ed-/)
  })
})
