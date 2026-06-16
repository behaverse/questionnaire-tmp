import type { Questionnaire } from '../model/types'
import { collectRefs, type EntityBody } from './resolve'
import { mapLimit } from '../persistence/concurrency'

export type FetchEntity = (ref: string) => Promise<EntityBody | null>

const MAX_CONCURRENT = 5

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
    const bodies = await mapLimit(frontier, MAX_CONCURRENT, (ref) => fetchEntity(ref).catch(() => null))
    frontier.forEach((ref, i) => cache.set(ref, bodies[i]))
    const next = new Set<string>()
    for (const ref of frontier) {
      const body = cache.get(ref)
      if (body) collectRefs(body, next)
    }
    frontier = [...next].filter((r) => !cache.has(r))
  }
  return cache
}
