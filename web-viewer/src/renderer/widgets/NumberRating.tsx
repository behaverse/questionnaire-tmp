type Props = {
  label: string
  min: number
  max: number
  step?: number
  value: number | string | (number | string)[] | null
  onChange: (value: number) => void
}

export function NumberRating({ label, min, max, step, value, onChange }: Props) {
  const s = step && step > 0 ? step : 1
  const values: number[] = []
  for (let v = min; v <= max + 1e-9; v += s) values.push(Number(v.toFixed(6)))
  const selected = typeof value === 'number' ? value : null
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
      {values.map((v) => {
        const isSel = selected === v
        return (
          <button
            key={v}
            type="button"
            role="radio"
            aria-checked={isSel}
            onClick={() => onChange(v)}
            data-selected={isSel}
            className={`min-w-[2.75rem] rounded-lg border px-3 py-2 text-sm font-medium tabular-nums transition-colors ${
              isSel
                ? 'border-zinc-900 bg-zinc-900 text-white'
                : 'border-zinc-300 bg-white text-zinc-800 hover:border-zinc-500'
            }`}
          >
            {v}
          </button>
        )
      })}
    </div>
  )
}
