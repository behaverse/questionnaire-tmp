import type { MouseSample } from '../app/mouseCapture'
import type { BdmEvent } from '../app/events'

export function findRecordingStartMs(statements: BdmEvent[]): number | null {
  const s = statements.find((e) => e.verb === 'bdm:recording_started')
  return s ? Date.parse(s.timestamp) : null
}

export function buildCursor(mouse: MouseSample[], recordingStartMs: number): (absMs: number) => { x: number; y: number } | null {
  if (!mouse.length) return () => null
  const pts = mouse.map((m) => ({ absMs: recordingStartMs + m.t * 1000, x: m.x, y: m.y }))
  const first = pts[0]!
  const last = pts[pts.length - 1]!
  return (absMs: number) => {
    if (absMs < first.absMs || absMs > last.absMs) return null
    let i = 0
    while (i < pts.length - 1 && pts[i + 1]!.absMs <= absMs) i++
    const a = pts[i]!
    const b = pts[Math.min(i + 1, pts.length - 1)]!
    if (b.absMs === a.absMs) return { x: a.x, y: a.y }
    const f = (absMs - a.absMs) / (b.absMs - a.absMs)
    return { x: Math.round(a.x + (b.x - a.x) * f), y: Math.round(a.y + (b.y - a.y) * f) }
  }
}
