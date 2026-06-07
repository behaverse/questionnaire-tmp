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
    <article className="group relative border-b border-rule py-6 transition-colors first:border-t hover:bg-paper-raised">
      <span
        aria-hidden
        className="absolute inset-y-0 left-0 w-px origin-top scale-y-0 bg-accent transition-transform duration-200 group-hover:scale-y-100"
      />
      <Link
        to={`/q/${card.id}`}
        className="font-serif text-[19px] font-semibold tracking-tightish text-ink decoration-accent/40 underline-offset-[3px] transition-colors group-hover:text-accent group-hover:underline"
      >
        {card.title ?? card.id}
        {card.short_title && card.short_title !== card.title && (
          <span className="ml-2 font-sans text-sm font-normal text-ink-faint">({card.short_title})</span>
        )}
      </Link>
      {card.description && (
        <p className="mt-1.5 line-clamp-2 max-w-2xl text-sm leading-relaxed text-ink-soft">{card.description}</p>
      )}
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-ink-faint">
        {meta.length > 0 && (
          <span className="font-mono text-[11px] tracking-tight text-ink-faint">{meta.join('  ·  ')}</span>
        )}
        {meta.length > 0 && (card.effective_license || card.domain.length > 0 || card.population.length > 0) && (
          <span aria-hidden className="h-3 w-px bg-rule" />
        )}
        {card.effective_license && <Badge>{licenseLabel(card.effective_license)}</Badge>}
        {card.domain.map((d) => <Badge key={d} tone="accent">{d}</Badge>)}
        {card.population.map((p) => <Badge key={p}>{p}</Badge>)}
      </div>
    </article>
  )
}
