const OPTIONS = [
  { value: '', label: 'Relevance' },
  { value: 'title', label: 'Title' },
  { value: 'recency', label: 'Recency' },
]

export function SortSelect({ value, onChange }: { value: string | undefined; onChange: (v: string | undefined) => void }) {
  return (
    <select
      aria-label="Sort results"
      className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value || undefined)}
    >
      {OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  )
}
