import { useEffect, useMemo, useState } from 'react'
import { listAllQuestionnaires as realList, type QuestionnaireResult } from '../persistence/library'

export function LibraryQuestionnairePicker({ onPick, onClose, list = realList }: {
  onPick: (id: string, version: string) => void
  onClose: () => void
  list?: () => Promise<QuestionnaireResult[]>
}) {
  const [q, setQ] = useState('')
  const [all, setAll] = useState<QuestionnaireResult[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load the full catalogue once; the field filters it client-side (title/id substring).
  useEffect(() => {
    let ignore = false
    setLoading(true)
    list()
      .then((r) => { if (!ignore) { setAll(r); setError(null); setLoading(false) } })
      .catch(() => { if (!ignore) { setError('Library unavailable'); setLoading(false) } })
    return () => { ignore = true }
  }, [list])

  const items = useMemo(() => {
    const ql = q.trim().toLowerCase()
    if (!ql) return all
    return all.filter((it) =>
      it.id.toLowerCase().includes(ql) ||
      (it.title ?? '').toLowerCase().includes(ql) ||
      (it.instrument_id ?? '').toLowerCase().includes(ql))
  }, [q, all])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="max-h-[80vh] w-[640px] overflow-hidden rounded-lg bg-ed-panel shadow-xl">
        <div className="flex items-center gap-2 border-b border-ed-border p-3">
          <strong className="text-sm">Open a questionnaire from the Library</strong>
          <button onClick={onClose} className="ml-auto text-ed-muted hover:text-ed-text">✕</button>
        </div>
        <div className="p-3">
          <input autoFocus aria-label="Search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter questionnaires…"
                 className="w-full rounded border border-ed-border-strong px-2 py-1 text-sm" />
          <div className="mt-1 flex items-center justify-between text-xs text-ed-muted">
            <span>Filter by title or id.</span>
            <span>{loading ? 'loading…' : `${items.length}${q ? ` of ${all.length}` : ''} questionnaire${items.length === 1 ? '' : 's'}`}</span>
          </div>
          {error && <div className="mt-2 text-sm text-red-600">{error}</div>}
          <ul className="mt-2 max-h-72 overflow-auto">
            {items.map((it) => (
              <li key={`${it.id}@${it.version}`}>
                <button onClick={() => onPick(it.id, it.version)}
                        className="flex w-full items-center gap-2 rounded px-2 py-1 text-left text-sm hover:bg-ed-subtle">
                  {it.title && <span className="truncate">{it.title}</span>}
                  <span className="font-mono text-xs text-ed-muted">{it.id}</span>
                  <span className="ml-auto text-xs text-ed-muted">{it.version}</span>
                </button>
              </li>
            ))}
            {!loading && items.length === 0 && !error && (
              <li className="px-2 py-1 text-sm text-ed-muted">{all.length === 0 ? 'No questionnaires in the Library.' : 'No matches.'}</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  )
}
