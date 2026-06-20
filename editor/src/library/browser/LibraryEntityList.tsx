// editor/src/library/browser/LibraryEntityList.tsx
import { useEffect, useState } from 'react'
import { LIBRARY_TYPES, type LibraryClient, type LibEntity } from './client'

export function LibraryEntityList({ client, selectedRef, onSelect }: {
  client: LibraryClient
  selectedRef: string | null
  onSelect: (ref: string) => void
}) {
  const [etype, setEtype] = useState('prompt')
  const [items, setItems] = useState<LibEntity[]>([])
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const [query, setQuery] = useState('')

  useEffect(() => {
    let alive = true
    setLoading(true); setErr(''); setItems([])
    client.listEntities(etype)
      .then((r) => { if (alive) { setItems(r); setLoading(false) } })
      .catch(() => { if (alive) { setErr('Could not load entities from the Library.'); setLoading(false) } })
    return () => { alive = false }
  }, [etype, client])

  const q = query.trim().toLowerCase()
  const filtered = items.filter((it) => !q || it.id.toLowerCase().includes(q) || (it.title ?? '').toLowerCase().includes(q))

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-col gap-2 border-b border-ed-border bg-ed-panel px-3 py-2.5">
        <label className="flex items-center gap-1.5 text-xs text-ed-muted">Type
          <select aria-label="Entity type" value={etype} onChange={(e) => setEtype(e.target.value)}
                  className="flex-1 rounded-md border border-ed-border-strong bg-ed-surface px-2 py-1 text-xs">
            {LIBRARY_TYPES.map((t) => <option key={t.type} value={t.type}>{t.label}</option>)}
          </select>
        </label>
        <input aria-label="Search entities" value={query} onChange={(e) => setQuery(e.target.value)}
               placeholder="Search id / title…"
               className="rounded-md border border-ed-border-strong bg-ed-surface px-2.5 py-1 text-xs outline-none focus:border-ed-accent focus:ring-2 focus:ring-ed-accent-soft" />
      </div>
      <div className="flex-1 overflow-auto">
        {loading && <div className="p-3 text-xs text-ed-muted">Loading…</div>}
        {err && <div className="p-3 text-xs text-red-600">{err}</div>}
        {!loading && !err && filtered.length === 0 && <div className="p-3 text-xs text-ed-muted">No entities.</div>}
        {filtered.map((it) => {
          const ref = `${it.id}@${it.version}`
          const active = ref === selectedRef
          return (
            <button key={ref} onClick={() => onSelect(ref)}
                    className={`block w-full border-b border-ed-border px-3 py-2 text-left hover:bg-ed-subtle ${active ? 'bg-ed-accent-soft' : ''}`}>
              <div className="font-mono text-xs text-ed-text">{it.id}</div>
              <div className="flex items-center gap-2 text-[11px] text-ed-muted">
                <span>{it.version}</span>{it.title && <span className="truncate">· {it.title}</span>}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
