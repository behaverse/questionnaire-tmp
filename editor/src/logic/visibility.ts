import type { RuntimeElement, RuntimePage } from '@behaverse/questionnaire-renderer'
import type { Bindings, LogicEvaluator, ScoreResolver } from './types'

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

/** Visible unless a valid show_if evaluates false. Malformed show_if -> shown (false-safe). */
export function isElementShown(el: unknown, ev: LogicEvaluator, bindings: Bindings): boolean {
  const expr = (el as { show_if?: unknown }).show_if
  if (typeof expr !== 'string' || expr.length === 0) return true
  if (ev.check(expr) !== null) return true // malformed -> shown
  return ev.condition(expr, bindings)
}

/** New page with hidden page-elements and hidden section children pruned. */
export function filterPageVisible(page: RuntimePage, ev: LogicEvaluator, bindings: Bindings): RuntimePage {
  const elements = page.elements
    .filter((el) => isElementShown(el, ev, bindings))
    .map((el) => (isSectionEl(el)
      ? { ...el, elements: el.elements.filter((c) => isElementShown(c, ev, bindings)) }
      : el))
  return { ...page, elements } as RuntimePage
}
