// editor/src/export/surveyjs.ts
import type { Runtime } from '@behaverse/questionnaire-renderer'
import type { Questionnaire, Score, LogicRule } from '../model/types'
import { itemView, flattenElements, type ItemView } from './walk'

const OP_MAP: Record<string, string> = { '==': '=', '!=': '<>', '<': '<', '<=': '<=', '>': '>', '>=': '>=' }
// identifier <op> literal(number | 'quoted' | bareword)
const SIMPLE = /^\s*([A-Za-z_]\w*)\s*(==|!=|<=|>=|<|>)\s*('[^']*'|-?\d+(?:\.\d+)?|[A-Za-z_]\w*)\s*$/

/** Returns { visibleIf?, visible?, dropped? }. `dropped` set means the condition could not be translated. */
function translateShowIf(expr: string | undefined): { visibleIf?: string; visible?: boolean; dropped?: boolean } {
  const e = (expr ?? '').trim()
  if (e === '' || e === 'true') return {}
  if (e === 'false') return { visible: false }
  const m = SIMPLE.exec(e)
  if (!m) return { dropped: true }
  const [, id, op, lit] = m
  return { visibleIf: `{${id}} ${OP_MAP[op]} ${lit}` }
}

function questionFor(v: ItemView, dropped: string[], n: number): Record<string, unknown> | null {
  const base: Record<string, unknown> = { name: v.id, title: v.prompt }
  if (v.required) base.isRequired = true

  if (v.choicesError) dropped.push(`Question ${n} ("${v.prompt}"): no choice texts in this language`)
  const choices = v.choices.map((c) => ({ value: c.value, text: c.text }))

  const w = v.widget
  if (w === 'choice.nominal.single') { base.type = 'radiogroup'; base.choices = choices }
  else if (w && /^choice\.(ordinal|interval|ratio)\.single$/.test(w)) { base.type = 'rating'; base.rateValues = choices }
  else if (w === 'choice.nominal.multiple') { base.type = 'checkbox'; base.choices = choices }
  else if (w && w.startsWith('number')) {
    base.type = 'text'; base.inputType = 'number'
    const validators: Record<string, unknown>[] = []
    if (v.option.min != null || v.option.max != null) {
      const val: Record<string, unknown> = { type: 'numeric' }
      if (v.option.min != null) val.minValue = v.option.min
      if (v.option.max != null) val.maxValue = v.option.max
      validators.push(val)
    }
    if (validators.length) base.validators = validators
  }
  else if (w && w.startsWith('text')) { base.type = 'text' }
  else { dropped.push(`Question ${n} ("${v.prompt}"): input type not supported by SurveyJS`); return null }

  const t = translateShowIf(v.show_if)
  if (t.dropped) dropped.push(`Question ${n} ("${v.id}"): visibility rule (show_if) too complex to translate`)
  else if (t.visibleIf) base.visibleIf = t.visibleIf
  else if (t.visible === false) base.visible = false

  return base
}

export function toSurveyJS(runtime: Runtime, model: Questionnaire, locale: string): { json: Record<string, unknown>; dropped: string[] } {
  const dropped: string[] = []
  const pages: Record<string, unknown>[] = []
  let n = 0

  for (const [i, page] of runtime.pages.entries()) {
    const elements: Record<string, unknown>[] = []
    for (const entry of flattenElements(page.elements)) {
      if (entry.message) continue // SurveyJS html could carry these; omitted by design (review export)
      if (!entry.item) continue
      n += 1
      const q = questionFor(itemView(entry.item, locale, `q${n}`), dropped, n)
      if (q) elements.push(q)
    }
    pages.push({ name: page.id || `page${i + 1}`, ...(page.title ? { title: page.title } : {}), elements })
  }

  const json: Record<string, unknown> = {
    title: runtime.metadata.title || model.metadata.id,
    ...(runtime.metadata.description ? { description: runtime.metadata.description } : {}),
    pages,
  }

  for (const s of (model.scores ?? []) as Score[]) dropped.push(`Scoring "${s.name ?? s.id}" (no SurveyJS equivalent)`)
  for (const r of (model.logic ?? []) as LogicRule[]) dropped.push(`Logic rule (${r.type}) — not exported`)

  return { json, dropped }
}
