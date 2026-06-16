import { useEffect, useRef, useState } from 'react'
import { searchEntities as realSearch, fetchEntityBody as realFetchBody, type EntitySearchResult } from '../persistence/library'
import { buildRef, bodySnippet } from './picker'
import type { EntityBody } from '../model/types'

export interface PickerClient {
  searchEntities: (etype: string, q: string) => Promise<{ items: EntitySearchResult[]; total: number }>
  fetchEntityBody: (ref: string) => Promise<EntityBody | null>
}
const defaultClient: PickerClient = {
  searchEntities: (etype, q) => realSearch(etype, q),
  fetchEntityBody: (ref) => realFetchBody(ref),
}

export function LibraryPicker({ etype, locale, onPick, onClose, client = defaultClient }: {
  etype: string; locale: string; onPick: (ref: string) => void; onClose: () => void; client?: PickerClient
}) {
  const [q, setQ] = useState('')
  const [items, setItems] = useState<EntitySearchResult[]>([])
  const [selected, setSelected] = useState<EntitySearchResult | null>(null)
  const [snippet, setSnippet] = useState('')
  const [error, setError] = useState<string | null>(null)
  const tRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    if (!q) { setItems([]); return }
    clearTimeout(tRef.current)
    tRef.current = setTimeout(() => {
      client.searchEntities(etype, q).then((r) => { setItems(r.items); setError(null) })
        .catch(() => setError('Library unavailable'))
    }, 300)
    return () => clearTimeout(tRef.current)
  }, [q, etype, client])

  const select = (it: EntitySearchResult) => {
    setSelected(it); setSnippet('')
    client.fetchEntityBody(buildRef(it.id, it.version)).then((b) => setSnippet(bodySnippet(b, locale))).catch(() => setSnippet(''))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div className="max-h-[80vh] w-[640px] overflow-hidden rounded-lg bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 border-b border-slate-200 p-3">
          <strong className="text-sm">Pick {etype} from Library</strong>
          <button onClick={onClose} className="ml-auto text-slate-400 hover:text-slate-700">✕</button>
        </div>
        <div className="p-3">
          <input aria-label="Search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Search ${etype}s…`}
                 className="w-full rounded border border-slate-300 px-2 py-1 text-sm" />
          <div className="mt-1 text-xs text-slate-400">Searches title &amp; description.</div>
          {error && <div className="mt-2 text-sm text-red-600">{error}</div>}
          <ul className="mt-2 max-h-60 overflow-auto">
            {items.map((it) => (
              <li key={`${it.id}@${it.version}`}>
                <button onClick={() => select(it)}
                        className={`flex w-full items-center gap-2 rounded px-2 py-1 text-left text-sm ${selected?.id === it.id ? 'bg-slate-100' : 'hover:bg-slate-50'}`}>
                  <span className="font-mono">{it.id}</span>
                  {it.title && <span className="truncate text-slate-500">{it.title}</span>}
                  <span className="ml-auto text-xs text-slate-400">{it.version}</span>
                </button>
              </li>
            ))}
            {q && items.length === 0 && !error && <li className="px-2 py-1 text-sm text-slate-400">No results.</li>}
          </ul>
          {selected && (
            <div className="mt-3 rounded border border-slate-200 bg-slate-50 p-2 text-sm">
              <div className="text-xs uppercase tracking-wide text-slate-400">Preview ({locale})</div>
              <div className="mt-1">{snippet || <span className="text-slate-400">…</span>}</div>
              <button onClick={() => onPick(buildRef(selected.id, selected.version))}
                      className="mt-2 rounded bg-slate-800 px-3 py-1 text-sm text-white">Insert {selected.id}@{selected.version}</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
