import { describe, expect, it } from 'vitest'
import { buildCursor, findRecordingStartMs } from './cursor'
import type { MouseSample } from '../app/mouseCapture'
import type { BdmEvent } from '../app/events'

const samples: MouseSample[] = [
  { t: 0, x: 0, y: 0, button_state: 'up' },
  { t: 1, x: 100, y: 50, button_state: 'up' },
]

describe('buildCursor', () => {
  it('interpolates between samples relative to recordingStartMs', () => {
    const at = buildCursor(samples, 1000)
    expect(at(1000)).toEqual({ x: 0, y: 0 })       // t=0
    expect(at(1500)).toEqual({ x: 50, y: 25 })     // halfway
    expect(at(2000)).toEqual({ x: 100, y: 50 })    // t=1
  })
  it('returns null before the first and after the last sample', () => {
    const at = buildCursor(samples, 1000)
    expect(at(999)).toBeNull()
    expect(at(2001)).toBeNull()
  })
  it('empty samples → always null', () => {
    expect(buildCursor([], 0)(123)).toBeNull()
  })
})

describe('findRecordingStartMs', () => {
  it('returns the recording_started timestamp in ms', () => {
    const st: BdmEvent[] = [
      { timestamp: '2026-01-01T00:00:01.000Z', actor: { objectType: 'bdm:Engine', id: 'e' }, verb: 'bdm:started', object: { objectType: 'x', id: 's' } },
      { timestamp: '2026-01-01T00:00:02.000Z', actor: { objectType: 'bdm:Engine', id: 'e' }, verb: 'bdm:recording_started', object: { objectType: 'bdm:Recording', id: 'r' } },
    ]
    expect(findRecordingStartMs(st)).toBe(Date.parse('2026-01-01T00:00:02.000Z'))
  })
  it('returns null when absent', () => {
    expect(findRecordingStartMs([])).toBeNull()
  })
})
