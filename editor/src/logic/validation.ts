import { elementKey, pageElementFallback, sectionChildFallback } from '@behaverse/questionnaire-renderer'
import type { RuntimeElement, RuntimePage, AnswerValue } from '@behaverse/questionnaire-renderer'
import type { Bindings, LogicEvaluator } from './types'
import type { CrossQuestionValidationRule } from '../model/types'

export type ValidationError = { key: string; message: string }

/** Port of web-viewer `perQuestion`: empty value → no error; numeric range, string length,
 *  string format (unanchored; invalid regex passes). Display-only, non-blocking. */
export function perQuestion(key: string, v: Record<string, unknown>, value: unknown): ValidationError | null {
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

/** The per-question validation object on a runtime element. The editor's projected runtime
 *  keeps `option` nested (renderer reads `el.option`), so validation lives at `el.option.validation`;
 *  fall back to `el.validation` for parity with the viewer's denormalised runtime. */
function validationOf(el: unknown): Record<string, unknown> | undefined {
  const optVal = (el as { option?: { validation?: unknown } }).option?.validation
  if (optVal && typeof optVal === 'object') return optVal as Record<string, unknown>
  const elVal = (el as { validation?: unknown }).validation
  return elVal && typeof elVal === 'object' ? (elVal as Record<string, unknown>) : undefined
}

/** Cross-question validation errors: for each rule whose condition is valid + true, push the
 *  message onto each target. Mirrors the viewer's cross-question loop; the `ev.check` guard is
 *  the editor's malformed-safe addition. */
export function collectCrossQuestionErrors(rules: CrossQuestionValidationRule[], ev: LogicEvaluator, bindings: Bindings): ValidationError[] {
  const errors: ValidationError[] = []
  for (const rule of rules) {
    const c = rule.condition
    if (typeof c !== 'string' || c.length === 0 || ev.check(c) !== null) continue
    if (!ev.condition(c, bindings)) continue
    for (const t of rule.targets ?? []) errors.push({ key: t, message: rule.message })
  }
  return errors
}

/** Per-question validation errors over the given pages, keyed exactly as the renderer keys
 *  elements (page-level `elementKey`; section children `${parentKey}__r${j}`). */
export function collectPerQuestionErrors(pages: RuntimePage[], answers: Record<string, AnswerValue>): ValidationError[] {
  const errors: ValidationError[] = []
  for (const page of pages) {
    page.elements.forEach((el, i) => {
      const key = elementKey(el, pageElementFallback(page.id, i))
      const v = validationOf(el)
      if (v) { const e = perQuestion(key, v, answers[key]); if (e) errors.push(e) }
      const children = (el as { elements?: RuntimeElement[] }).elements
      if (Array.isArray(children)) {
        children.forEach((c, j) => {
          const ck = elementKey(c, sectionChildFallback(key, j))
          const cv = validationOf(c)
          if (cv) { const e = perQuestion(ck, cv, answers[ck]); if (e) errors.push(e) }
        })
      }
    })
  }
  return errors
}
