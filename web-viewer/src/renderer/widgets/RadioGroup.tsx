import { useEffect } from 'react'
import type { AnswerValue, MergedChoice } from '../types'

type Props = {
  name: string
  label: string
  choices: MergedChoice[]
  value: AnswerValue
  onChange: (value: number | string) => void
  keyHints?: boolean
}

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

export function RadioGroup({ name, label, choices, value, onChange, keyHints = false }: Props) {
  useEffect(() => {
    if (!keyHints) return
    function onKey(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const target = e.target as HTMLElement
      if (target instanceof HTMLInputElement && ['text', 'number', 'email'].includes(target.type)) return
      if (target instanceof HTMLTextAreaElement) return
      const i = e.key.length === 1 ? LETTERS.indexOf(e.key.toUpperCase()) : -1
      if (i >= 0 && i < choices.length) onChange(choices[i].value)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [keyHints, choices, onChange])

  return (
    <div role="radiogroup" aria-label={label} className="flex flex-col gap-2.5">
      {choices.map((c, i) => {
        const selected = value === c.value
        return (
          <label
            key={c.index}
            className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 px-4 py-3 text-lg transition-colors ${
              selected ? 'border-primary bg-primary/5 text-primary' : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <input
              type="radio"
              name={name}
              checked={selected}
              onChange={() => onChange(c.value)}
              className="sr-only"
            />
            {keyHints && (
              <span aria-hidden className={`grid h-6 w-6 shrink-0 place-items-center rounded border text-xs font-semibold ${selected ? 'border-primary' : 'border-slate-300 text-slate-500'}`}>
                {LETTERS[i]}
              </span>
            )}
            <span>{c.text}</span>
          </label>
        )
      })}
    </div>
  )
}
