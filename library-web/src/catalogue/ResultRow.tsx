import { Link } from 'react-router-dom'
import type { CatalogueCard } from '../api/types'
import { licenseLabel, languageLabel } from '../lib/labels'
import { MetaRows } from './MetaRows'

export function ResultRow({ card }: { card: CatalogueCard }) {
  const languages = (
    card.available_languages && card.available_languages.length > 0
      ? card.available_languages
      : card.language
        ? [card.language]
        : []
  ).map(languageLabel)

  const items: string[] = []
  if (card.item_count != null) items.push(`${card.item_count}`)
  if (card.estimated_minutes != null) items.push(`~${card.estimated_minutes} min`)

  const rows: { label: string; value: string }[] = []
  if (languages.length) rows.push({ label: 'Languages', value: languages.join(', ') })
  rows.push({ label: 'License', value: licenseLabel(card.effective_license) })
  if (card.domain.length) rows.push({ label: 'Domain', value: card.domain.join(', ') })
  if (card.population.length) rows.push({ label: 'Population', value: card.population.join(', ') })
  if (items.length) rows.push({ label: 'Items', value: items.join(' · ') })

  return (
    <article className="group relative border-b border-rule py-6 pl-6 pr-4 transition-colors first:border-t hover:bg-paper-raised">
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
      <p className="mt-1 font-mono text-xs text-ink-faint">{card.id}</p>
      {card.description && card.description !== card.title && (
        <p className="mt-1.5 line-clamp-2 max-w-2xl text-sm leading-relaxed text-ink-soft">{card.description}</p>
      )}
      <MetaRows rows={rows} />
    </article>
  )
}
