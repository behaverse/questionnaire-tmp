import type { AnswerValue, MergedChoice } from '../types'

type Props = { label: string; choices: MergedChoice[]; value: AnswerValue; onChange: (value: (number | string)[]) => void }

export function CheckboxGroup({ label, choices, value, onChange }: Props) {
  const selected = Array.isArray(value) ? value : []
  const toggle = (v: number | string) =>
    onChange(selected.includes(v) ? selected.filter((x) => x !== v) : [...selected, v])
  return (
    <div role="group" aria-label={label} className="flex flex-col gap-2.5">
      {choices.map((c) => {
        const isOn = selected.includes(c.value)
        return (
          <label key={c.index} className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 px-4 py-3 text-lg transition-colors ${isOn ? 'border-primary bg-primary/5 text-primary' : 'border-slate-200 hover:border-slate-300'}`}>
            <input type="checkbox" checked={isOn} onChange={() => toggle(c.value)} className="h-5 w-5 accent-[var(--qv-primary)]" />
            <span>{c.text}</span>
          </label>
        )
      })}
    </div>
  )
}
