import type { Questionnaire } from '../model/types'
import type { EntityBody } from '../model/types'

const DEFAULT_BASE = import.meta.env.VITE_LIBRARY_BASE_URL ?? 'https://questionnaire-library.vercel.app'

export interface FetchOpts { baseUrl?: string; fetchImpl?: typeof fetch }

export async function fetchFromLibrary(id: string, version: string, opts: FetchOpts = {}): Promise<Questionnaire> {
  const base = (opts.baseUrl ?? DEFAULT_BASE).replace(/\/+$/, '')
  const f = opts.fetchImpl ?? fetch
  const url = `${base}/v1/questionnaires/${id}/versions/${version}/definition?resolved=false`
  const res = await f(url)
  if (!res.ok) throw new Error(`Library fetch failed (${res.status}) for ${id}@${version}`)
  const obj = (await res.json()) as Questionnaire
  if (!obj?.metadata) throw new Error('Library returned a non-questionnaire payload')
  return obj
}

const PREFIX_TYPE: Record<string, string> = {
  pr: 'prompt', opt: 'option', it: 'item', q: 'question', msg: 'message',
  ctx: 'context', ins: 'instruction', ph: 'placeholder', help: 'help', rx: 'regex', sol: 'solution',
}

export function parseRef(ref: string): { type: string; id: string; version: string } | null {
  const at = ref.indexOf('@')
  if (at < 0) return null
  const id = ref.slice(0, at)
  const version = ref.slice(at + 1)
  const prefix = id.split('_')[0]
  const type = PREFIX_TYPE[prefix]
  if (!type || !id || !version) return null
  return { type, id, version }
}

export async function fetchEntityBody(ref: string, opts: FetchOpts = {}): Promise<EntityBody | null> {
  const parsed = parseRef(ref)
  if (!parsed) return null
  const base = (opts.baseUrl ?? DEFAULT_BASE).replace(/\/+$/, '')
  const f = opts.fetchImpl ?? fetch
  const url = `${base}/v1/entities/${parsed.type}/${parsed.id}/versions/${encodeURIComponent(parsed.version)}/definition`
  try {
    const res = await f(url)
    if (!res.ok) return null
    return (await res.json()) as EntityBody
  } catch {
    return null
  }
}

export interface EntitySearchResult { id: string; version: string; title: string | null; entity_type: string }

export async function searchEntities(etype: string, q: string, opts: FetchOpts = {}): Promise<{ items: EntitySearchResult[]; total: number }> {
  const base = (opts.baseUrl ?? DEFAULT_BASE).replace(/\/+$/, '')
  const f = opts.fetchImpl ?? fetch
  const url = `${base}/v1/entities/${etype}?q=${encodeURIComponent(q)}&limit=20`
  const res = await f(url)
  if (!res.ok) throw new Error(`Library search failed (${res.status}) for ${etype}`)
  const data = (await res.json()) as { items?: EntitySearchResult[]; total?: number }
  return { items: data.items ?? [], total: data.total ?? 0 }
}
