import type { Questionnaire } from '../model/types'
import type { EntityBody } from '../model/types'
import { withRetry } from './concurrency'

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
  scr: 'scorer',
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
    return await withRetry(async () => {
      const res = await f(url)
      if (!res.ok) throw new Error(`Entity fetch failed (${res.status}) for ${ref}`)
      return (await res.json()) as EntityBody
    }, { retries: 1, backoffMs: 200 })
  } catch {
    return null
  }
}

export async function latestVersion(etype: string, id: string, opts: FetchOpts = {}): Promise<string | null> {
  const base = (opts.baseUrl ?? DEFAULT_BASE).replace(/\/+$/, '')
  const f = opts.fetchImpl ?? fetch
  try {
    const d = await withRetry(async () => {
      const res = await f(`${base}/v1/entities/${etype}/${id}`)
      if (!res.ok) throw new Error(`latestVersion fetch failed (${res.status}) for ${etype}/${id}`)
      return (await res.json()) as { version?: string }
    }, { retries: 1, backoffMs: 200 })
    return typeof d.version === 'string' ? d.version : null
  } catch {
    return null
  }
}

export interface EntitySearchResult { id: string; version: string; title: string | null; entity_type: string }

/** List all entities of a type (paged through, capped) for browse-and-filter pickers.
 *  The Library's full-text search only indexes title/description, and most entities have
 *  no title (it falls back to the id) — so client-side substring filtering over the full
 *  list is both more useful (matches descriptive ids like `opt_agreement_7`) and simpler. */
export async function listAllEntities(etype: string, opts: FetchOpts & { cap?: number } = {}): Promise<EntitySearchResult[]> {
  const base = (opts.baseUrl ?? DEFAULT_BASE).replace(/\/+$/, '')
  const f = opts.fetchImpl ?? fetch
  const cap = opts.cap ?? 500
  const pageSize = 100
  const out: EntitySearchResult[] = []
  for (let offset = 0; offset < cap; offset += pageSize) {
    const res = await f(`${base}/v1/entities/${etype}?limit=${pageSize}&offset=${offset}`)
    if (!res.ok) throw new Error(`Library list failed (${res.status}) for ${etype}`)
    const data = (await res.json()) as { items?: EntitySearchResult[]; total?: number }
    const items = data.items ?? []
    out.push(...items)
    if (items.length < pageSize || out.length >= (data.total ?? out.length)) break
  }
  return out
}

export async function searchEntities(etype: string, q: string, opts: FetchOpts = {}): Promise<{ items: EntitySearchResult[]; total: number }> {
  const base = (opts.baseUrl ?? DEFAULT_BASE).replace(/\/+$/, '')
  const f = opts.fetchImpl ?? fetch
  const url = `${base}/v1/entities/${etype}?q=${encodeURIComponent(q)}&limit=20`
  const res = await f(url)
  if (!res.ok) throw new Error(`Library search failed (${res.status}) for ${etype}`)
  const data = (await res.json()) as { items?: EntitySearchResult[]; total?: number }
  return { items: data.items ?? [], total: data.total ?? 0 }
}

export interface QuestionnaireResult { id: string; version: string; title: string | null; instrument_id: string | null }

export async function searchQuestionnaires(q: string, opts: FetchOpts = {}): Promise<QuestionnaireResult[]> {
  const base = (opts.baseUrl ?? DEFAULT_BASE).replace(/\/+$/, '')
  const f = opts.fetchImpl ?? fetch
  const url = `${base}/v1/questionnaires?q=${encodeURIComponent(q)}&limit=20`
  const res = await f(url)
  if (!res.ok) throw new Error(`Library questionnaire search failed (${res.status})`)
  const data = (await res.json()) as { items?: Array<{ instrument_id?: string; forms?: Array<{ id: string; version: string; title?: string | null }> }> }
  const out: QuestionnaireResult[] = []
  for (const group of data.items ?? []) {
    for (const form of group.forms ?? []) {
      out.push({ id: form.id, version: form.version, title: form.title ?? null, instrument_id: group.instrument_id ?? null })
    }
  }
  return out
}
