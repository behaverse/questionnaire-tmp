import { useState } from 'react'
import type { InstrumentGroup } from '../api/types'
import { ResultRow } from './ResultRow'
import { languageLabel } from '../lib/labels'

export function CatalogueGroup({ group }: { group: InstrumentGroup }) {
  const [open, setOpen] = useState(false)
  if (group.form_count === 1) return <ResultRow card={group.forms[0]} />

  const languages = group.languages.map(languageLabel)
  return (
    <article className="border-b border-rule py-5 pl-6 pr-4 first:border-t">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-baseline gap-2 text-left"
      >
        <span className="font-serif text-[19px] font-semibold tracking-tightish text-ink">
          {group.title ?? group.instrument_id}
        </span>
        <span className="font-sans text-sm font-medium text-accent">
          {group.form_count} forms {open ? '▾' : '▸'}
        </span>
      </button>
      <p className="mt-1 font-mono text-xs text-ink-faint">
        {group.instrument_id}
        {languages.length > 0 && <> · {languages.join(', ')}</>}
      </p>
      {open && (
        <div className="mt-2 border-l-2 border-rule pl-4">
          {group.forms.map((f) => <ResultRow key={`${f.id}@${f.version}`} card={f} />)}
        </div>
      )}
    </article>
  )
}
