import { useEffect, useMemo, useState } from 'react'
import { listAllEntities as realList, fetchEntityBody as realFetchBody, type EntitySearchResult } from '../persistence/library'
import { buildRef, bodySnippet } from './picker'
import type { EntityBody } from '../model/types'

export interface PickerClient {
  listEntities: (etype: string) => Promise<EntitySearchResult[]>
  fetchEntityBody: (ref: string) => Promise<EntityBody | null>
}
const defaultClient: PickerClient = {
  listEntities: (etype) => realList(etype),
  fetchEntityBody: (ref) => realFetchBody(ref),
}

export function LibraryPicker({ etype, locale, onPick, onClose, client = defaultClient }: {
  etype: string; locale: string; onPick: (ref: string) => void; onClose: () => void; client?: PickerClient
}) {
  const [q, setQ] = useState('')
  const [all, setAll] = useState<EntitySearchResult[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<EntitySearchResult | null>(null)
  const [snippet, setSnippet] = useState('')
  const [error, setError] = useState<string | null>(null)

  // Load the full list once; the search field filters it client-side (the server's
  // full-text search only indexes title/description, which most entities lack).
  useEffect(() => {
    let ignore = false
    setLoading(true)
    client.listEntities(etype)
      .then((r) => { if (!ignore) { setAll(r); setError(null); setLoading(false) } })
      .catch(() => { if (!ignore) { setError('Library unavailable'); setLoading(false) } })
    return () => { ignore = true }
  }, [etype, client])

  const items = useMemo(() => {
    const ql = q.trim().toLowerCase()
    if (!ql) return all
    return all.filter((it) => it.id.toLowerCase().includes(ql) || (it.title ?? '').toLowerCase().includes(ql))
  }, [q, all])

  const select = (it: EntitySearchResult) => {
    setSelected(it); setSnippet('')
    client.fetchEntityBody(buildRef(it.id, it.version)).then((b) => setSnippet(bodySnippet(b, locale))).catch(() => setSnippet(''))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="max-h-[80vh] w-[640px] overflow-hidden rounded-lg bg-ed-panel shadow-xl">
        <div className="flex items-center gap-2 border-b border-ed-border p-3">
          <strong className="text-sm">Pick {etype} from Library</strong>
          <button onClick={onClose} className="ml-auto text-ed-muted hover:text-ed-text">✕</button>
        </div>
        <div className="p-3">
          <input autoFocus aria-label="Search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Filter ${etype}s…`}
                 className="w-full rounded border border-ed-border-strong px-2 py-1 text-sm" />
          <div className="mt-1 flex items-center justify-between text-xs text-ed-muted">
            <span>Filter by id or title.</span>
            <span>{loading ? 'loading…' : `${items.length}${q ? ` of ${all.length}` : ''} ${etype}${items.length === 1 ? '' : 's'}`}</span>
          </div>
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
              <li className="px-2 py-1 text-sm text-ed-muted">{all.length === 0 ? `No ${etype}s in the Library.` : 'No matches.'}</li>
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
