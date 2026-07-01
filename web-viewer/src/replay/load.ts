import type { Runtime } from '../renderer/types'
import type { BdmEvent } from '../app/events'
import type { MouseSample } from '../app/mouseCapture'

export type ReplayBundle = { runtime: Runtime; statements: BdmEvent[]; mouse?: MouseSample[] }
export type LoadResult = { ok: true; bundle: ReplayBundle } | { ok: false; error: string }

export async function loadBundle(src: string, fetchImpl: typeof fetch = fetch.bind(globalThis)): Promise<LoadResult> {
  let resp: Response
  try { resp = await fetchImpl(src) } catch { return { ok: false, error: 'could not fetch the replay source' } }
  if (!resp.ok) return { ok: false, error: `replay source returned ${resp.status}` }
  let body: unknown
  try { body = await resp.json() } catch { return { ok: false, error: 'replay source is not valid JSON' } }
  const b = body as Partial<ReplayBundle>
  if (!b || typeof b.runtime !== 'object' || !b.runtime || !Array.isArray(b.statements)) {
    return { ok: false, error: 'not a replay bundle (needs runtime + statements)' }
  }
  return { ok: true, bundle: { runtime: b.runtime as Runtime, statements: b.statements as BdmEvent[], mouse: Array.isArray(b.mouse) ? (b.mouse as MouseSample[]) : undefined } }
}
