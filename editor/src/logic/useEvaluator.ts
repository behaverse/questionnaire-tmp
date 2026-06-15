import { useEffect, useState } from 'react'
import { loadEvaluator } from './evaluator'
import type { LogicEvaluator } from './types'

/** Loads the WASM evaluator once (module-cached promise) and returns it, or null while loading
 *  / if it fails. Consumers treat null as "no logic yet" (everything valid / visible). */
export function useEvaluator(): LogicEvaluator | null {
  const [ev, setEv] = useState<LogicEvaluator | null>(null)
  useEffect(() => {
    let ignore = false
    loadEvaluator().then((e) => { if (!ignore) setEv(e) }).catch((e) => console.warn('[editor] evaluator load failed', e))
    return () => { ignore = true }
  }, [])
  return ev
}
