import { useEffect, useMemo, useRef, useState } from 'react'
import { listAllEntities as realList, fetchEntityBody as realFetchBody, type EntitySearchResult } from '../persistence/library'
import { mapLimit, withRetry } from '../persistence/concurrency'
import { buildRef, bodySnippet, searchableText } from './picker'
import type { EntityBody } from '../model/types'

export interface PickerClient {
  listEntities: (etype: string) => Promise<EntitySearchResult[]>
  fetchEntityBody: (ref: string) => Promise<EntityBody | null>
}
const defaultClient: PickerClient = {
  listEntities: (etype) => realList(etype),
  fetchEntityBody: (ref) => realFetchBody(ref),
}

// Cap the per-etype content fetch so a large set (e.g. ~793 prompts) can't re-trigger the
// boot-time fetch storm; dedup-relevant types (options/contexts/instructions/messages) are
// all well under this. Cached per etype for the session.
const CONTENT_INDEX_CAP = 300
const CONTENT_CACHE = new Map<string, Record<string, string>>()

export function LibraryPicker({ etype, locale, onPick, onClose, onCreate, client = defaultClient }: {
  etype: string; locale: string; onPick: (ref: string) => void; onClose: () => void
  onCreate?: () => void; client?: PickerClient
}) {
  const [q, setQ] = useState('')
  const [all, setAll] = useState<EntitySearchResult[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<EntitySearchResult | null>(null)
  const [snippet, setSnippet] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [contentIndex, setContentIndex] = useState<Record<string, string>>({})
  const [indexing, setIndexing] = useState(false)
  const indexStarted = useRef(false)

  // re-index from scratch when the entity type changes
  useEffect(() => { indexStarted.current = false; setContentIndex({}) }, [etype])

  // Load the full list once; the search field filters it client-side.
  useEffect(() => {
    let ignore = false
    setLoading(true)
    client.listEntities(etype)
      .then((r) => { if (!ignore) { setAll(r); setError(null); setLoading(false) } })
      .catch(() => { if (!ignore) { setError('Library unavailable'); setLoading(false) } })
    return () => { ignore = true }
  }, [etype, client])

  // Content search: the list endpoint only returns id/title, so to match by CONTENT (prompt
  // text, scale anchors, …) we fetch entity bodies — lazily (only once the user searches),
  // throttled + retried (reusing the ED-G concurrency guard), capped, and cached per etype.
  useEffect(() => {
    if (!q.trim() || indexStarted.current || loading || all.length === 0) return
    indexStarted.current = true
    const cached = CONTENT_CACHE.get(etype)
    if (cached) { setContentIndex(cached); return }
    let ignore = false
    setIndexing(true)
    const acc: Record<string, string> = {}
    const targets = all.slice(0, CONTENT_INDEX_CAP)
    void mapLimit(targets, 5, async (it) => {
      try {
        const b = await withRetry(() => client.fetchEntityBody(buildRef(it.id, it.version)))
        acc[it.id] = searchableText(b as Record<string, unknown> | null)
        if (!ignore) setContentIndex({ ...acc })
      } catch { /* skip a failed body — id/title still searchable */ }
    }).then(() => { if (!ignore) { setIndexing(false); CONTENT_CACHE.set(etype, acc) } })
    return () => { ignore = true }
  }, [q, loading, all, etype, client])

  const items = useMemo(() => {
    const ql = q.trim().toLowerCase()
    if (!ql) return all
    return all.filter((it) =>
      it.id.toLowerCase().includes(ql) ||
      (it.title ?? '').toLowerCase().includes(ql) ||
      (contentIndex[it.id] ?? '').includes(ql))
  }, [q, all, contentIndex])

  const select = (it: EntitySearchResult) => {
    setSelected(it); setSnippet('')
    client.fetchEntityBody(buildRef(it.id, it.version)).then((b) => setSnippet(bodySnippet(b, locale))).catch(() => setSnippet(''))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="max-h-[80vh] w-[640px] overflow-hidden rounded-lg bg-ed-panel shadow-xl">
        <div className="flex items-center gap-2 border-b border-ed-border p-3">
          <strong className="text-sm">{onCreate ? `Add ${etype}` : `Pick ${etype} from Library`}</strong>
          <button onClick={onClose} className="ml-auto text-ed-muted hover:text-ed-text">✕</button>
        </div>
        <div className="p-3">
          <input autoFocus aria-label="Search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Search ${etype}s to reuse…`}
                 className="w-full rounded border border-ed-border-strong px-2 py-1 text-sm" />
          <div className="mt-1 flex items-center justify-between text-xs text-ed-muted">
            <span>{onCreate ? 'Search id, title, or content to reuse — or create new if nothing matches.' : 'Search by id, title, or content.'}</span>
            <span>{loading ? 'loading…' : indexing ? 'searching content…' : `${items.length}${q ? ` of ${all.length}` : ''} ${etype}${items.length === 1 ? '' : 's'}`}</span>
          </div>
          {q && all.length > CONTENT_INDEX_CAP && (
            <div className="mt-1 text-[11px] text-ed-muted">Content search covers the first {CONTENT_INDEX_CAP} {etype}s; refine by id for the rest.</div>
          )}
          {error && <div className="mt-2 text-sm text-red-600">{error}</div>}
          <ul className="mt-2 max-h-72 overflow-auto">
            {items.map((it) => (
              <li key={`${it.id}@${it.version}`}>
                <button onClick={() => select(it)}
                        className={`flex w-full items-center gap-2 rounded px-2 py-1 text-left text-sm ${selected?.id === it.id ? 'bg-ed-accent-soft text-ed-text' : 'hover:bg-ed-subtle'}`}>
                  <span className="font-mono">{it.id}</span>
                  {it.title && it.title !== it.id && <span className="truncate text-ed-muted">{it.title}</span>}
                  <span className="ml-auto text-xs text-ed-muted">{it.version}</span>
                </button>
              </li>
            ))}
            {!loading && items.length === 0 && !error && (
              <li className="px-2 py-3 text-sm">
                <div className="text-ed-muted">{all.length === 0 ? `No ${etype}s in the Library.` : `No ${etype} matches${q ? ` “${q}”` : ''}.`}</div>
                {onCreate && (
                  <button onClick={onCreate} className="mt-2 rounded bg-ed-accent px-3 py-1.5 text-sm text-white">+ Create new {etype}</button>
                )}
              </li>
            )}
          </ul>
          {selected && (
            <div className="mt-3 rounded border border-ed-border bg-ed-subtle p-2 text-sm">
              <div className="text-xs text-ed-muted">Preview ({locale})</div>
              <div className="mt-1">{snippet || <span className="text-ed-muted">…</span>}</div>
            </div>
          )}
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-ed-border p-3">
          <button onClick={onClose} className="rounded border border-ed-border-strong px-3 py-1 text-sm hover:bg-ed-subtle">Cancel</button>
          <button disabled={!selected} aria-label={selected ? `Insert ${selected.id}@${selected.version}` : 'Insert'}
                  onClick={() => selected && onPick(buildRef(selected.id, selected.version))}
                  className="rounded bg-ed-accent px-3 py-1 text-sm text-white disabled:opacity-40">Insert</button>
        </div>
      </div>
    </div>
  )
}
