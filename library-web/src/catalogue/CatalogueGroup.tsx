import { useState } from 'react'
import type { InstrumentGroup } from '../api/types'
import { ResultRow } from './ResultRow'
import { MetaRows } from './MetaRows'
import { licenseLabel, languageLabel } from '../lib/labels'

export function CatalogueGroup({ group }: { group: InstrumentGroup }) {
  const [open, setOpen] = useState(false)
  if (group.form_count === 1) return <ResultRow card={group.forms[0]} />

  const panelId = `forms-${group.instrument_id ?? group.forms[0].id}`

  const itemCounts = [...new Set(group.forms.map((f) => f.item_count).filter((n): n is number => n != null))].sort((a, b) => a - b)
  const licenses = [...new Set(group.forms.map((f) => f.effective_license))]
  const langs = group.languages.map(languageLabel)
  const rows: { label: string; value: string }[] = []
  if (group.domain.length) rows.push({ label: 'Domain', value: group.domain.join(', ') })
  if (itemCounts.length) rows.push({ label: 'Items', value: itemCounts.join(', ') })
  if (langs.length) rows.push({ label: 'Languages', value: langs.join(', ') })
  rows.push({ label: 'License', value: licenses.length === 1 ? licenseLabel(licenses[0]) : 'Mixed' })

  return (
    <article className="border-b border-rule py-5 pl-6 pr-4 first:border-t">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-baseline gap-2 text-left"
      >
        <span className="font-serif text-[19px] font-semibold tracking-tightish text-ink">
          {group.title ?? group.instrument_id}
        </span>
        <span className="font-sans text-sm font-medium text-accent">
          {group.form_count} variants <span aria-hidden="true">{open ? '▾' : '▸'}</span>
        </span>
      </button>
      <p className="mt-1 font-mono text-xs text-ink-faint">{group.instrument_id}</p>
      <MetaRows rows={rows} />
      {open && (
        <div id={panelId} className="mt-2 border-l-2 border-rule pl-4">
          {group.forms.map((f) => <ResultRow key={`${f.id}@${f.version}`} card={f} />)}
        </div>
      )}
    </article>
  )
}
