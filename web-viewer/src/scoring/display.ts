import type { Runtime } from '../renderer/types'
import type { PinnedScore } from './types'

export interface DisplayScore { id: string; name: string }

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
