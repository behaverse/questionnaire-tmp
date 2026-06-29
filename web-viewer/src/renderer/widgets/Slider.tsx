type Props = {
  label: string
  min?: number
  max?: number
  step?: number
  value: number | string | (number | string)[] | null
  onChange: (value: number | null) => void
  /** Announced when no value has been chosen yet, so AT doesn't read the midpoint as a choice. */
  unsetText?: string
}

export function Slider({ label, min, max, step, value, onChange, unsetText = 'Not selected' }: Props) {
  const current = typeof value === 'number' ? value : null
  const mid = min != null && max != null ? (min + max) / 2 : 0
  return (
    <div className="flex flex-col gap-2">
      <div className="text-2xl font-semibold tabular-nums" aria-hidden>
        {current ?? '—'}
      </div>
      <input
        type="range"
        aria-label={label}
        aria-valuetext={current != null ? String(current) : unsetText}
        min={min}
        max={max}
        step={step}
        value={current ?? mid}
        onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
        className="w-full max-w-md accent-[var(--qv-prompt-color,#18181b)]"
      />
      <div className="flex max-w-md justify-between text-sm text-zinc-500" aria-hidden>
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  )
}
