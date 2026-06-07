import type { DefMetadata, ScoreDecl } from '../api/types'

function Chips({ items }: { items?: string[] }) {
  if (!items || items.length === 0) return null
  return <>{items.map((i) => <span key={i} className="mr-2 rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{i}</span>)}</>
}

export function ClassificationBlock({ meta }: { meta: DefMetadata }) {
  const c = meta.classification
  if (!c) return null
  return (
    <dl className="grid grid-cols-[8rem_1fr] gap-y-2 text-sm">
      {c.domain && <><dt className="text-slate-500">Domain</dt><dd><Chips items={c.domain} /></dd></>}
      {c.population && <><dt className="text-slate-500">Population</dt><dd><Chips items={c.population} /></dd></>}
      {c.administration_mode && <><dt className="text-slate-500">Administration</dt><dd><Chips items={c.administration_mode} /></dd></>}
      {c.age_range && <><dt className="text-slate-500">Age range</dt><dd className="text-slate-700">{c.age_range.join('–')}</dd></>}
    </dl>
  )
}

export function PsychometricsBlock({ meta }: { meta: DefMetadata }) {
  const p = meta.psychometrics
  if (!p) return null
  return (
    <dl className="grid grid-cols-[8rem_1fr] gap-y-2 text-sm">
      {p.item_count != null && <><dt className="text-slate-500">Items</dt><dd className="text-slate-700">{p.item_count}</dd></>}
      {p.estimated_minutes != null && <><dt className="text-slate-500">Time</dt><dd className="text-slate-700">~{p.estimated_minutes} min</dd></>}
    </dl>
  )
}

export function CitationBlock({ meta }: { meta: DefMetadata }) {
  if (!meta.authors && !meta.publication) return null
  return (
    <div className="text-sm text-slate-700">
      {meta.authors && <p>{meta.authors.map((a) => a.name).join(', ')}</p>}
      {meta.publication?.citation && <p className="mt-1 text-slate-600">{meta.publication.citation}</p>}
    </div>
  )
}

export function ScoresBlock({ scores }: { scores?: ScoreDecl[] }) {
  if (!scores || scores.length === 0) return null
  return (
    <ul className="space-y-1 text-sm">
      {scores.map((s) => (
        <li key={s.id} className="text-slate-700">
          <span className="font-medium">{s.name ?? s.id}</span>
          <span className="ml-2 font-mono text-xs text-slate-400">{s.scorer}</span>
        </li>
      ))}
    </ul>
  )
}
