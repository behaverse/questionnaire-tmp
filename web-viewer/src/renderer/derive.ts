import type { OptionEntity } from './types'

export type WidgetKind = string

const CHOICE_M = new Set(['nominal', 'ordinal', 'interval', 'ratio'])
const NUMBER_M = new Set(['ratio', 'interval'])
const TEXT_M = new Set(['nominal', 'interval', 'ratio'])

/** design/05a_reusable_entities.md §13. Returns null for combinations the table doesn't define. */
export function deriveWidget(option: OptionEntity): WidgetKind | null {
  const { input_data_type: i, measurement_type: m, selection: s } = option
  if (i === 'choice' && CHOICE_M.has(m) && s === 'single') return `choice.${m}.single`
  if (i === 'choice' && m === 'nominal' && s === 'multiple') return 'choice.nominal.multiple'
  if (i === 'number' && NUMBER_M.has(m)) return `number.${m}`
  if (i === 'text' && TEXT_M.has(m)) return `text.${m}`
  return null
}
