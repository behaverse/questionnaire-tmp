type Props = { label: string; min?: number; max?: number; step?: number; value: number | string | (number | string)[] | null; onChange: (value: number | null) => void }

export function NumberInput({ label, min, max, step, value, onChange }: Props) {
  return (
    <input
      type="number"
      aria-label={label}
      min={min}
      max={max}
      step={step}
      value={typeof value === 'number' ? value : ''}
      onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
      className="w-40 rounded-xl border-2 border-slate-200 px-4 py-3 text-lg focus:border-primary focus:outline-none"
    />
  )
}
