import { deriveWidget } from '../renderer/derive'
import { isItem, isSection } from '../renderer/guards'
import { elementKey, pageElementFallback, sectionChildFallback } from '../renderer/keys'
import type { AnswerValue, Runtime, RuntimeElement } from '../renderer/types'

export type StepElement = { key: string; element: RuntimeElement }
export type Step = { pageId: string; elements: StepElement[] }
export type PresentationMode = 'focus' | 'classic'

export function presentationMode(runtime: Runtime): PresentationMode {
  return runtime.style?.x_presentation === 'classic' ? 'classic' : 'focus'
}

export function flattenSteps(runtime: Runtime): Step[] {
  const mode = presentationMode(runtime)
  if (mode === 'classic') {
    return runtime.pages.map((p) => ({
      pageId: p.id,
      elements: p.elements.map((el, i) => ({ key: elementKey(el, pageElementFallback(p.id, i)), element: el })),
    }))
  }
  return runtime.pages.flatMap((p) =>
    p.elements.map((el, i) => ({
      pageId: p.id,
      elements: [{ key: elementKey(el, pageElementFallback(p.id, i)), element: el }],
    })),
  )
}

function answered(v: AnswerValue | undefined): boolean {
  if (v === undefined || v === null || v === '') return false
  return !(Array.isArray(v) && v.length === 0)
}

export function requiredUnanswered(step: Step, answers: Record<string, AnswerValue>): string[] {
  const missing: string[] = []
  const visit = (el: RuntimeElement, key: string, depth: number) => {
    if (isSection(el) && depth === 0) {
      el.elements.forEach((c, j) => visit(c, elementKey(c, sectionChildFallback(key, j)), depth + 1))
    } else if (isItem(el) && el.required && deriveWidget(el.option) !== null && !answered(answers[key])) {
      missing.push(key)
    }
  }
  for (const { key, element } of step.elements) visit(element, key, 0)
  return missing
}

export function isSingleChoiceItem(step: Step): boolean {
  if (step.elements.length !== 1) return false
  const el = step.elements[0].element
  return isItem(el) && (deriveWidget(el.option)?.endsWith('.single') ?? false)
}
