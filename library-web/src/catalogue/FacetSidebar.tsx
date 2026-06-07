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
    <aside className="w-60 shrink-0 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-700">Filters</h2>
        {anySelected && <button className="text-xs text-accent hover:underline" onClick={onClear}>Clear</button>}
      </div>
      {groups.map((g) => (
        <div key={g.key}>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{g.title}</h3>
          <ul className="space-y-1">
            {g.values.map((v) => (
              <li key={v.value}>
                <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    className="rounded border-slate-300"
                    checked={selected[g.key] === v.value}
                    onChange={() => onToggle(g.key, v.value)}
                  />
                  <span className="flex-1">{display(g.key, v.value)}</span>
                  <span className="text-xs text-slate-400">{v.count}</span>
                </label>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </aside>
  )
}
