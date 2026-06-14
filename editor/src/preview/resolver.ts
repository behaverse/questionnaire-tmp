import type { Questionnaire } from '../model/types'
import { collectRefs, type EntityBody } from './resolve'

export type FetchEntity = (ref: string) => Promise<EntityBody | null>

/** Resolve every ref in the model (transitively, following refs inside fetched
 *  bodies), memoised in `cache` keyed by `ref@version`. Never throws; an
 *  unresolvable ref is cached as null. */
export async function resolveEntities(
  model: Questionnaire,
  fetchEntity: FetchEntity,
  cache: Map<string, EntityBody | null> = new Map(),
): Promise<Map<string, EntityBody | null>> {
  let frontier = [...collectRefs(model)].filter((r) => !cache.has(r))
  while (frontier.length) {
    await Promise.all(frontier.map(async (ref) => { cache.set(ref, await fetchEntity(ref)) }))
    const next = new Set<string>()
    for (const ref of frontier) {
      const body = cache.get(ref)
      if (body) collectRefs(body, next)
    }
    frontier = [...next].filter((r) => !cache.has(r))
  }
  return cache
}
