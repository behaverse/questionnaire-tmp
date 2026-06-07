import type { FacetKey } from './useCatalogueParams'
import { licenseLabel, languageLabel } from '../lib/labels'

export interface FacetGroup {
  key: FacetKey
  title: string
  values: { value: string; count: number }[]
}

export interface FacetSidebarProps {
  groups: FacetGroup[]
  selected: Record<FacetKey, string | undefined>
  onToggle: (key: FacetKey, value: string) => void
  onClear: () => void
}

function display(key: FacetKey, value: string): string {
  if (key === 'license') return licenseLabel(value)
  if (key === 'language') return languageLabel(value)
  return value
}

export function FacetSidebar({ groups, selected, onToggle, onClear }: FacetSidebarProps) {
  const anySelected = Object.values(selected).some(Boolean)
  return (
    <aside className="hidden w-60 shrink-0 sm:block">
      <div className="sticky top-[5.5rem] space-y-7">
        <div className="flex items-center justify-between border-b border-rule pb-2.5">
          <h2 className="font-serif text-[15px] font-semibold text-ink">Filters</h2>
          {anySelected && (
            <button
              className="text-xs font-medium text-accent underline-offset-2 transition-opacity hover:underline"
              onClick={onClear}
            >
              Clear all
            </button>
          )}
        </div>
        {groups.map((g) => (
          <div key={g.key}>
            <h3 className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-faint">{g.title}</h3>
            <ul className="space-y-0.5">
              {g.values.map((v) => {
                const active = selected[g.key] === v.value
                return (
                  <li key={v.value}>
                    <label
                      className={`group flex cursor-pointer items-center gap-2.5 rounded-md px-1.5 py-1 text-sm transition-colors ${
                        active ? 'text-ink' : 'text-ink-soft hover:bg-paper-sunken'
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="h-3.5 w-3.5 rounded-[4px] border-rule text-accent transition focus:ring-2 focus:ring-accent/30 focus:ring-offset-0"
                        checked={active}
                        onChange={() => onToggle(g.key, v.value)}
                      />
                      <span className={`flex-1 ${active ? 'font-medium' : ''}`}>{display(g.key, v.value)}</span>
                      <span className="font-mono text-[11px] tabular-nums text-ink-faint">{v.count}</span>
                    </label>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </div>
    </aside>
  )
}
