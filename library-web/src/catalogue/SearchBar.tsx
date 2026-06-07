import { useEffect, useRef, useState } from 'react'

export function SearchBar({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [text, setText] = useState(value)
  const onChangeRef = useRef(onChange)
  useEffect(() => { onChangeRef.current = onChange })

  useEffect(() => setText(value), [value])

  useEffect(() => {
    const id = setTimeout(() => { if (text !== value) onChangeRef.current(text) }, 300)
    return () => clearTimeout(id)
  }, [text, value])

  return (
    <input
      type="search"
      aria-label="Search questionnaires"
      placeholder="Search questionnaires…"
      className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
      value={text}
      onChange={(e) => setText(e.target.value)}
    />
  )
}
