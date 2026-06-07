const OPTIONS = [
  { value: '', label: 'Relevance' },
  { value: 'title', label: 'Title' },
  { value: 'recency', label: 'Recency' },
]

export function SortSelect({ value, onChange }: { value: string | undefined; onChange: (v: string | undefined) => void }) {
  return (
    <div className="relative flex items-center">
      <span className="pointer-events-none absolute left-3 text-[11px] font-medium uppercase tracking-[0.12em] text-ink-faint">
        Sort
      </span>
      <select
        aria-label="Sort results"
        className="cursor-pointer appearance-none rounded-lg border border-rule bg-paper-raised py-2.5 pl-[3.4rem] pr-9 text-sm font-medium text-ink shadow-card transition-colors hover:border-ink-faint/50 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value || undefined)}
      >
        {OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <svg
        aria-hidden
        viewBox="0 0 12 12"
        fill="none"
        className="pointer-events-none absolute right-3 h-3 w-3 text-ink-faint"
      >
        <path d="m2.5 4.5 3.5 3.5 3.5-3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  )
}
