import type { Bindings, LogicEvaluator } from './types'
import type { Programs } from './compile'

/** Return the text to render for a field identified by `field`, applying any firing piping rule. */
export function pipedText(field: string, original: string, programs: Programs, ev: LogicEvaluator, bindings: Bindings): string {
  for (const r of programs.rules) {
    if (r.type !== 'piping') continue
    if (r.action.field_path !== field) continue
    if (!ev.condition(r.condition, bindings)) continue
    const v = bindings.var(String(r.action.source ?? ''))
    if (v === null || v === undefined) return original
    return Array.isArray(v) ? v.join(', ') : String(v)
  }
  return original
}
