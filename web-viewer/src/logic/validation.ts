import { isItem } from '../renderer/guards'
import type { AnswerValue, Runtime } from '../renderer/types'
import type { Step } from '../app/steps'
import { makeBindings } from './bindings'
import type { Bindings, LogicEvaluator, ScoreResolver } from './types'
import type { Programs } from './compile'

export type ValidationError = { key: string; message: string }

function perQuestion(key: string, v: Record<string, unknown>, value: AnswerValue): ValidationError | null {
  if (value === null || value === undefined || value === '') return null
  const range = v.range as [number | null, number | null] | undefined
  if (range && typeof value === 'number') {
    const [lo, hi] = range
    if ((lo !== null && value < lo) || (hi !== null && value > hi)) return { key, message: String(v.range_message ?? 'Value out of range.') }
  }
  const length = v.length as [number | null, number | null] | undefined
  if (length && typeof value === 'string') {
    const [lo, hi] = length
    if ((lo !== null && value.length < lo) || (hi !== null && value.length > hi)) return { key, message: String(v.length_message ?? 'Invalid length.') }
  }
  const fmt = v.format as string | undefined
  if (fmt && typeof value === 'string') {
    let ok = false
    try { ok = new RegExp(fmt).test(value) } catch { ok = true }
    if (!ok) return { key, message: String(v.format_message ?? 'Invalid format.') }
  }
  return null
}

export function validateStep(
  step: Step, programs: Programs, ev: LogicEvaluator,
  answers: Record<string, AnswerValue>, score: ScoreResolver['score'], _locale: string,
): ValidationError[] {
  const errors: ValidationError[] = []
  const visit = (key: string, el: unknown) => {
    if (isItem(el as never)) {
      const v = (el as { validation?: Record<string, unknown> }).validation
      if (v) { const e = perQuestion(key, v, answers[key] ?? null); if (e) errors.push(e) }
    }
  }
  step.elements.forEach(({ key, element }) => {
    visit(key, element)
    const sub = (element as { elements?: unknown[] }).elements
    if (Array.isArray(sub)) sub.forEach((c, j) => visit(`${key}__r${j}`, c))
  })
  const bindings: Bindings = makeBindings(answers, { pages: [] } as unknown as Runtime, { score })
  for (const cv of programs.crossValidation) {
    if (ev.condition(cv.condition, bindings)) for (const t of cv.targets) errors.push({ key: t, message: cv.message })
  }
  return errors
}
