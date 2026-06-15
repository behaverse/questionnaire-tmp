import type { Questionnaire, EntityBody } from '../model/types'
import { collectRefs } from '../preview/resolve'

/** Refs in the model that are NOT pool drafts (pool keys) — i.e. Library pins. */
export function collectLibraryRefs(model: Questionnaire, pool: Record<string, EntityBody>): string[] {
  return [...collectRefs(model)].filter((ref) => !(ref in pool))
}

const VER = /^v(\d{2})\.(\d{4})(\.dev\d+)?$/

/** True iff `latest` is a strictly-newer published CalVer than `pinned`. A `.devN`
 *  pinned ref (a draft, not a Library pin) is never stale; malformed → false. */
export function isNewer(latest: string, pinned: string): boolean {
  const l = VER.exec(latest)
  const p = VER.exec(pinned)
  if (!l || !p) return false
  if (p[3]) return false // pinned is a draft
  const ly = +l[1], lm = +l[2], py = +p[1], pm = +p[2]
  return ly > py || (ly === py && lm > pm)
}

/** From the refs + a `ref → latestVersion|null` map, keep only the stale ones
 *  as `{ "<id>@<pinnedVer>": "<latestVer>" }`. */
export function staleSet(refs: string[], latestByKey: Record<string, string | null>): Record<string, string> {
  const out: Record<string, string> = {}
  for (const ref of refs) {
    const at = ref.lastIndexOf('@')
    if (at < 0) continue
    const pinned = ref.slice(at + 1)
    const latest = latestByKey[ref]
    if (latest && isNewer(latest, pinned)) out[ref] = latest
  }
  return out
}
