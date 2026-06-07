import { useCatalogueParams, type FacetKey } from '../catalogue/useCatalogueParams'
import { useQuestionnaires, useFacets } from '../api/queries'
import { ResultRow } from '../catalogue/ResultRow'
import { FacetSidebar, type FacetGroup } from '../catalogue/FacetSidebar'
import { SearchBar } from '../catalogue/SearchBar'
import { SortSelect } from '../catalogue/SortSelect'
import { Pagination } from '../catalogue/Pagination'
import { Skeleton } from '../components/Skeleton'
import { EmptyState } from '../components/EmptyState'
import { ErrorState } from '../components/ErrorState'

const FACET_DEFS: { key: FacetKey; title: string }[] = [
  { key: 'domain', title: 'Domain' },
  { key: 'population', title: 'Population' },
  { key: 'language', title: 'Language' },
  { key: 'license', title: 'License' },
]

export function CataloguePage() {
  const { params, offset, limit, setParam, toggleFacet, setPage, clearAll } = useCatalogueParams()
  const list = useQuestionnaires({
    q: params.q, domain: params.domain, population: params.population,
    language: params.language, license: params.license, sort: params.sort,
    limit, offset,
  })

  const domain = useFacets('domain')
  const population = useFacets('population')
  const language = useFacets('language')
  const license = useFacets('license')
  const facetData: Record<FacetKey, { value: string; count: number }[]> = {
    domain: domain.data?.values ?? [],
    population: population.data?.values ?? [],
    language: language.data?.values ?? [],
    license: license.data?.values ?? [],
  }
  const groups: FacetGroup[] = FACET_DEFS
    .map((d) => ({ key: d.key, title: d.title, values: facetData[d.key] }))
    .filter((g) => g.values.length > 0)

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-8 max-w-2xl">
        <h1 className="font-serif text-[28px] font-semibold leading-tight tracking-tightish text-ink sm:text-[34px]">
          Browse the catalogue
        </h1>
        <p className="mt-2 text-[15px] leading-relaxed text-ink-soft">
          A curated, read-only library of research questionnaires and cognitive instruments — search,
          filter, and inspect canonical definitions.
        </p>
      </div>
      <div className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex-1"><SearchBar value={params.q ?? ''} onChange={(v) => setParam('q', v || undefined)} /></div>
        <SortSelect value={params.sort} onChange={(v) => setParam('sort', v)} />
      </div>
      <div className="flex gap-10">
        <FacetSidebar
          groups={groups}
          selected={{ domain: params.domain, population: params.population, language: params.language, license: params.license }}
          onToggle={toggleFacet}
          onClear={clearAll}
        />
        <section className="min-w-0 flex-1">
          {list.isLoading && (
            <div className="space-y-6 pt-2">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full" />)}</div>
          )}
          {list.isError && <ErrorState message="Could not load questionnaires." onRetry={() => list.refetch()} />}
          {list.isSuccess && list.data.total === 0 && (
            <EmptyState message="No questionnaires match these filters." actionLabel="Clear filters" onAction={clearAll} />
          )}
          {list.isSuccess && list.data.total > 0 && (
            <>
              <p className="mb-1 text-[11px] font-medium uppercase tracking-[0.12em] text-ink-faint">
                {list.data.total} result{list.data.total === 1 ? '' : 's'}
              </p>
              <div>{list.data.items.map((c) => <ResultRow key={`${c.id}@${c.version}`} card={c} />)}</div>
              <Pagination page={params.page} total={list.data.total} limit={limit} onPage={setPage} />
            </>
          )}
        </section>
      </div>
    </main>
  )
}
