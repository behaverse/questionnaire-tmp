import { describe, expect, it } from 'vitest'
import { MouseCapture } from './mouseCapture'

// a controllable clock (ms)
function clock(start = 0) { let t = start; return { now: () => t, advance: (ms: number) => { t += ms } } }
const move = (x: number, y: number) => new MouseEvent('mousemove', { clientX: x, clientY: y })
const down = (x: number, y: number, button = 0) => new MouseEvent('mousedown', { clientX: x, clientY: y, button })
const up = (x: number, y: number, button = 0) => new MouseEvent('mouseup', { clientX: x, clientY: y, button })

describe('MouseCapture', () => {
  it('throttles mousemove to ~the sample rate', () => {
    const c = clock()
    const target = new EventTarget()
    const cap = new MouseCapture({ sampleRateHz: 6, now: c.now, target }) // min interval ~167ms
    cap.start()
    target.dispatchEvent(move(10, 10))        // t=0 -> sampled (first)
    c.advance(50); target.dispatchEvent(move(11, 11))  // +50ms -> throttled out
    c.advance(50); target.dispatchEvent(move(12, 12))  // +100ms -> throttled out
    c.advance(100); target.dispatchEvent(move(13, 13)) // +200ms total since last -> sampled
    const s = cap.stop()
    expect(s.map((r) => [r.x, r.y])).toEqual([[10, 10], [13, 13]])
    expect(s[0]!.t).toBe(0)
    expect(s[1]!.t).toBeCloseTo(0.2, 5)
  })

  it('captures button transitions immediately and flips button_state', () => {
    const c = clock()
    const target = new EventTarget()
    const cap = new MouseCapture({ sampleRateHz: 6, now: c.now, target })
    cap.start()
    c.advance(10); target.dispatchEvent(down(5, 5))   // immediate, left_down
    c.advance(10); target.dispatchEvent(up(5, 5))     // immediate, up
    const s = cap.stop()
    expect(s.map((r) => r.button_state)).toEqual(['left_down', 'up'])
    expect(s.every((r) => Number.isInteger(r.x) && Number.isInteger(r.y))).toBe(true)
  })

  it('rounds coords and matches the Schema-4b shape', () => {
    const c = clock()
    const target = new EventTarget()
    const cap = new MouseCapture({ now: c.now, target })   // default 60 Hz
    cap.start()
    target.dispatchEvent(move(1.6, 2.4))
    const s = cap.stop()
    expect(Object.keys(s[0]!).sort()).toEqual(['button_state', 't', 'x', 'y'])
    expect(s[0]).toEqual({ t: 0, x: 2, y: 2, button_state: 'up' })
  })

  it('caps at maxSamples', () => {
    const c = clock()
    const target = new EventTarget()
    const cap = new MouseCapture({ sampleRateHz: 1000, maxSamples: 3, now: c.now, target })
    cap.start()
    for (let i = 0; i < 10; i++) { c.advance(5); target.dispatchEvent(move(i, i)) }
    expect(cap.stop()).toHaveLength(3)
  })

  it('stop() detaches and is idempotent', () => {
    const c = clock()
    const target = new EventTarget()
    const cap = new MouseCapture({ now: c.now, target })
    cap.start()
    target.dispatchEvent(move(1, 1))
    const first = cap.stop()
    target.dispatchEvent(move(2, 2))           // after stop -> ignored (detached)
    expect(cap.stop()).toEqual(first)          // idempotent, no new samples
  })

  it('exposes the configured sample rate', () => {
    expect(new MouseCapture({ sampleRateHz: 12 }).sampleRateHz).toBe(12)
    expect(new MouseCapture().sampleRateHz).toBe(60)
  })
})
