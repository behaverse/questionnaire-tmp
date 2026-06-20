import { useEffect, useMemo, useState } from 'react'
import { compileScorers, makeScoreCache, type ScoreCache } from '@behaverse/questionnaire-scorer'
import type { Runtime } from '@behaverse/questionnaire-renderer'

/** Compile the runtime's bundled scorers (async) and return a ScoreCache, recompiling when
 *  the scores set changes. Returns null until ready / when there are no runnable scorers. */
export function useScoreCache(runtime: Runtime, fetchImpl: typeof fetch = fetch): ScoreCache | null {
  const [cache, setCache] = useState<ScoreCache | null>(null)
  const scoresKey = useMemo(() => JSON.stringify(runtime.scores ?? []), [runtime.scores])

  useEffect(() => {
    let alive = true
    setCache(null)
    if (!(runtime.scores && runtime.scores.length)) return
    void compileScorers(runtime, fetchImpl).then((set) => {
      if (alive) setCache(set.compiled.size ? makeScoreCache(set, runtime) : null)
    })
    return () => { alive = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scoresKey, fetchImpl])

  return cache
}
