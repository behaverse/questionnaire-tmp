import { addChoice, removeChoice, reorderChoice, setChoiceValue, setChoiceText, type EditableOption } from './ops'

export function ChoiceRows({ option, locale, onChange }: { option: EditableOption; locale: string; onChange: (o: EditableOption) => void }) {
  const structural = option.options ?? []
  const textByIndex = new Map((option.content?.[locale]?.options ?? []).map((r) => [r.index, r.text]))
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-[3rem_5rem_1fr_auto] items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-400">
        <span>#</span><span>Value</span><span>Label ({locale})</span><span />
      </div>
      {structural.map((row) => (
        <div key={row.index} className="grid grid-cols-[3rem_5rem_1fr_auto] items-center gap-2">
          <span className="text-sm text-slate-500">{row.index}</span>
          <input aria-label={`Value for choice ${row.index}`} type="number" defaultValue={row.value === null ? '' : String(row.value)}
                 onChange={(e) => onChange(setChoiceValue(option, row.index, e.target.value === '' ? null : Number(e.target.value)))}
                 className="rounded border border-slate-300 px-1 py-0.5 text-sm" />
          <input aria-label={`Label for choice ${row.index}`} value={textByIndex.get(row.index) ?? ''}
                 onChange={(e) => onChange(setChoiceText(option, row.index, locale, e.target.value))}
                 className="rounded border border-slate-300 px-2 py-0.5 text-sm" />
          <div className="flex gap-1">
            <button aria-label={`Move choice ${row.index} up`} disabled={row.index === 1}
                    onClick={() => onChange(reorderChoice(option, row.index, row.index - 1))}
                    className="px-1 text-slate-400 hover:text-slate-700 disabled:opacity-30">↑</button>
            <button aria-label={`Move choice ${row.index} down`} disabled={row.index === structural.length}
                    onClick={() => onChange(reorderChoice(option, row.index, row.index + 1))}
                    className="px-1 text-slate-400 hover:text-slate-700 disabled:opacity-30">↓</button>
            <button aria-label={`Remove choice ${row.index}`} onClick={() => onChange(removeChoice(option, row.index))}
                    className="px-1 text-slate-400 hover:text-red-600">✕</button>
          </div>
        </div>
      ))}
      <button onClick={() => onChange(addChoice(option, locale))}
              className="rounded border border-slate-300 px-2 py-1 text-sm hover:bg-slate-50">+ Add choice</button>
    </div>
  )
}
