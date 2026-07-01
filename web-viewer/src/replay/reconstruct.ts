import type { BdmEvent } from '../app/events'

export type RecAnswer = { optionIndex?: number; numeric?: number; description?: string }
export type ReplayState = { elementKey: string | null; answers: Record<string, RecAnswer> }
export type TimelineEvent = { absMs: number; verb: string; elementKey: string | null }
export type Timeline = {
  startMs: number
  endMs: number
  durationMs: number
  events: TimelineEvent[]
  stateAt(absMs: number): ReplayState
}

const TRIAL_PREFIX = 'trial_'
type Internal = TimelineEvent & { ext: Record<string, unknown> }

function keyOf(e: BdmEvent): string | null {
  const id = e.object?.id
  return typeof id === 'string' && id.startsWith(TRIAL_PREFIX) ? id.slice(TRIAL_PREFIX.length) : null
}

export function reconstruct(statements: BdmEvent[]): Timeline {
  const rows: Internal[] = statements
    .map((s) => ({ absMs: Date.parse(s.timestamp), verb: s.verb, elementKey: keyOf(s), ext: (s.result?.extensions ?? {}) as Record<string, unknown> }))
    .sort((a, b) => a.absMs - b.absMs)
  const startMs = rows.length ? rows[0]!.absMs : 0
  const endMs = rows.length ? rows[rows.length - 1]!.absMs : 0
  const events: TimelineEvent[] = rows.map((r) => ({ absMs: r.absMs, verb: r.verb, elementKey: r.elementKey }))

  function stateAt(absMs: number): ReplayState {
    let elementKey: string | null = null
    const answers: Record<string, RecAnswer> = {}
    for (const r of rows) {
      if (r.absMs > absMs) break
      if (r.verb === 'bdm:trial_started' && r.elementKey) elementKey = r.elementKey
      if (r.verb === 'bdm:trial_ended' && r.elementKey) {
        const a: RecAnswer = {}
        const oi = r.ext['bdm:response_option_index']
        const n = r.ext['bdm:response_numeric']
        const d = r.ext['bdm:response_description']
        if (typeof oi === 'number') a.optionIndex = oi
        if (typeof n === 'number') a.numeric = n
        if (typeof d === 'string') a.description = d
        answers[r.elementKey] = a
      }
    }
    return { elementKey, answers }
  }

  return { startMs, endMs, durationMs: endMs - startMs, events, stateAt }
}
