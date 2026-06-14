import type { EntityBody } from '../model/types'
import type { FetchEntity } from '../preview/resolver'
import { fetchEntityBody } from '../persistence/library'

/** A FetchEntity that resolves pool entities first (read fresh, never cached by
 *  the resolver caller for these — see PreviewPane), else the Library. */
export function makePoolFetcher(getPool: () => Record<string, EntityBody>, lib: FetchEntity = fetchEntityBody): FetchEntity {
  return async (ref) => getPool()[ref] ?? (await lib(ref))
}
