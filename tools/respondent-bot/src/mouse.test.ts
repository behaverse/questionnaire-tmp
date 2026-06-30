import { describe, expect, it } from 'vitest'
import { interpolatePath, MouseRecorder, type MouseSample } from './mouse'

const clock = (times: number[]) => { let i = 0; return () => times[Math.min(i++, times.length - 1)]! }

describe('interpolatePath', () => {
  it('returns `steps` points ending exactly at `to`', () => {
    const p = interpolatePath({ x: 0, y: 0 }, { x: 10, y: 0 }, 5)
    expect(p).toHaveLength(5)
    expect(p[4]).toEqual({ x: 10, y: 0 })
    expect(p[0]!.x).toBeGreaterThan(0)
    // monotonic in x
    for (let i = 1; i < p.length; i++) expect(p[i]!.x).toBeGreaterThanOrEqual(p[i - 1]!.x)
  })
  it('clamps steps below 1 to a single hop to `to`', () => {
    expect(interpolatePath({ x: 0, y: 0 }, { x: 4, y: 8 }, 0)).toEqual([{ x: 4, y: 8 }])
  })
})

describe('MouseRecorder', () => {
  it('records t relative to the first sample and rounds coords to integers', () => {
    const r = new MouseRecorder(clock([1000, 1100, 1200, 1300]))
    r.moveThrough([{ x: 0.4, y: 0.6 }, { x: 10.5, y: 20.2 }], 'up')
    r.press({ x: 10.5, y: 20.2 })
    r.release({ x: 10.5, y: 20.2 })
    expect(r.samples()).toEqual<MouseSample[]>([
      { t: 0, x: 0, y: 1, button_state: 'up' },
      { t: 0.1, x: 11, y: 20, button_state: 'up' },
      { t: 0.2, x: 11, y: 20, button_state: 'left_down' },
      { t: 0.3, x: 11, y: 20, button_state: 'up' },
    ])
  })
  it('every sample matches the Schema-4b shape', () => {
    const r = new MouseRecorder(clock([0, 1]))
    r.moveThrough([{ x: 1, y: 2 }], 'up')
    r.press({ x: 1, y: 2 })
    for (const s of r.samples()) {
      expect(Object.keys(s).sort()).toEqual(['button_state', 't', 'x', 'y'])
      expect(['up', 'left_down', 'right_down', 'middle_down']).toContain(s.button_state)
      expect(Number.isInteger(s.x) && Number.isInteger(s.y)).toBe(true)
      expect(s.t).toBeGreaterThanOrEqual(0)
    }
  })
})
