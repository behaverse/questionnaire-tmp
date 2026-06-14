import { makePoolFetcher } from './poolFetcher'

test('pool-first: returns the pool body without hitting the library', async () => {
  let libCalls = 0
  const lib = (async () => { libCalls++; return null }) as never
  const f = makePoolFetcher(() => ({ 'pr_x@v1': { id: 'pr_x' } }), lib)
  expect(await f('pr_x@v1')).toEqual({ id: 'pr_x' })
  expect(libCalls).toBe(0)
})

test('falls back to the library for non-pool refs', async () => {
  const lib = (async (ref: string) => ({ id: ref })) as never
  const f = makePoolFetcher(() => ({}), lib)
  expect(await f('pr_y@v1')).toEqual({ id: 'pr_y@v1' })
})
