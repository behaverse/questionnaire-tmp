import { useEffect } from 'react'
import type { AnswerValue, MergedChoice } from '../types'

type Props = {
  name: string
  label: string
  choices: MergedChoice[]
  value: AnswerValue
  onChange: (value: number | string) => void
  /** Window-level letter shortcuts — enable for at most ONE mounted RadioGroup at a time (focus-mode single-item steps). */
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
          <label key={c.index} data-selected={selected} className="qv-option">
            <input
              type="radio"
              name={name}
              checked={selected}
              onChange={() => onChange(c.value)}
              className="sr-only"
            />
            {keyHints && (
              <span aria-hidden className="qv-option-badge">{LETTERS[i]}</span>
            )}
            <span>{c.text}</span>
          </label>
        )
      })}
    </div>
  )
}
