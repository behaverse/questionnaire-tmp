import { deriveWidget } from '@behaverse/questionnaire-renderer'
import type { EditableOption } from './ops'

export function widgetLabel(option: EditableOption): string {
  const w = deriveWidget(option as never)
  if (!w) return 'Unsupported'
  if (w === 'choice.nominal.multiple') return 'Checkbox'
  if (w.startsWith('choice.')) return 'Radio'
  if (w.startsWith('number.')) return 'Number input'
  if (w.startsWith('text.')) return 'Text input'
  return 'Unsupported'
}
