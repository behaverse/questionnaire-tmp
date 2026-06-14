import type { Questionnaire, EntityBody } from '../model/types'

const FALLBACK = 'v26.0609'

/** A draft entity version derived from the questionnaire's CalVer: strip any
 *  existing `.devN`, append `.dev1`. Falls back to the current schema CalVer. */
export function draftVersion(metadataVersion: string | undefined): string {
  const base = (metadataVersion ?? '').replace(/\.dev\d+$/, '')
  const clean = /^v\d{2}\.\d{4}$/.test(base) ? base : FALLBACK
  return `${clean}.dev1`
}

/** First free `<prefix>_new_<n>` not already used. */
export function mintEntityId(prefix: string, existingIds: Set<string>): string {
  let n = 1
  while (existingIds.has(`${prefix}_new_${n}`)) n++
  return `${prefix}_new_${n}`
}

/** Every entity id in play: `id` fields + `ref` ids (version stripped) in the
 *  model, plus pool keys (version stripped). Used for collision-free minting. */
export function collectIds(model: Questionnaire, pool: Record<string, EntityBody>): Set<string> {
  const ids = new Set<string>()
  JSON.stringify(model, (k, v) => {
    if (k === 'id' && typeof v === 'string') ids.add(v)
    if (k === 'ref' && typeof v === 'string') ids.add(v.split('@')[0])
    return v
  })
  for (const ref of Object.keys(pool)) ids.add(ref.split('@')[0])
  return ids
}
