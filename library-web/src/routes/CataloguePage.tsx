import { useEffect, useState } from 'react'
import { useCatalogueParams, type FacetKey } from '../catalogue/useCatalogueParams'
import { useQuestionnaires, useFacets, useStats } from '../api/queries'
import { CatalogueGroup } from '../catalogue/CatalogueGroup'
import { FacetSidebar, MobileFilters, type FacetGroup } from '../catalogue/FacetSidebar'
import { SearchBar } from '../catalogue/SearchBar'
import { QuestionResults } from '../catalogue/QuestionResults'
import { SearchModeToggle, type SearchMode } from '../catalogue/SearchModeToggle'
import { SortSelect } from '../catalogue/SortSelect'
import { Pagination } from '../catalogue/Pagination'
import { Skeleton } from '../components/Skeleton'
import { EmptyState } from '../components/EmptyState'
import { ErrorState } from '../components/ErrorState'
import { ApiError } from '../api/client'
import type { FacetValue } from '../api/types'

const FACET_DEFS: { key: FacetKey; title: string }[] = [
  { key: 'domain', title: 'Domain' },
  { key: 'population', title: 'Population' },
  { key: 'instrument', title: 'Instrument' },
  { key: 'language', title: 'Language' },
  { key: 'license', title: 'License' },
]

export function CataloguePage() {
  const [mode, setMode] = useState<SearchMode>('questionnaires')
  const { params, offset, limit, setParam, toggleFacet, setPage, clearAll } = useCatalogueParams()
  const list = useQuestionnaires({
    q: params.q, domain: params.domain, population: params.population,
    language: params.language, license: params.license, instrument: params.instrument,
    sort: params.sort, limit, offset,
  })

  const stats = useStats()
  const domain = useFacets('domain')
  const population = useFacets('population')
  const instrument = useFacets('instrument')
  const language = useFacets('language')
  const license = useFacets('license')
  const facetData: Record<FacetKey, FacetValue[]> = {
    domain: domain.data?.values ?? [],
    population: population.data?.values ?? [],
    instrument: instrument.data?.values ?? [],
    language: language.data?.values ?? [],
    license: license.data?.values ?? [],
  }
  const groups: FacetGroup[] = FACET_DEFS
    .map((d) => ({ key: d.key, title: d.title, values: facetData[d.key] }))
    .filter((g) => g.values.length > 0)

  const facetSelection = { domain: params.domain, population: params.population, instrument: params.instrument, language: params.language, license: params.license }

  // A short, screen-reader-announced summary of the result state (search/filter feedback).
  const statusText = mode === 'questions'
    ? '' // QuestionResults renders its own visible status
    : list.isLoading
    ? 'Loading questionnaires…'
    : list.isError
      ? (list.error instanceof ApiError && list.error.status === 422 ? 'Invalid search or filter.' : 'Could not load questionnaires.')
      : list.isSuccess
        ? (list.data.total === 0 ? 'No questionnaires match these filters.' : `${list.data.total} result${list.data.total === 1 ? '' : 's'}.`)
        : ''

  useEffect(() => { document.title = 'Browse the catalogue · Questionnaire Library' }, [])

  return (
    <main id="main-content" tabIndex={-1} className="mx-auto max-w-6xl px-6 py-10 focus:outline-none">
      <p role="status" aria-live="polite" className="sr-only">{statusText}</p>
      <div className="mb-8 max-w-2xl">
        <h1 className="font-serif text-[28px] font-semibold leading-tight tracking-tightish text-ink sm:text-[34px]">
          Browse the catalogue
        </h1>
        <p className="mt-2 text-[15px] leading-relaxed text-ink-soft">
          A curated, read-only library of research questionnaires and cognitive instruments — search,
          filter, and inspect canonical definitions.
        </p>
        {stats.data && (
          <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-1.5 text-sm">
            {([
              ['Questionnaires', stats.data.questionnaires],
              ['Questions', stats.data.questions],
              ['Options', stats.data.options],
              ['Languages', stats.data.languages],
            ] as const).map(([label, n]) => (
              <div key={label} className="flex items-baseline gap-1.5">
                <dd className="font-semibold tabular-nums text-ink">{n.toLocaleString()}</dd>
                <dt className="text-ink-soft">{label}</dt>
              </div>
            ))}
          </dl>
        )}
      </div>
      <div className="mb-4"><SearchModeToggle mode={mode} onChange={setMode} /></div>
      <div className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex-1">
          <SearchBar
            value={params.q ?? ''}
            onChange={(v) => setParam('q', v || undefined)}
            label={mode === 'questions' ? 'Search questions' : 'Search questionnaires'}
            placeholder={mode === 'questions' ? 'Search questions by their text…' : 'Search questionnaires…'}
          />
        </div>
        {mode === 'questionnaires' && <SortSelect value={params.sort} onChange={(v) => setParam('sort', v)} />}
      </div>
      {mode === 'questions' ? (
        <section className="min-w-0"><QuestionResults q={params.q} /></section>
      ) : (
        <>
          {groups.length > 0 && (
            <div className="mb-6">
              <MobileFilters groups={groups} selected={facetSelection} onToggle={toggleFacet} onClear={clearAll} />
            </div>
          )}
          <div className="flex gap-10">
            <FacetSidebar
              groups={groups}
              selected={facetSelection}
              onToggle={toggleFacet}
              onClear={clearAll}
            />
            <section className="min-w-0 flex-1">
              {list.isLoading && (
                <div className="space-y-6 pt-2">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full" />)}</div>
              )}
              {list.isError && (list.error instanceof ApiError && list.error.status === 422
                ? <ErrorState message="Invalid search or filter — try adjusting or clearing your filters." onRetry={clearAll} />
                : <ErrorState message="Could not load questionnaires." onRetry={() => list.refetch()} />)}
              {list.isSuccess && list.data.total === 0 && (
                <EmptyState message="No questionnaires match these filters." actionLabel="Clear filters" onAction={clearAll} />
              )}
              {list.isSuccess && list.data.total > 0 && (
                <>
                  <p className="mb-1 text-[11px] font-medium uppercase tracking-[0.12em] text-ink-faint">
                    {list.data.total} result{list.data.total === 1 ? '' : 's'}
                  </p>
                  <div>{list.data.items.map((g) => <CatalogueGroup key={g.instrument_id ?? g.forms[0].id} group={g} />)}</div>
                  <Pagination page={params.page} total={list.data.total} limit={limit} onPage={setPage} />
                </>
              )}
            </section>
          </div>
        </>
      )}
    </main>
  )
}
