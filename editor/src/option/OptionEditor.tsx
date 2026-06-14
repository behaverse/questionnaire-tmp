import { ChoiceRows } from './ChoiceRows'
import { widgetLabel } from './widget'
import {
  setInputDataType, setMeasurementType, setSelection, setBounds, setLabel, setUnits,
  setInputValidation, setPlaceholderText, setHelpText,
  type EditableOption, type InputDataType, type MeasurementType,
} from './ops'

const INPUT_TYPES: InputDataType[] = ['choice', 'number', 'text']
const MEASURES: MeasurementType[] = ['nominal', 'ordinal', 'interval', 'ratio']

function inlineText(v: EditableOption['placeholder'], locale: string): string {
  if (v && typeof v === 'object' && 'content' in v) return v.content[locale]?.text ?? ''
  return ''
}

export function OptionEditor({ option, locale, onChange }: { option: EditableOption; locale: string; onChange: (o: EditableOption) => void }) {
  const c = option.content?.[locale]
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <label className="text-sm">Response type
          <select aria-label="Response type" value={option.input_data_type}
                  onChange={(e) => onChange(setInputDataType(option, e.target.value as InputDataType))}
                  className="ml-1 rounded border border-slate-300 px-1 py-0.5">
            {INPUT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>
        <label className="text-sm">Measurement
          <select aria-label="Measurement type" value={option.measurement_type}
                  onChange={(e) => onChange(setMeasurementType(option, e.target.value as MeasurementType))}
                  className="ml-1 rounded border border-slate-300 px-1 py-0.5">
            {MEASURES.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </label>
        {option.input_data_type === 'choice' && (
          <label className="text-sm">Selection
            <select aria-label="Selection" value={option.selection ?? 'single'}
                    onChange={(e) => onChange(setSelection(option, e.target.value as 'single' | 'multiple'))}
                    className="ml-1 rounded border border-slate-300 px-1 py-0.5">
              <option value="single">single</option><option value="multiple">multiple</option>
            </select>
          </label>
        )}
        <span className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-600">Renders as: <strong>{widgetLabel(option)}</strong></span>
      </div>

      <label className="block text-sm">Label ({locale})
        <input value={c?.label ?? ''} onChange={(e) => onChange(setLabel(option, locale, e.target.value))}
               className="mt-1 w-full rounded border border-slate-300 px-2 py-1" aria-label={`Label ${locale}`} />
      </label>

      {option.input_data_type === 'choice' && <ChoiceRows option={option} locale={locale} onChange={onChange} />}

      {option.input_data_type === 'number' && (
        <div className="flex flex-wrap gap-3">
          {(['min', 'max', 'step'] as const).map((k) => (
            <label key={k} className="text-sm">{k}
              <input type="number" aria-label={k} defaultValue={option[k] === undefined ? '' : String(option[k])}
                     onChange={(e) => onChange(setBounds(option, { ...{ min: option.min, max: option.max, step: option.step }, [k]: e.target.value === '' ? undefined : Number(e.target.value) }))}
                     className="ml-1 w-20 rounded border border-slate-300 px-1 py-0.5" />
            </label>
          ))}
          <label className="text-sm">Units ({locale})
            <input value={c?.units ?? ''} onChange={(e) => onChange(setUnits(option, locale, e.target.value))}
                   className="ml-1 rounded border border-slate-300 px-1 py-0.5" aria-label={`Units ${locale}`} />
          </label>
        </div>
      )}

      {option.input_data_type === 'text' && (
        <label className="block text-sm">Validation regex
          <input value={typeof option.input_validation === 'string' ? option.input_validation : ''}
                 onChange={(e) => onChange(setInputValidation(option, e.target.value || undefined))}
                 className="mt-1 w-full rounded border border-slate-300 px-2 py-1 font-mono text-xs" aria-label="Validation regex" />
        </label>
      )}

      {option.input_data_type !== 'choice' && (
        <label className="block text-sm">Placeholder ({locale})
          <input value={inlineText(option.placeholder, locale)} onChange={(e) => onChange(setPlaceholderText(option, locale, e.target.value))}
                 className="mt-1 w-full rounded border border-slate-300 px-2 py-1" aria-label={`Placeholder ${locale}`} />
        </label>
      )}

      <label className="block text-sm">Help ({locale})
        <input value={inlineText(option.help, locale)} onChange={(e) => onChange(setHelpText(option, locale, e.target.value))}
               className="mt-1 w-full rounded border border-slate-300 px-2 py-1" aria-label={`Help ${locale}`} />
      </label>
    </div>
  )
}
