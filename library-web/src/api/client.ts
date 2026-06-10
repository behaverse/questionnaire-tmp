/// <reference types="vite/client" />
import type {
  InstrumentGroup, Paginated, VersionInfo, FacetResponse, ResolvedDefinition,
} from './types'

// Default: same-origin (empty base → relative /v1 resolved against window.location.origin in get()).
// Production (Vercel) needs no env var. Local dev sets VITE_API_BASE_URL via .env.development → the API on :8000.
export const BASE_URL: string =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') ?? ''

export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message)
    this.name = 'ApiError'
  }
}

type Params = Record<string, string | number | boolean | undefined | null>

async function get<T>(path: string, params?: Params): Promise<T> {
  const url = new URL(BASE_URL + path, window.location.origin)
  if (params) for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null) url.searchParams.set(k, String(v))
  }
  const res = await fetch(url)
  if (!res.ok) {
    let code = 'error'
    let message = res.statusText
    try {
      const body = await res.json()
      code = body?.error?.code ?? code
      message = body?.error?.message ?? message
    } catch { /* non-JSON error body */ }
    throw new ApiError(res.status, code, message)
  }
  return (await res.json()) as T
}

export type QuestionnaireQuery = {
  q?: string; domain?: string; population?: string; language?: string; license?: string
  instrument?: string
  min_items?: number; max_items?: number; sort?: string; limit?: number; offset?: number
}

export function rawDefinitionUrl(id: string, version: string): string {
  return `${BASE_URL}/v1/questionnaires/${id}/versions/${version}/definition`
}

// Self-contained export: the definition with referenced entity content (item text, option
// labels, messages) inlined, so the downloaded file is readable/usable on its own.
export function resolvedDefinitionUrl(id: string, version: string): string {
  return `${rawDefinitionUrl(id, version)}?resolved=true`
}

export const api = {
  listQuestionnaires: (p: QuestionnaireQuery) =>
    get<Paginated<InstrumentGroup>>('/v1/questionnaires', p),
  resolvedDefinition: (id: string, version: string) =>
    get<ResolvedDefinition>(`/v1/questionnaires/${id}/versions/${version}/definition`, { resolved: true }),
  versions: (id: string) =>
    get<VersionInfo[]>(`/v1/questionnaires/${id}/versions`),
  facets: (facet_type: string) =>
    get<FacetResponse>('/v1/facets', { facet_type }),
}
