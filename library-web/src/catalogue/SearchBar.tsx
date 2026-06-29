import { useEffect, useRef, useState } from 'react'

export function SearchBar({ value, onChange, label = 'Search questionnaires', placeholder = 'Search questionnaires…' }: { value: string; onChange: (v: string) => void; label?: string; placeholder?: string }) {
  const [text, setText] = useState(value)
  const onChangeRef = useRef(onChange)
  useEffect(() => { onChangeRef.current = onChange })

  useEffect(() => setText(value), [value])

  useEffect(() => {
    const id = setTimeout(() => { if (text !== value) onChangeRef.current(text) }, 300)
    return () => clearTimeout(id)
  }, [text, value])

  return (
    <div className="group relative">
      <svg
        aria-hidden
        viewBox="0 0 20 20"
        fill="none"
        className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-ink-faint transition-colors group-focus-within:text-accent"
      >
        <circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" strokeWidth="1.6" />
        <path d="m13 13 4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
      <input
        type="search"
        aria-label={label}
        placeholder={placeholder}
        className="w-full rounded-lg border border-rule bg-paper-raised py-2.5 pl-10 pr-4 text-sm text-ink shadow-card transition-colors placeholder:text-ink-faint hover:border-ink-faint/50 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
    </div>
  )
}
