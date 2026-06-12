import { stepEntries, type Step } from '../app/steps'
import type { Bindings, LogicEvaluator } from './types'
import type { Programs } from './compile'

export function isElementVisible(key: string, programs: Programs, ev: LogicEvaluator, bindings: Bindings): boolean {
  for (const r of programs.rules) {
    if (r.type === 'visibility' && r.action.target_id === key && ev.condition(r.condition, bindings)) {
      return r.action.show !== false
    }
  }
  const expr = programs.showIf.get(key)
  if (expr === undefined) return true
  return ev.condition(expr, bindings)
}

export function visibleEntries(step: Step, programs: Programs, ev: LogicEvaluator, bindings: Bindings) {
  return stepEntries(step).filter((e) => isElementVisible(e.key, programs, ev, bindings))
}
export function stepHasVisibleElement(step: Step, programs: Programs, ev: LogicEvaluator, bindings: Bindings): boolean {
  return visibleEntries(step, programs, ev, bindings).length > 0
}
