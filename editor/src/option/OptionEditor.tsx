import { ChoiceRows } from './ChoiceRows'
import { widgetLabel } from './widget'
import {
  setInputDataType, setMeasurementType, setSelection, setMinMaxSelected, setBounds, setLabel, setUnits,
  setInputValidation, setPlaceholderText, setHelpText, setValidation, setStatus,
  type EditableOption, type InputDataType, type MeasurementType,
} from './ops'

const INPUT_TYPES: InputDataType[] = ['choice', 'number', 'text']
const MEASURES: MeasurementType[] = ['nominal', 'ordinal', 'interval', 'ratio']

function inlineText(v: EditableOption['placeholder'], locale: string): string {
  if (v && typeof v === 'object' && 'content' in v) return v.content[locale]?.text ?? ''
  return ''
}

export function OptionEditor({ option, locale, showStatus = true, onChange }: { option: EditableOption; locale: string; showStatus?: boolean; onChange: (o: EditableOption) => void }) {
  const c = option.content?.[locale]
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <label className="text-sm">Response type
          <select aria-label="Response type" value={option.input_data_type}
                  onChange={(e) => onChange(setInputDataType(option, e.target.value as InputDataType))}
                  className="ml-1 rounded border border-ed-border px-1 py-0.5">
            {INPUT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>
        <label className="text-sm">Measurement
          <select aria-label="Measurement type" value={option.measurement_type}
                  onChange={(e) => onChange(setMeasurementType(option, e.target.value as MeasurementType))}
                  className="ml-1 rounded border border-ed-border px-1 py-0.5">
            {MEASURES.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </label>
        {option.input_data_type === 'choice' && (
          <label className="text-sm">Selection
            <select aria-label="Selection" value={option.selection ?? 'single'}
                    onChange={(e) => onChange(setSelection(option, e.target.value as 'single' | 'multiple'))}
                    className="ml-1 rounded border border-ed-border px-1 py-0.5">
              <option value="single">single</option><option value="multiple">multiple</option>
            </select>
          </label>
        )}
        {option.input_data_type === 'choice' && option.selection === 'multiple' && (
          <>
            <label className="text-sm">Min selected
              <input type="number" aria-label="Min selected" min={0}
                     value={option.min_selected === undefined ? '' : String(option.min_selected)}
                     onChange={(e) => onChange(setMinMaxSelected(option, { min_selected: e.target.value === '' ? undefined : Number(e.target.value), max_selected: option.max_selected }))}
                     className="ml-1 w-16 rounded border border-ed-border px-1 py-0.5" />
            </label>
            <label className="text-sm">Max selected
              <input type="number" aria-label="Max selected" min={1}
                     value={option.max_selected === undefined ? '' : String(option.max_selected)}
                     onChange={(e) => onChange(setMinMaxSelected(option, { min_selected: option.min_selected, max_selected: e.target.value === '' ? undefined : Number(e.target.value) }))}
                     className="ml-1 w-16 rounded border border-ed-border px-1 py-0.5" />
            </label>
          </>
        )}
        <span className="rounded bg-ed-subtle px-2 py-1 text-xs text-ed-muted">Renders as: <strong>{widgetLabel(option)}</strong></span>
      </div>

      <label className="block text-sm">Label ({locale})
        <input value={c?.label ?? ''} onChange={(e) => onChange(setLabel(option, locale, e.target.value))}
               className="mt-1 w-full rounded border border-ed-border px-2 py-1" aria-label={`Label ${locale}`} />
      </label>

      {showStatus && (
        <label className="text-xs text-ed-muted">Status
          <select aria-label="Option status" value={c?.status ?? 'draft'} onChange={(e) => onChange(setStatus(option, locale, e.target.value))}
                  className="ml-1 rounded border border-ed-border px-1 py-0.5">
            {['draft', 'complete', 'validated'].map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
      )}

      {option.input_data_type === 'choice' && <ChoiceRows option={option} locale={locale} onChange={onChange} />}

      {option.input_data_type === 'number' && (
        <div className="flex flex-wrap gap-3">
          {(['min', 'max', 'step'] as const).map((k) => (
            <label key={k} className="text-sm">{k}
              <input type="number" aria-label={k} defaultValue={option[k] === undefined ? '' : String(option[k])}
                     onChange={(e) => onChange(setBounds(option, { ...{ min: option.min, max: option.max, step: option.step }, [k]: e.target.value === '' ? undefined : Number(e.target.value) }))}
                     className="ml-1 w-20 rounded border border-ed-border px-1 py-0.5" />
            </label>
          ))}
          <label className="text-sm">Units ({locale})
            <input value={c?.units ?? ''} onChange={(e) => onChange(setUnits(option, locale, e.target.value))}
                   className="ml-1 rounded border border-ed-border px-1 py-0.5" aria-label={`Units ${locale}`} />
          </label>
        </div>
      )}

      {option.input_data_type === 'text' && (
        <label className="block text-sm">Input mask (RegEx)
          <input value={typeof option.input_validation === 'string' ? option.input_validation : ''}
                 onChange={(e) => onChange(setInputValidation(option, e.target.value || undefined))}
                 className="mt-1 w-full rounded border border-ed-border px-2 py-1 font-mono text-xs" aria-label="Input mask (RegEx)" />
          <span className="mt-0.5 block text-[11px] text-ed-muted">Input-level pattern. For a validation error message, use Format below.</span>
        </label>
      )}

      {option.input_data_type !== 'choice' && (() => {
        const v = option.validation ?? {}
        const numStr = (n: number | null | undefined) => (n === null || n === undefined ? '' : String(n))
        const parse = (raw: string): number | null => (raw === '' ? null : Number(raw))
        const parseLen = (raw: string): number | null => (raw === '' ? null : Math.trunc(Number(raw)))
        return (
          <div className="space-y-2 rounded border border-ed-border p-2">
            <div className="text-xs font-semibold text-ed-muted">Validation</div>
            {option.input_data_type === 'number' && (
              <div className="flex flex-wrap items-end gap-3">
                <label className="text-sm">Min value
                  <input type="number" aria-label="Min value" value={numStr(v.range?.[0])}
                         onChange={(e) => onChange(setValidation(option, { range: [parse(e.target.value), v.range?.[1] ?? null] }))}
                         className="ml-1 w-24 rounded border border-ed-border px-1 py-0.5" />
                </label>
                <label className="text-sm">Max value
                  <input type="number" aria-label="Max value" value={numStr(v.range?.[1])}
                         onChange={(e) => onChange(setValidation(option, { range: [v.range?.[0] ?? null, parse(e.target.value)] }))}
                         className="ml-1 w-24 rounded border border-ed-border px-1 py-0.5" />
                </label>
                <label className="block w-full text-sm">Range message
                  <input value={v.range_message ?? ''} aria-label="Range message"
                         onChange={(e) => onChange(setValidation(option, { range_message: e.target.value }))}
                         className="mt-1 w-full rounded border border-ed-border px-2 py-1" />
                </label>
              </div>
            )}
            {option.input_data_type === 'text' && (
              <div className="space-y-2">
                <div className="flex flex-wrap items-end gap-3">
                  <label className="text-sm">Min length
                    <input type="number" step={1} aria-label="Min length" min={0} value={numStr(v.length?.[0])}
                           onChange={(e) => onChange(setValidation(option, { length: [parseLen(e.target.value), v.length?.[1] ?? null] }))}
                           className="ml-1 w-24 rounded border border-ed-border px-1 py-0.5" />
                  </label>
                  <label className="text-sm">Max length
                    <input type="number" step={1} aria-label="Max length" min={0} value={numStr(v.length?.[1])}
                           onChange={(e) => onChange(setValidation(option, { length: [v.length?.[0] ?? null, parseLen(e.target.value)] }))}
                           className="ml-1 w-24 rounded border border-ed-border px-1 py-0.5" />
                  </label>
                  <label className="block w-full text-sm">Length message
                    <input value={v.length_message ?? ''} aria-label="Length message"
                           onChange={(e) => onChange(setValidation(option, { length_message: e.target.value }))}
                           className="mt-1 w-full rounded border border-ed-border px-2 py-1" />
                  </label>
                </div>
                <label className="block text-sm">Format (regex)
                  <input value={v.format ?? ''} aria-label="Format (regex)"
                         onChange={(e) => onChange(setValidation(option, { format: e.target.value }))}
                         className="mt-1 w-full rounded border border-ed-border px-2 py-1 font-mono text-xs" />
                </label>
                <label className="block text-sm">Format message
                  <input value={v.format_message ?? ''} aria-label="Format message"
                         onChange={(e) => onChange(setValidation(option, { format_message: e.target.value }))}
                         className="mt-1 w-full rounded border border-ed-border px-2 py-1" />
                </label>
              </div>
            )}
          </div>
        )
      })()}

      {option.input_data_type !== 'choice' && (
        <label className="block text-sm">Placeholder ({locale})
          <input value={inlineText(option.placeholder, locale)} onChange={(e) => onChange(setPlaceholderText(option, locale, e.target.value))}
                 className="mt-1 w-full rounded border border-ed-border px-2 py-1" aria-label={`Placeholder ${locale}`} />
        </label>
      )}

      <label className="block text-sm">Help ({locale})
        <input value={inlineText(option.help, locale)} onChange={(e) => onChange(setHelpText(option, locale, e.target.value))}
               className="mt-1 w-full rounded border border-ed-border px-2 py-1" aria-label={`Help ${locale}`} />
      </label>
    </div>
  )
}
