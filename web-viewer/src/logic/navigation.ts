import type { Step } from '../app/steps'
import { stepHasVisibleElement } from './visibility'
import type { Bindings, LogicEvaluator } from './types'
import type { Programs } from './compile'

export function pageFirstStepIndex(steps: Step[], pageId: string): number | null {
  const i = steps.findIndex((s) => s.pageId === pageId)
  return i < 0 ? null : i
}

/** Graph walk: apply the first forward-firing skip/branch rule, then scan to the next visible step. */
export function nextStepIndex(steps: Step[], programs: Programs, ev: LogicEvaluator, bindings: Bindings, current: number): number | null {
  let scanFrom = current + 1
  for (const r of programs.rules) {
    if ((r.type === 'skip' || r.type === 'branch') && ev.condition(r.condition, bindings)) {
      const target = pageFirstStepIndex(steps, String(r.action.skip_to ?? ''))
      if (target !== null && target > current) { scanFrom = target; break }
    }
  }
  for (let i = scanFrom; i < steps.length; i++) {
    if (stepHasVisibleElement(steps[i], programs, ev, bindings)) return i
  }
  return null
}
