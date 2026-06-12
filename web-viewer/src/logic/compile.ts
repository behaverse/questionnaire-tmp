import { isSection } from '../renderer/guards'
import { elementKey, pageElementFallback, sectionChildFallback } from '../renderer/keys'
import type { Runtime, RuntimeElement } from '../renderer/types'
import type { LogicEvaluator } from './types'

export type CompiledRule = { id: string; type: 'skip' | 'visibility' | 'piping' | 'branch'; condition: string; action: Record<string, unknown> }
export type CompiledValidation = { id: string; condition: string; message: string; targets: string[] }
export type Programs = {
  showIf: Map<string, string>
  rules: CompiledRule[]
  crossValidation: CompiledValidation[]
}

function walkElements(runtime: Runtime, visit: (key: string, el: RuntimeElement) => void) {
  runtime.pages.forEach((page) =>
    page.elements.forEach((el, i) => {
      const key = elementKey(el, pageElementFallback(page.id, i))
      visit(key, el)
      if (isSection(el)) el.elements.forEach((c, j) => visit(elementKey(c, sectionChildFallback(key, j)), c))
    }),
  )
}

export function collectPrograms(runtime: Runtime, ev: LogicEvaluator): Programs {
  const showIf = new Map<string, string>()
  walkElements(runtime, (key, el) => {
    const expr = (el as { show_if?: unknown }).show_if
    if (typeof expr === 'string' && expr.length > 0) {
      if (ev.check(expr) === null) showIf.set(key, expr)
      else console.warn(`web-viewer: dropping malformed show_if on ${key}: ${expr}`)
    }
  })
  const rules: CompiledRule[] = []
  for (const r of (runtime.logic ?? []) as CompiledRule[]) {
    if (ev.check(r.condition) === null) rules.push(r)
    else console.warn(`web-viewer: dropping malformed logic rule ${r.id}`)
  }
  const crossValidation: CompiledValidation[] = []
  for (const v of ((runtime as { validation?: CompiledValidation[] }).validation ?? [])) {
    if (ev.check(v.condition) === null) crossValidation.push(v)
    else console.warn(`web-viewer: dropping malformed validation ${v.id}`)
  }
  return { showIf, rules, crossValidation }
}
