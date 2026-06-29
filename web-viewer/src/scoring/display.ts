import type { Runtime } from '../renderer/types'
import type { PinnedScore } from './types'
import type { EvalValue } from '../logic/types'

export interface DisplayScore { id: string; name: string }

export type ScoreDisplay = { id: string; name: string; value: number }

/** Display-ready projection persisted at completion: named scores with a numeric value. */
export function buildScoreDisplay(runtime: Runtime, score: (id: string) => EvalValue): ScoreDisplay[] {
  const out: ScoreDisplay[] = []
  for (const d of displayScores(runtime)) {
    const v = score(d.id)
    if (typeof v === 'number' && Number.isFinite(v)) out.push({ id: d.id, name: d.name, value: v })
  }
  return out
}

/** Scores meant to be SHOWN to the participant: those carrying a non-empty `name`.
 *  (Branching-only scores omit `name`.) Soft convention — see web-viewer/FOLLOWUPS.md. Deduped by id. */
export function displayScores(runtime: Runtime): DisplayScore[] {
  const seen = new Set<string>()
  const out: DisplayScore[] = []
  for (const s of (runtime.scores ?? []) as PinnedScore[]) {
    if (s.name && s.name.trim() && !seen.has(s.id)) {
      seen.add(s.id)
      out.push({ id: s.id, name: s.name })
    }
  }
  return out
}
