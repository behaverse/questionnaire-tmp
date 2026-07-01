import { useCallback, useEffect, useRef, useState } from 'react'

export function advanceClock(offsetMs: number, dtMs: number, speed: number, durationMs: number): { offsetMs: number; done: boolean } {
  const next = Math.max(0, Math.min(durationMs, offsetMs + dtMs * speed))
  return { offsetMs: next, done: next >= durationMs }
}

export function useReplayClock(durationMs: number) {
  const [offsetMs, setOffsetMs] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)
  const last = useRef<number | null>(null)

  useEffect(() => {
    if (!playing) { last.current = null; return }
    let raf = 0
    const step = (t: number) => {
      const prev = last.current
      last.current = t
      if (prev != null) {
        setOffsetMs((o) => {
          const { offsetMs: n, done } = advanceClock(o, t - prev, speed, durationMs)
          if (done) setPlaying(false)
          return n
        })
      }
      raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [playing, speed, durationMs])

  const seek = useCallback((v: number) => setOffsetMs(Math.max(0, Math.min(durationMs, v))), [durationMs])
  const play = useCallback(() => setPlaying(true), [])
  const pause = useCallback(() => setPlaying(false), [])
  return { offsetMs, playing, speed, play, pause, seek, setSpeed }
}
