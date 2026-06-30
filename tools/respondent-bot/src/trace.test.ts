import { describe, expect, it } from 'vitest'
import { buildTrace, checkWellFormed, extractEventStatements } from './trace'

const body = (events: unknown) => ({ batch_id: 'b', events })

describe('extractEventStatements', () => {
  it('flattens batches in order', () => {
    const s = extractEventStatements([body([{ verb: 'bdm:initialized' }]), body([{ verb: 'bdm:selected' }, { verb: 'bdm:submitted' }])])
    expect(s.map((x) => x.verb)).toEqual(['bdm:initialized', 'bdm:selected', 'bdm:submitted'])
  })
  it('skips a batch whose events is not a list', () => {
    expect(extractEventStatements([body(null), body([{ verb: 'bdm:started' }])])).toHaveLength(1)
  })
})

describe('buildTrace', () => {
  it('wraps statements with the ids', () => {
    const t = buildTrace('dep_1', 'sess_1', [body([{ verb: 'bdm:started', timestamp: '2026-06-30T00:00:00Z' }])])
    expect(t).toEqual({ deployment_id: 'dep_1', session_id: 'sess_1', statements: [{ verb: 'bdm:started', timestamp: '2026-06-30T00:00:00Z' }] })
  })
})

describe('checkWellFormed', () => {
  it('accepts an ordered bdm: stream', () => {
    expect(checkWellFormed([{ verb: 'bdm:started', timestamp: '2026-06-30T00:00:00Z' }, { verb: 'bdm:submitted', timestamp: '2026-06-30T00:00:01Z' }]).ok).toBe(true)
  })
  it('rejects an empty stream', () => {
    expect(checkWellFormed([])).toEqual({ ok: false, reason: 'empty' })
  })
  it('rejects a non-bdm verb', () => {
    expect(checkWellFormed([{ verb: 'http://adlnet.gov/answered' }]).ok).toBe(false)
  })
  it('rejects a regressed timestamp', () => {
    const r = checkWellFormed([{ verb: 'bdm:a', timestamp: '2026-06-30T00:00:02Z' }, { verb: 'bdm:b', timestamp: '2026-06-30T00:00:01Z' }])
    expect(r).toEqual({ ok: false, reason: 'timestamp regressed' })
  })
})

describe('buildTrace — mouse', () => {
  it('includes a non-empty mouse array when provided', () => {
    const t = buildTrace('dep', 'sess', [], [{ t: 0, x: 1, y: 2, button_state: 'up' }])
    expect(t.mouse).toEqual([{ t: 0, x: 1, y: 2, button_state: 'up' }])
  })
  it('omits the mouse key when no samples are passed', () => {
    expect('mouse' in buildTrace('dep', 'sess', [])).toBe(false)
    expect('mouse' in buildTrace('dep', 'sess', [], [])).toBe(false)
  })
})
