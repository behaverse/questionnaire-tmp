import type { RuntimeElement, RuntimePage } from '@behaverse/questionnaire-renderer'
import type { Bindings, LogicEvaluator, ScoreResolver } from './types'
import type { LogicRule } from '../model/types'

/** Answers-first bindings with a score fall-through (port of web-viewer makeBindings). */
export function makeBindings(answers: Record<string, unknown>, resolver: ScoreResolver): Bindings {
  return {
    var(id) {
      if (id in answers) return answers[id]
      const s = resolver.score(id)
      return s ?? null
    },
    score: (id) => resolver.score(id) ?? null,
  }
}

function isSectionEl(el: unknown): el is { elements: RuntimeElement[] } {
  return !!el && typeof el === 'object' && Array.isArray((el as { elements?: unknown }).elements)
}

/** Viewer precedence: a matching valid `visibility` rule whose condition holds decides
 *  (`show`), else the element's `show_if`, else visible. Malformed conditions are skipped
 *  (false-safe to shown), matching the web-viewer + ED-D1. */
export function isElementShown(el: unknown, ev: LogicEvaluator, bindings: Bindings, rules: LogicRule[] = []): boolean {
  const id = (el as { id?: unknown }).id
  if (typeof id === 'string') {
    for (const r of rules) {
      if (r.type !== 'visibility') continue
      if ((r.action as { target_id?: unknown }).target_id !== id) continue
      const cond = r.condition
      if (typeof cond === 'string' && cond.length > 0 && ev.check(cond) === null && ev.condition(cond, bindings)) {
        return (r.action as { show?: unknown }).show !== false
      }
    }
  }
  const expr = (el as { show_if?: unknown }).show_if
  if (typeof expr !== 'string' || expr.length === 0) return true
  if (ev.check(expr) !== null) return true // malformed -> shown
  return ev.condition(expr, bindings)
}

/** New page with hidden page-elements and hidden section children pruned. */
export function filterPageVisible(page: RuntimePage, ev: LogicEvaluator, bindings: Bindings, rules: LogicRule[] = []): RuntimePage {
  const elements = page.elements
    .filter((el) => isElementShown(el, ev, bindings, rules))
    .map((el) => (isSectionEl(el)
      ? { ...el, elements: el.elements.filter((c) => isElementShown(c, ev, bindings, rules)) }
      : el))
  return { ...page, elements } as RuntimePage
}
