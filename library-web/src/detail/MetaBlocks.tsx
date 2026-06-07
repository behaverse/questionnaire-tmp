import type { DefMetadata, ScoreDecl } from '../api/types'

function Chips({ items }: { items?: string[] }) {
  if (!items || items.length === 0) return null
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((i) => (
        <span
          key={i}
          className="rounded-full bg-paper-sunken px-2.5 py-0.5 text-xs text-ink-soft ring-1 ring-inset ring-rule"
        >
          {i}
        </span>
      ))}
    </div>
  )
}

export function ClassificationBlock({ meta }: { meta: DefMetadata }) {
  const c = meta.classification
  if (!c) return null
  return (
    <dl className="grid grid-cols-[9rem_1fr] items-center gap-x-4 gap-y-3 text-sm">
      {c.domain && <><dt className="text-xs font-medium uppercase tracking-[0.08em] text-ink-faint">Domain</dt><dd><Chips items={c.domain} /></dd></>}
      {c.population && <><dt className="text-xs font-medium uppercase tracking-[0.08em] text-ink-faint">Population</dt><dd><Chips items={c.population} /></dd></>}
      {c.administration_mode && <><dt className="text-xs font-medium uppercase tracking-[0.08em] text-ink-faint">Administration</dt><dd><Chips items={c.administration_mode} /></dd></>}
      {c.age_range && <><dt className="text-xs font-medium uppercase tracking-[0.08em] text-ink-faint">Age range</dt><dd className="text-ink">{c.age_range.join('–')}</dd></>}
    </dl>
  )
}

export function PsychometricsBlock({ meta }: { meta: DefMetadata }) {
  const p = meta.psychometrics
  if (!p) return null
  return (
    <dl className="grid grid-cols-[9rem_1fr] gap-x-4 gap-y-3 text-sm">
      {p.item_count != null && <><dt className="text-xs font-medium uppercase tracking-[0.08em] text-ink-faint">Items</dt><dd className="font-mono tabular-nums text-ink">{p.item_count}</dd></>}
      {p.estimated_minutes != null && <><dt className="text-xs font-medium uppercase tracking-[0.08em] text-ink-faint">Time</dt><dd className="font-mono tabular-nums text-ink">~{p.estimated_minutes} min</dd></>}
    </dl>
  )
}

export function CitationBlock({ meta }: { meta: DefMetadata }) {
  if (!meta.authors && !meta.publication) return null
  return (
    <div className="text-sm">
      {meta.authors && <p className="font-medium text-ink">{meta.authors.map((a) => a.name).join(', ')}</p>}
      {meta.publication?.citation && (
        <p className="mt-2 border-l-2 border-rule pl-3.5 leading-relaxed text-ink-soft">{meta.publication.citation}</p>
      )}
    </div>
  )
}

export function ScoresBlock({ scores }: { scores?: ScoreDecl[] }) {
  if (!scores || scores.length === 0) return null
  return (
    <ul className="divide-y divide-rule-soft text-sm">
      {scores.map((s) => (
        <li key={s.id} className="flex items-baseline justify-between gap-3 py-2 first:pt-0">
          <span className="font-medium text-ink">{s.name ?? s.id}</span>
          <span className="font-mono text-xs text-ink-faint">{s.scorer}</span>
        </li>
      ))}
    </ul>
  )
}
