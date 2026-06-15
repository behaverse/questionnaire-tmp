import type { RuntimePage } from '@behaverse/questionnaire-renderer'
import type { Bindings, LogicEvaluator } from './types'
import type { LogicRule } from '../model/types'

/** Port of web-viewer `pipedText`: the text to render for `fieldPath`, applying the first
 *  firing piping rule. The `ev.check` guard is the editor's addition (it doesn't pre-compile
 *  rules) — a malformed condition is skipped (false-safe to original). */
export function pipedText(fieldPath: string, original: string, rules: LogicRule[], ev: LogicEvaluator, bindings: Bindings): string {
  for (const r of rules) {
    if (r.type !== 'piping') continue
    const a = r.action as { field_path?: unknown; source?: unknown }
    if (a.field_path !== fieldPath) continue
    const cond = r.condition
    if (typeof cond !== 'string' || cond.length === 0 || ev.check(cond) !== null) continue
    if (!ev.condition(cond, bindings)) continue
    const v = bindings.var(String(a.source ?? ''))
    if (v === null || v === undefined) return original
    return Array.isArray(v) ? v.join(', ') : String(v)
  }
  return original
}

/** New page with each top-level item's `question.prompt.content[locale].text` rewritten by a
 *  firing piping rule. `i` is the element position in the page passed in — call on the FULL
 *  (unfiltered) page so `i` matches the authored `field_path` index. Mirrors the viewer App. */
export function applyPiping(page: RuntimePage, rules: LogicRule[], ev: LogicEvaluator, bindings: Bindings, locale: string): RuntimePage {
  const elements = page.elements.map((el, i) => {
    const q = (el as { question?: { prompt?: { content?: Record<string, { text?: unknown }> } } }).question
    const content = q?.prompt?.content
    const orig = content?.[locale]?.text
    if (typeof orig !== 'string') return el
    const piped = pipedText(`pages.${page.id}.elements.${i}.prompt`, orig, rules, ev, bindings)
    if (piped === orig) return el
    return {
      ...(el as object),
      question: { ...q, prompt: { ...q!.prompt, content: { ...content, [locale]: { ...content![locale], text: piped } } } },
    }
  })
  return { ...page, elements } as RuntimePage
}
