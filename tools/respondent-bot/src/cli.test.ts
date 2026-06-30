import { describe, expect, it } from 'vitest'
import { writeFileSync, mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { parseArgs, loadProfile } from './cli'

describe('parseArgs', () => {
  it('parses the core flags with defaults', () => {
    const o = parseArgs(['--player', 'http://localhost:5173/', '--deployment', 'dep_1'])
    expect(o.player).toBe('http://localhost:5173/')
    expect(o.deployment).toBe('dep_1')
    expect(o.profile).toBe('random')
    expect(o.seed).toBe(1)
    expect(o.n).toBe(1)
    expect(o.direct).toBe(false)
    expect(o.locale).toBe('en')
  })
  it('parses seed, n, direct, trace, locale, viewer_url', () => {
    const o = parseArgs(['--player', 'p', '--deployment', 'd', '--profile', 'acquiescence', '--seed', '42', '--n', '5', '--direct', '--locale', 'pt', '--viewer-url', 'http://vs', '--trace', 'out.json'])
    expect(o).toMatchObject({ profile: 'acquiescence', seed: 42, n: 5, direct: true, locale: 'pt', vsBaseUrl: 'http://vs', trace: 'out.json' })
  })
  it('throws when required flags are missing', () => {
    expect(() => parseArgs(['--deployment', 'd'])).toThrow(/--player/)
    expect(() => parseArgs(['--player', 'p'])).toThrow(/--deployment/)
  })
})

describe('loadProfile', () => {
  it('resolves a built-in preset by name', () => {
    expect(loadProfile('midpoint').choice_strategy).toBe('midpoint')
  })
  it('loads a JSON profile file (for fixed maps)', () => {
    const dir = mkdtempSync(join(tmpdir(), 'rb-'))
    const path = join(dir, 'p.json')
    writeFileSync(path, JSON.stringify({ choice_strategy: 'fixed', fixed: { q1: 3 }, timing: { think_ms_min: 0, think_ms_max: 0 }, pointer: 'minimal', text: 'x' }))
    const p = loadProfile(path)
    expect(p.choice_strategy).toBe('fixed')
    expect(p.fixed).toEqual({ q1: 3 })
  })
})
