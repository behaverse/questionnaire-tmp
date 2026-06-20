import { listAllEntities, fetchEntityBody, type FetchOpts } from '../../persistence/library'
import { mapLimit } from '../../persistence/concurrency'
import { isUntranslated } from './fields'
import type { TransKind } from '../types'

export const WB_CAP = 300

export interface WbEntity { id: string; version: string; kind: TransKind; body: Record<string, unknown> }
export interface LoadResult { items: WbEntity[]; scanned: number; capped: boolean }
export interface WbClient {
  listEntities: (etype: string) => Promise<{ id: string; version: string }[]>
  fetchEntityBody: (ref: string) => Promise<Record<string, unknown> | null>
}

export async function loadUntranslated(
  kind: TransKind, source: string, target: string, client: WbClient, cap = WB_CAP,
): Promise<LoadResult> {
  const all = await client.listEntities(kind)
  const capped = all.length > cap
  const targets = all.slice(0, cap)
  const items: WbEntity[] = []
  await mapLimit(targets, 5, async (e) => {
    const body = await client.fetchEntityBody(`${e.id}@${e.version}`)
    if (body && isUntranslated(body, kind, source, target)) items.push({ id: e.id, version: e.version, kind, body })
  })
  return { items, scanned: targets.length, capped }
}

// real client backed by the read-only Library API (reuses the F7 fetchers)
export function defaultWbClient(opts: FetchOpts = {}): WbClient {
  return {
    listEntities: (etype) => listAllEntities(etype, opts).then((rs) => rs.map((r) => ({ id: r.id, version: r.version }))),
    fetchEntityBody: (ref) => fetchEntityBody(ref, opts) as Promise<Record<string, unknown> | null>,
  }
}
