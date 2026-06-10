import { useState } from 'react'
import type { FacetKey } from './useCatalogueParams'
import type { FacetValue } from '../api/types'
import { licenseLabel, languageLabel } from '../lib/labels'

export interface FacetGroup {
  key: FacetKey
  title: string
  values: FacetValue[]
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

function FacetGroupSection({
  group,
  selectedValue,
  onToggle,
}: {
  group: FacetGroup
  selectedValue: string | undefined
  onToggle: (key: FacetKey, value: string) => void
}) {
  const hasSelection = !!selectedValue
  const [open, setOpen] = useState(hasSelection)
  const panelId = `facet-${group.key}`
  return (
    <div>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        className="mb-2.5 flex w-full items-center gap-2 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-faint transition-colors hover:text-ink-soft"
      >
        <span className="flex-1">{group.title}</span>
        {hasSelection && <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-accent" />}
        <span className="font-mono text-[11px] tabular-nums text-ink-faint">{group.values.length}</span>
        <span aria-hidden="true">{open ? '▾' : '▸'}</span>
      </button>
      {open && (
        <ul id={panelId} className="space-y-0.5">
          {group.values.map((v) => {
            const active = selectedValue === v.value
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
                    onChange={() => onToggle(group.key, v.value)}
                  />
                  <span className={`flex-1 ${active ? 'font-medium' : ''}`}>{v.label ?? display(group.key, v.value)}</span>
                  <span className="font-mono text-[11px] tabular-nums text-ink-faint">{v.count}</span>
                </label>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
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
          <FacetGroupSection key={g.key} group={g} selectedValue={selected[g.key]} onToggle={onToggle} />
        ))}
      </div>
    </aside>
  )
}
