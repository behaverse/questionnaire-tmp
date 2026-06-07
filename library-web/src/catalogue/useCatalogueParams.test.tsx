import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { useCatalogueParams } from './useCatalogueParams'

const wrapper =
  (initial: string) =>
  ({ children }: { children: React.ReactNode }) =>
    <MemoryRouter initialEntries={[initial]}>{children}</MemoryRouter>

describe('useCatalogueParams', () => {
  it('reads params from the URL query string', () => {
    const { result } = renderHook(() => useCatalogueParams(), {
      wrapper: wrapper('/?q=phq&domain=depression&sort=recency&page=2'),
    })
    expect(result.current.params).toMatchObject({
      q: 'phq', domain: 'depression', sort: 'recency', page: 2,
    })
    expect(result.current.offset).toBe(20) // (page 2 - 1) * limit 20
  })

  it('setParam writes to the URL and resets page to 1', () => {
    const { result } = renderHook(() => useCatalogueParams(), {
      wrapper: wrapper('/?page=3'),
    })
    act(() => result.current.setParam('q', 'anxiety'))
    expect(result.current.params.q).toBe('anxiety')
    expect(result.current.params.page).toBe(1)
  })

  it('toggleFacet adds then removes a facet value', () => {
    const { result } = renderHook(() => useCatalogueParams(), { wrapper: wrapper('/') })
    act(() => result.current.toggleFacet('domain', 'depression'))
    expect(result.current.params.domain).toBe('depression')
    act(() => result.current.toggleFacet('domain', 'depression'))
    expect(result.current.params.domain).toBeUndefined()
  })

  it('setPage updates the page and offset', () => {
    const { result } = renderHook(() => useCatalogueParams(), { wrapper: wrapper('/') })
    act(() => result.current.setPage(3))
    expect(result.current.params.page).toBe(3)
    expect(result.current.offset).toBe(40) // (3 - 1) * 20
  })

  it('toggleFacet replaces a different selected value', () => {
    const { result } = renderHook(() => useCatalogueParams(), {
      wrapper: wrapper('/?domain=depression'),
    })
    act(() => result.current.toggleFacet('domain', 'anxiety'))
    expect(result.current.params.domain).toBe('anxiety') // replaced, not appended
  })

  it('clearAll resets everything', () => {
    const { result } = renderHook(() => useCatalogueParams(), {
      wrapper: wrapper('/?q=x&domain=y&page=4'),
    })
    act(() => result.current.clearAll())
    expect(result.current.params).toMatchObject({ page: 1 })
    expect(result.current.params.q).toBeUndefined()
    expect(result.current.params.domain).toBeUndefined()
  })
})
