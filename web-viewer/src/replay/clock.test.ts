import { describe, expect, it } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { advanceClock, useReplayClock } from './clock'

describe('advanceClock', () => {
  it('advances by dt*speed and clamps at duration', () => {
    expect(advanceClock(0, 100, 1, 1000)).toEqual({ offsetMs: 100, done: false })
    expect(advanceClock(0, 100, 2, 1000)).toEqual({ offsetMs: 200, done: false })
    expect(advanceClock(950, 100, 1, 1000)).toEqual({ offsetMs: 1000, done: true })
  })
  it('never goes below 0', () => {
    expect(advanceClock(0, -50, 1, 1000).offsetMs).toBe(0)
  })
})

describe('useReplayClock', () => {
  it('seek clamps to [0, duration]; setSpeed + play/pause update state', () => {
    const { result } = renderHook(() => useReplayClock(1000))
    expect(result.current.offsetMs).toBe(0)
    act(() => result.current.seek(1500))
    expect(result.current.offsetMs).toBe(1000)
    act(() => result.current.seek(-10))
    expect(result.current.offsetMs).toBe(0)
    act(() => { result.current.setSpeed(2); result.current.play() })
    expect(result.current.speed).toBe(2)
    expect(result.current.playing).toBe(true)
    act(() => result.current.pause())
    expect(result.current.playing).toBe(false)
  })
})
