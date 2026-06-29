import { useRef, type KeyboardEvent } from 'react'

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
  const btns = useRef<(HTMLButtonElement | null)[]>([])
  const selectedIndex = selected != null ? values.indexOf(selected) : -1
  // WAI-ARIA radiogroup roving tabindex: exactly one radio is tabbable — the checked one,
  // or the first when nothing is checked yet.
  const tabbableIndex = selectedIndex >= 0 ? selectedIndex : 0

  function onKeyDown(e: KeyboardEvent, i: number) {
    let next: number
    switch (e.key) {
      case 'ArrowRight': case 'ArrowDown': next = (i + 1) % values.length; break
      case 'ArrowLeft': case 'ArrowUp': next = (i - 1 + values.length) % values.length; break
      case 'Home': next = 0; break
      case 'End': next = values.length - 1; break
      default: return
    }
    e.preventDefault()
    onChange(values[next])           // selection follows focus, per the radio pattern
    btns.current[next]?.focus()
  }

  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
      {values.map((v, i) => {
        const isSel = selected === v
        return (
          <button
            key={v}
            ref={(el) => { btns.current[i] = el }}
            type="button"
            role="radio"
            aria-checked={isSel}
            tabIndex={i === tabbableIndex ? 0 : -1}
            onClick={() => onChange(v)}
            onKeyDown={(e) => onKeyDown(e, i)}
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
