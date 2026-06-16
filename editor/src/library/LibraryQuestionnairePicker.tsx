import { useEffect, useRef, useState } from 'react'
import { searchQuestionnaires as realSearch, type QuestionnaireResult } from '../persistence/library'

export function LibraryQuestionnairePicker({ onPick, onClose, search = realSearch }: {
  onPick: (id: string, version: string) => void
  onClose: () => void
  search?: (q: string) => Promise<QuestionnaireResult[]>
}) {
  const [q, setQ] = useState('')
  const [items, setItems] = useState<QuestionnaireResult[]>([])
  const [error, setError] = useState<string | null>(null)
  const tRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    if (!q) { setItems([]); return }
    clearTimeout(tRef.current)
    tRef.current = setTimeout(() => {
      search(q).then((r) => { setItems(r); setError(null) }).catch(() => setError('Library unavailable'))
    }, 300)
    return () => clearTimeout(tRef.current)
  }, [q, search])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div className="max-h-[80vh] w-[640px] overflow-hidden rounded-lg bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 border-b border-slate-200 p-3">
          <strong className="text-sm">Open a questionnaire from the Library</strong>
          <button onClick={onClose} className="ml-auto text-slate-400 hover:text-slate-700">✕</button>
        </div>
        <div className="p-3">
          <input aria-label="Search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search questionnaires…"
                 className="w-full rounded border border-slate-300 px-2 py-1 text-sm" />
          <div className="mt-1 text-xs text-slate-400">Searches title &amp; description.</div>
          {error && <div className="mt-2 text-sm text-red-600">{error}</div>}
          <ul className="mt-2 max-h-72 overflow-auto">
            {items.map((it) => (
              <li key={`${it.id}@${it.version}`}>
                <button onClick={() => onPick(it.id, it.version)}
                        className="flex w-full items-center gap-2 rounded px-2 py-1 text-left text-sm hover:bg-slate-50">
                  <span className="font-mono">{it.id}</span>
                  {it.title && <span className="truncate text-slate-500">{it.title}</span>}
                  <span className="ml-auto text-xs text-slate-400">{it.version}</span>
                </button>
              </li>
            ))}
            {q && items.length === 0 && !error && <li className="px-2 py-1 text-sm text-slate-400">No results.</li>}
          </ul>
        </div>
      </div>
    </div>
  )
}
