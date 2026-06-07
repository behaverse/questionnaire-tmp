import { Link } from 'react-router-dom'
import type { CatalogueCard } from '../api/types'
import { Badge } from '../components/Badge'
import { licenseLabel, languageLabel } from '../lib/labels'

export function ResultRow({ card }: { card: CatalogueCard }) {
  const meta: string[] = []
  if (card.item_count != null) meta.push(`${card.item_count} items`)
  if (card.estimated_minutes != null) meta.push(`~${card.estimated_minutes} min`)
  if (card.language) meta.push(languageLabel(card.language))
  return (
    <article className="border-b border-slate-200 py-5">
      <Link to={`/q/${card.id}`} className="text-lg font-medium text-slate-900 hover:text-accent">
        {card.title ?? card.id}
        {card.short_title && card.short_title !== card.title && (
          <span className="ml-2 text-sm font-normal text-slate-500">({card.short_title})</span>
        )}
      </Link>
      {card.description && <p className="mt-1 line-clamp-2 text-sm text-slate-600">{card.description}</p>}
      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
        {meta.length > 0 && <span>{meta.join(' · ')}</span>}
        {card.effective_license && <Badge>{licenseLabel(card.effective_license)}</Badge>}
        {card.domain.map((d) => <Badge key={d} tone="accent">{d}</Badge>)}
        {card.population.map((p) => <Badge key={p}>{p}</Badge>)}
      </div>
    </article>
  )
}
