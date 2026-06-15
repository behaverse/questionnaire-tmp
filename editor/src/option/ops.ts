export type InputDataType = 'choice' | 'number' | 'text'
export type MeasurementType = 'nominal' | 'ordinal' | 'interval' | 'ratio'
export type Selection = 'single' | 'multiple'

export interface PerQuestionValidation {
  format?: string
  range?: [number | null, number | null]
  length?: [number | null, number | null]
  format_message?: string
  range_message?: string
  length_message?: string
}

export interface ChoiceStructural { index: number; value: number | string | boolean | null }
export interface ChoiceContent { index: number; text: string }
export interface OptionContentEntry { status: string; label?: string; units?: string; options?: ChoiceContent[] }
export interface InlineText { content: Record<string, { status: string; text: string }> }

export interface EditableOption {
  input_data_type: InputDataType
  measurement_type: MeasurementType
  selection?: Selection
  min_selected?: number
  max_selected?: number
  min?: number
  max?: number
  step?: number
  options?: ChoiceStructural[]
  input_validation?: string | { ref: string }
  validation?: PerQuestionValidation
  placeholder?: InlineText | { ref: string }
  help?: InlineText | { ref: string }
  content: Record<string, OptionContentEntry>
  [k: string]: unknown
}

const STATUS = 'draft'
const clone = (o: EditableOption): EditableOption => structuredClone(o)

function ensureEntry(opt: EditableOption, locale: string): OptionContentEntry {
  if (!opt.content) opt.content = {}
  if (!opt.content[locale]) opt.content[locale] = { status: STATUS }
  return opt.content[locale]
}

/** Renumber choice indices 1..n on structural + align every content locale's
 *  options array (same length & positional order, index = pos+1, text preserved). */
function renumberChoices(opt: EditableOption): void {
  const structural = opt.options ?? []
  structural.forEach((row, i) => { row.index = i + 1 })
  for (const entry of Object.values(opt.content ?? {})) {
    const existing = entry.options ?? []
    entry.options = structural.map((_, i) => ({ index: i + 1, text: existing[i]?.text ?? `Option ${i + 1}` }))
  }
}

export function setInputDataType(opt: EditableOption, t: InputDataType): EditableOption {
  const next = clone(opt)
  next.input_data_type = t
  delete next.validation
  if (t === 'choice') {
    next.selection = next.selection ?? 'single'
    if (!next.options || next.options.length < 2) next.options = [{ index: 1, value: null }, { index: 2, value: null }]
    delete next.min; delete next.max; delete next.step; delete next.input_validation; delete next.placeholder
    for (const e of Object.values(next.content ?? {})) delete e.units
    renumberChoices(next)
  } else if (t === 'number') {
    delete next.selection; delete next.min_selected; delete next.max_selected; delete next.options; delete next.input_validation
    for (const e of Object.values(next.content ?? {})) delete e.options
  } else {
    delete next.selection; delete next.min_selected; delete next.max_selected; delete next.options
    delete next.min; delete next.max; delete next.step
    for (const e of Object.values(next.content ?? {})) { delete e.options; delete e.units }
  }
  return next
}

export function setMeasurementType(opt: EditableOption, m: MeasurementType): EditableOption {
  const next = clone(opt); next.measurement_type = m; return next
}

export function setSelection(opt: EditableOption, s: Selection): EditableOption {
  const next = clone(opt); next.selection = s
  if (s === 'single') { delete next.min_selected; delete next.max_selected }
  return next
}

export function setMinMaxSelected(opt: EditableOption, v: { min_selected?: number; max_selected?: number }): EditableOption {
  const next = clone(opt)
  if (v.min_selected === undefined) delete next.min_selected; else next.min_selected = v.min_selected
  if (v.max_selected === undefined) delete next.max_selected; else next.max_selected = v.max_selected
  return next
}

export function addChoice(opt: EditableOption, locale: string): EditableOption {
  const next = clone(opt)
  next.options = next.options ?? []
  next.options.push({ index: next.options.length + 1, value: null })
  ensureEntry(next, locale)
  renumberChoices(next)
  return next
}

export function removeChoice(opt: EditableOption, index: number): EditableOption {
  const next = clone(opt)
  const pos = index - 1
  if (next.options) next.options.splice(pos, 1)
  for (const e of Object.values(next.content ?? {})) if (e.options) e.options.splice(pos, 1)
  renumberChoices(next)
  return next
}

export function reorderChoice(opt: EditableOption, fromIndex: number, toIndex: number): EditableOption {
  const next = clone(opt)
  const from = fromIndex - 1, to = toIndex - 1
  if (next.options) { const [m] = next.options.splice(from, 1); next.options.splice(to, 0, m) }
  for (const e of Object.values(next.content ?? {})) if (e.options) { const [m] = e.options.splice(from, 1); e.options.splice(to, 0, m) }
  renumberChoices(next)
  return next
}

export function setChoiceValue(opt: EditableOption, index: number, value: number | string | boolean | null): EditableOption {
  const next = clone(opt)
  const row = next.options?.[index - 1]
  if (row) row.value = value
  return next
}

export function setChoiceText(opt: EditableOption, index: number, locale: string, text: string): EditableOption {
  const next = clone(opt)
  const entry = ensureEntry(next, locale)
  renumberChoices(next) // ensure this locale has an aligned options array
  const row = entry.options?.[index - 1]
  if (row) row.text = text
  return next
}

export function setLabel(opt: EditableOption, locale: string, label: string): EditableOption {
  const next = clone(opt); const e = ensureEntry(next, locale)
  if (label) e.label = label; else delete e.label
  return next
}

export function setUnits(opt: EditableOption, locale: string, units: string): EditableOption {
  const next = clone(opt); const e = ensureEntry(next, locale)
  if (units) e.units = units; else delete e.units
  return next
}

export function setBounds(opt: EditableOption, b: { min?: number; max?: number; step?: number }): EditableOption {
  const next = clone(opt)
  for (const k of ['min', 'max', 'step'] as const) {
    if (b[k] === undefined) delete next[k]; else next[k] = b[k]
  }
  return next
}

export function setInputValidation(opt: EditableOption, regex: string | undefined): EditableOption {
  const next = clone(opt)
  if (regex) next.input_validation = regex; else delete next.input_validation
  return next
}

export function setValidation(opt: EditableOption, patch: Partial<PerQuestionValidation>): EditableOption {
  const next = clone(opt)
  const v: PerQuestionValidation = { ...(next.validation ?? {}), ...patch }
  for (const k of Object.keys(v) as (keyof PerQuestionValidation)[]) {
    const val = v[k]
    if (val === undefined) { delete v[k]; continue }
    if ((k === 'range' || k === 'length') && Array.isArray(val) && val[0] === null && val[1] === null) { delete v[k]; continue }
    if (typeof val === 'string' && val === '') { delete v[k]; continue }
  }
  if (Object.keys(v).length === 0) delete next.validation
  else next.validation = v
  return next
}

function setInlineText(opt: EditableOption, field: 'placeholder' | 'help', locale: string, text: string): EditableOption {
  const next = clone(opt)
  if (!text) { delete next[field]; return next }
  const cur = next[field]
  const content = cur && typeof cur === 'object' && 'content' in cur ? (cur as InlineText).content : {}
  content[locale] = { status: STATUS, text }
  next[field] = { content }
  return next
}

export function setPlaceholderText(opt: EditableOption, locale: string, text: string): EditableOption {
  return setInlineText(opt, 'placeholder', locale, text)
}
export function setHelpText(opt: EditableOption, locale: string, text: string): EditableOption {
  return setInlineText(opt, 'help', locale, text)
}
