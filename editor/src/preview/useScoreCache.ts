import { useEffect, useMemo, useState } from 'react'
import { compileScorers, makeScoreCache, type ScorerSet, type ScoreCache } from '@behaverse/questionnaire-scorer'
import type { Runtime } from '@behaverse/questionnaire-renderer'

/** Compile the runtime's bundled scorers (async, recompiled only when the scores set changes) and
 *  return a ScoreCache. The cache's score-input index is rebuilt whenever the runtime *structure*
 *  changes — cheap, no wasm recompile — so live edits / late-resolved answers map correctly (in the
 *  editor the runtime is live, unlike the viewer where it is static). Returns null until the wasm is
 *  ready / when there are no runnable scorers. */
export function useScoreCache(runtime: Runtime, fetchImpl: typeof fetch = fetch): ScoreCache | null {
  const [set, setSet] = useState<ScorerSet | null>(null)
  const scoresKey = useMemo(() => JSON.stringify(runtime.scores ?? []), [runtime.scores])
  // structure of the items the score-input index is derived from (answer-key → prompt-id mapping)
  const structureKey = useMemo(() => JSON.stringify(runtime.pages ?? []), [runtime.pages])

  useEffect(() => {
    let alive = true
    setSet(null)
    if (!(runtime.scores && runtime.scores.length)) return
    void compileScorers(runtime, fetchImpl).then((s) => {
      if (alive) setSet(s.compiled.size ? s : null)
    })
    return () => { alive = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scoresKey, fetchImpl])

  // Rebuild the cache (index + resolver) when the compiled set OR the runtime structure changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => (set ? makeScoreCache(set, runtime) : null), [set, structureKey])
}
