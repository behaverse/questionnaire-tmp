// editor/src/library/browser/LibraryBrowser.tsx
import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, Check, RefreshCw } from 'lucide-react'
import { parseRef } from '../../persistence/library'
import { saveLibrarySession, loadLibrarySession } from '../../persistence/indexeddb'
import { downloadContribution, type EditedEntity } from './contribution'
import { defaultLibraryClient, type LibraryClient } from './client'
import { LibraryEntityList } from './LibraryEntityList'
import { EntityInspector } from './EntityInspector'

type Body = Record<string, unknown>

export function LibraryBrowser({ onExit, client }: { onExit: () => void; client?: LibraryClient }) {
  const c = useMemo(() => client ?? defaultLibraryClient(), [client])
  const [selected, setSelected] = useState<string | null>(null)
  const [bodies, setBodies] = useState<Record<string, Body>>({})       // working copies (edited)
  const originals = useRef<Record<string, Body>>({})                    // as-fetched, for change detection
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const [saved, setSaved] = useState(true)
  const restored = useRef(false)

  // restore an in-progress session on mount
  useEffect(() => {
    let alive = true
    void loadLibrarySession().then((s) => { if (alive && s && !restored.current) { restored.current = true; originals.current = structuredClone(s.bodies); setBodies(s.bodies) } })
    return () => { alive = false }
  }, [])

  // fetch the selected entity into the session if we don't already hold it
  useEffect(() => {
    if (!selected || bodies[selected]) { setErr(''); setLoading(false); return }
    let alive = true
    setLoading(true); setErr('')
    c.fetchEntityBody(selected)
      .then((b) => { if (alive && b) { originals.current[selected] = structuredClone(b); setBodies((prev) => ({ ...prev, [selected]: b })); setLoading(false) }
                     else if (alive) { setErr('Entity not found.'); setLoading(false) } })
      .catch(() => { if (alive) { setErr('Could not load this entity.'); setLoading(false) } })
    return () => { alive = false }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, c])

  // autosave the session (debounced) on edit
  useEffect(() => {
    if (Object.keys(bodies).length === 0) return
    const t = setTimeout(() => { void saveLibrarySession({ bodies, savedAt: Date.now() }).then(() => setSaved(true)) }, 500)
    return () => clearTimeout(t)
  }, [bodies])

  const onChange = (next: Body) => {
    if (!selected) return
    if (!originals.current[selected]) originals.current[selected] = structuredClone(bodies[selected] ?? next)
    setSaved(false)
    setBodies((prev) => ({ ...prev, [selected]: next }))
  }

  const edited: EditedEntity[] = Object.entries(bodies)
    .filter(([ref, b]) => originals.current[ref] && JSON.stringify(b) !== JSON.stringify(originals.current[ref]))
    .map(([ref, b]) => { const p = parseRef(ref); return { id: p?.id ?? ref, version: p?.version ?? '', type: p?.type ?? 'entity', body: b } })

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-ed-surface">
      <div className="flex items-center gap-3 border-b border-ed-border bg-ed-panel px-4 py-2.5 text-sm">
        <button onClick={onExit} aria-label="Back" className="flex items-center gap-1 text-ed-muted hover:text-ed-text">
          <ArrowLeft size={16} aria-hidden="true" /> Back
        </button>
        <span className="font-semibold text-ed-text">Library entities</span>
        {(edited.length > 0 || !saved) && (
          <span className={`flex items-center gap-1 text-xs ${saved ? 'text-ed-muted' : 'text-amber-600'}`}
                title="Edits autosave to this browser. Use &ldquo;Download contribution&rdquo; to export them.">
            {saved ? <><Check size={12} aria-hidden="true" /> Saved</> : <><RefreshCw size={12} className="animate-spin" aria-hidden="true" /> Saving…</>}
          </span>
        )}
        {edited.length > 0 && (
          <button onClick={() => downloadContribution(edited, new Date().toISOString())}
                  className="ml-auto rounded-md bg-ed-accent px-3 py-1 text-xs font-medium text-white">Download contribution ({edited.length})</button>
        )}
      </div>
      <div className="flex min-h-0 flex-1">
        <div className="w-80 shrink-0 border-r border-ed-border bg-ed-surface"><LibraryEntityList client={c} selectedRef={selected} onSelect={setSelected} /></div>
        <div className="min-w-0 flex-1 overflow-auto"><EntityInspector refStr={selected} body={selected ? bodies[selected] ?? null : null} loading={loading} err={err} onChange={onChange} /></div>
      </div>
    </div>
  )
}
