import type { Questionnaire } from '../model/types'

const DEFAULT_BASE = import.meta.env.VITE_LIBRARY_BASE_URL ?? 'https://questionnaire-library.vercel.app'

export interface FetchOpts { baseUrl?: string; fetchImpl?: typeof fetch }

export async function fetchFromLibrary(id: string, version: string, opts: FetchOpts = {}): Promise<Questionnaire> {
  const base = opts.baseUrl ?? DEFAULT_BASE
  const f = opts.fetchImpl ?? fetch
  const url = `${base}/v1/questionnaires/${id}/versions/${version}/definition?resolved=false`
  const res = await f(url)
  if (!res.ok) throw new Error(`Library fetch failed (${res.status}) for ${id}@${version}`)
  const obj = (await res.json()) as Questionnaire
  if (!obj?.metadata) throw new Error('Library returned a non-questionnaire payload')
  return obj
}
