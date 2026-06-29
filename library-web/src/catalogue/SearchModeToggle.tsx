export type SearchMode = 'questionnaires' | 'questions'

const OPTIONS: { id: SearchMode; label: string }[] = [
  { id: 'questionnaires', label: 'Questionnaires' },
  { id: 'questions', label: 'Questions' },
]

/** Segmented toggle to switch the search between whole questionnaires and individual questions. */
export function SearchModeToggle({ mode, onChange }: { mode: SearchMode; onChange: (m: SearchMode) => void }) {
  return (
    <div role="radiogroup" aria-label="Search for" className="inline-flex rounded-lg border border-rule bg-paper-raised p-0.5 shadow-card">
      {OPTIONS.map((o) => {
        const active = mode === o.id
        return (
          <button
            key={o.id}
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.id)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              active ? 'bg-accent/10 text-accent' : 'text-ink-soft hover:text-ink'
            }`}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}
