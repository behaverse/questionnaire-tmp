import { useSearchParams } from 'react-router-dom'
import { useMemo, useCallback } from 'react'

export const LIMIT = 20

export type FacetKey = 'domain' | 'population' | 'language' | 'license'
export type ScalarKey = 'q' | 'sort'

export interface CatalogueParams {
  q?: string
  domain?: string
  population?: string
  language?: string
  license?: string
  sort?: string
  page: number
}

function read(sp: URLSearchParams): CatalogueParams {
  const page = Math.floor(Number(sp.get('page') ?? '1'))
  return {
    q: sp.get('q') || undefined,
    domain: sp.get('domain') || undefined,
    population: sp.get('population') || undefined,
    language: sp.get('language') || undefined,
    license: sp.get('license') || undefined,
    sort: sp.get('sort') || undefined,
    page: Number.isFinite(page) && page >= 1 ? page : 1,
  }
}

export function useCatalogueParams() {
  const [sp, setSp] = useSearchParams()
  const params = useMemo(() => read(sp), [sp])

  const write = useCallback(
    (mutate: (next: URLSearchParams) => void) => {
      const next = new URLSearchParams(sp)
      mutate(next)
      setSp(next, { replace: false })
    },
    [sp, setSp],
  )

  const setParam = useCallback(
    (key: ScalarKey | FacetKey, value: string | undefined) =>
      write((next) => {
        if (value) next.set(key, value)
        else next.delete(key)
        next.delete('page') // any filter/search change returns to page 1
      }),
    [write],
  )

  const toggleFacet = useCallback(
    (key: FacetKey, value: string) =>
      write((next) => {
        if (next.get(key) === value) next.delete(key)
        else next.set(key, value)
        next.delete('page')
      }),
    [write],
  )

  const setPage = useCallback(
    (page: number) => write((next) => next.set('page', String(page))),
    [write],
  )

  const clearAll = useCallback(() => setSp(new URLSearchParams(), { replace: false }), [setSp])

  return {
    params,
    offset: (params.page - 1) * LIMIT,
    limit: LIMIT,
    setParam,
    toggleFacet,
    setPage,
    clearAll,
  }
}
