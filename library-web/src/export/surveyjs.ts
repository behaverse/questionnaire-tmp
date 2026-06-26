import type { RenderModel, ItemBlock, SectionBlock } from '../definition/renderModel'
import type { ScoreDecl } from '../api/types'

const OP_MAP: Record<string, string> = { '==': '=', '!=': '<>', '<': '<', '<=': '<=', '>': '>', '>=': '>=' }
const SIMPLE = /^\s*([A-Za-z_]\w*)\s*(==|!=|<=|>=|<|>)\s*('[^']*'|-?\d+(?:\.\d+)?|[A-Za-z_]\w*)\s*$/

function translateShowIf(expr: string | undefined): { visibleIf?: string; visible?: boolean; dropped?: boolean } {
  const e = (expr ?? '').trim()
  if (e === '' || e === 'true') return {}
  if (e === 'false') return { visible: false }
  const m = SIMPLE.exec(e)
  if (!m) return { dropped: true }
  const [, id, op, lit] = m
  return { visibleIf: `{${id}} ${OP_MAP[op]} ${lit}` }
}

function questionFor(item: ItemBlock, dropped: string[]): Record<string, unknown> | null {
  const name = `q${item.number}`
  const base: Record<string, unknown> = { name, title: item.stem }
  if (item.required) base.isRequired = true
  const choices = item.options.map((o) => ({ value: o.value ?? o.index, text: o.text }))
  const w = item.widget

  if (w === 'choice.nominal.single') {
    if (choices.length === 0) { dropped.push(`Question ${item.number} ("${name}"): no choices in this language`); return null }
    base.type = 'radiogroup'; base.choices = choices
  } else if (w && /^choice\.(ordinal|interval|ratio)\.single$/.test(w)) {
    if (choices.length === 0) { dropped.push(`Question ${item.number} ("${name}"): no choices in this language`); return null }
    base.type = 'rating'; base.rateValues = choices
  } else if (w === 'choice.nominal.multiple') {
    if (choices.length === 0) { dropped.push(`Question ${item.number} ("${name}"): no choices in this language`); return null }
    base.type = 'checkbox'; base.choices = choices
  } else if (w && w.startsWith('number')) {
    base.type = 'text'; base.inputType = 'number'
  } else if (w && w.startsWith('text')) {
    base.type = 'text'
  } else {
    dropped.push(`Question ${item.number} ("${name}"): input type not supported by SurveyJS`); return null
  }

  const t = translateShowIf(item.showIf)
  if (t.dropped) dropped.push(`Question ${item.number} ("${name}"): visibility rule (show_if) too complex to translate`)
  else if (t.visibleIf) base.visibleIf = t.visibleIf
  else if (t.visible === false) base.visible = false

  return base
}

export function toSurveyJS(model: RenderModel, scores: ScoreDecl[]): { json: Record<string, unknown>; dropped: string[] } {
  const dropped: string[] = []
  const pages: Record<string, unknown>[] = []

  for (const [i, page] of model.pages.entries()) {
    const elements: Record<string, unknown>[] = []
    for (const block of page.blocks) {
      if (block.kind === 'message') continue
      if (block.kind === 'section') {
        for (const it of (block as SectionBlock).items) {
          const q = questionFor(it, dropped); if (q) elements.push(q)
        }
      } else {
        const q = questionFor(block as ItemBlock, dropped); if (q) elements.push(q)
      }
    }
    pages.push({ name: page.id || `page${i + 1}`, ...(page.title ? { title: page.title } : {}), elements })
  }

  for (const s of scores) dropped.push(`Scoring "${s.name ?? s.id}" (no SurveyJS equivalent)`)

  return { json: { pages }, dropped }
}
