// editor/src/library/browser/LibraryBrowser.tsx
import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, Check, RefreshCw } from 'lucide-react'
import { parseRef } from '../../persistence/library'
import { saveLibrarySession, loadLibrarySession } from '../../persistence/indexeddb'
import { downloadContribution, type EditedEntity } from './contribution'
import { defaultLibraryClient, type LibraryClient } from './client'
import { LibraryEntityList } from './LibraryEntityList'
import { EntityInspector } from './EntityInspector'
import { loadUntranslated } from '../../translate/workbench/load'
import { entityFields } from '../../translate/workbench/fields'
import { applyTranslation, applyStatus } from '../../translate/apply'
import { translateText } from '../../translate/translateClient'
import type { TransKind } from '../../translate/types'

type Body = Record<string, unknown>

export function LibraryBrowser({ onExit, client, translate = translateText }: { onExit: () => void; client?: LibraryClient; translate?: typeof translateText }) {
  const c = useMemo(() => client ?? defaultLibraryClient(), [client])
  const [selected, setSelected] = useState<string | null>(null)
  const [etype, setEtype] = useState('prompt')
  const [bodies, setBodies] = useState<Record<string, Body>>({})       // working copies (edited)
  const originals = useRef<Record<string, Body>>({})                    // as-fetched, for change detection
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const [saved, setSaved] = useState(true)
  const restored = useRef(false)

  const [batchSource, setBatchSource] = useState('en')
  const [batchTarget, setBatchTarget] = useState('')
  const [batching, setBatching] = useState(false)

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

  const batch = async () => {
    const tgt = batchTarget.trim(), srcL = batchSource.trim()
    if (!tgt || tgt === srcL) return
    setBatching(true)
    try {
      const wb = { listEntities: (et: string) => c.listEntities(et).then((r) => r.map((e) => ({ id: e.id, version: e.version }))), fetchEntityBody: c.fetchEntityBody }
      const { items } = await loadUntranslated(etype as TransKind, srcL, tgt, wb)
      for (const it of items) {
        const ref = `${it.id}@${it.version}`
        let b = (bodies[ref] ?? it.body) as Body
        const sf = entityFields(b, etype as TransKind, srcL)
        const tf = entityFields(b, etype as TransKind, tgt)
        for (let i = 0; i < sf.length; i++) {
          if (sf[i].value.trim() && !(tf[i]?.value.trim())) {
            try { b = applyTranslation(b, etype as TransKind, sf[i].field, tgt, await translate(sf[i].value, srcL, tgt, etype as TransKind)) as Body } catch { /* skip */ }
          }
        }
        b = applyStatus(b, etype as TransKind, tgt, (b.content as Record<string, { status?: string }>)[tgt]?.status ?? 'draft') as Body
        if (!originals.current[ref]) originals.current[ref] = it.body
        setBodies((prev) => ({ ...prev, [ref]: b })); setSaved(false)
      }
    } finally { setBatching(false) }
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
        <div className="ml-auto flex items-center gap-2">
          <label className="flex items-center gap-1 text-xs text-ed-muted">
            Src
            <input aria-label="Batch source locale" value={batchSource} onChange={(e) => setBatchSource(e.target.value)}
                   className="w-12 rounded-md border border-ed-border-strong bg-ed-surface px-2 py-1 text-xs" />
          </label>
          <input aria-label="Batch target locale" value={batchTarget} onChange={(e) => setBatchTarget(e.target.value)}
                 placeholder="target…"
                 className="w-20 rounded-md border border-ed-border-strong bg-ed-surface px-2 py-1 text-xs" />
          <button onClick={() => void batch()} disabled={batching || !batchTarget.trim()}
                  className="rounded-md border border-ed-border-strong bg-ed-surface px-3 py-1 text-xs font-medium text-ed-text hover:bg-ed-subtle disabled:opacity-40">
            {batching ? '…' : `Batch translate ${etype} → ${batchTarget || '…'}`}
          </button>
          {edited.length > 0 && (
            <button onClick={() => downloadContribution(edited, new Date().toISOString())}
                    className="rounded-md bg-ed-accent px-3 py-1 text-xs font-medium text-white">Download contribution ({edited.length})</button>
          )}
        </div>
      </div>
      <div className="flex min-h-0 flex-1">
        <div className="w-80 shrink-0 border-r border-ed-border bg-ed-surface"><LibraryEntityList client={c} etype={etype} onEtype={setEtype} selectedRef={selected} onSelect={setSelected} /></div>
        <div className="min-w-0 flex-1 overflow-auto"><EntityInspector refStr={selected} body={selected ? bodies[selected] ?? null : null} loading={loading} err={err} onChange={onChange} translate={translate} /></div>
      </div>
    </div>
  )
}
