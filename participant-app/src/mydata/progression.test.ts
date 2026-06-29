import { describe, it, expect } from 'vitest'
import { groupByInstrument } from './progression'
import type { MySession } from './client'

const s = (over: Partial<MySession>): MySession => ({
  session_id: 'x', instrument_id: 'qst_a', instrument_version: 'v1', deployment_id: 'd',
  status: 'submitted', session_index: 1, started_at: null, completed_at: null, submitted_at: null, ...over,
})

describe('groupByInstrument', () => {
  it('groups by instrument and builds chronological series per named score', () => {
    const groups = groupByInstrument([
      s({ instrument_id: 'qst_a', submitted_at: '2026-02-01', score_display: [{ id: 'sc', name: 'Total', value: 8 }] }),
      s({ instrument_id: 'qst_a', submitted_at: '2026-01-01', score_display: [{ id: 'sc', name: 'Total', value: 12 }] }),
      s({ instrument_id: 'qst_b', submitted_at: '2026-01-01', score_display: [{ id: 'sc', name: 'X', value: 3 }] }),
    ])
    const a = groups.find((g) => g.instrument_id === 'qst_a')!
    expect(a.series).toHaveLength(1)
    expect(a.series[0]).toEqual({ id: 'sc', name: 'Total', points: [
      { date: '2026-01-01', value: 12 }, { date: '2026-02-01', value: 8 },   // chronological
    ] })
    expect(groups.map((g) => g.instrument_id).sort()).toEqual(['qst_a', 'qst_b'])
  })

  it('omits sessions without a date or score_display from series', () => {
    const groups = groupByInstrument([
      s({ instrument_id: 'qst_a', submitted_at: null, completed_at: null, started_at: null, score_display: [{ id: 'sc', name: 'T', value: 1 }] }),
      s({ instrument_id: 'qst_a', submitted_at: '2026-01-01', score_display: null }),
    ])
    expect(groups[0].series).toEqual([])
  })
})
