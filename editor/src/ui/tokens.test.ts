// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import tw from '../../tailwind.config'

const css = readFileSync(fileURLToPath(new URL('../index.css', import.meta.url)), 'utf8')

describe('editor design tokens', () => {
  it('defines the core chrome CSS variables', () => {
    for (const v of ['--qv-ed-surface', '--qv-ed-panel', '--qv-ed-border', '--qv-ed-text', '--qv-ed-muted', '--qv-ed-accent']) {
      expect(css).toContain(v)
    }
  })
  it('maps semantic colors into the tailwind theme', () => {
    const colors = (tw as any).theme.extend.colors
    for (const c of ['ed-surface', 'ed-panel', 'ed-border', 'ed-text', 'ed-muted', 'ed-accent']) {
      expect(colors[c]).toMatch(/var\(--qv-ed-/)
    }
  })
})
