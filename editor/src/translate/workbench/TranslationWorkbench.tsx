// editor/src/translate/workbench/TranslationWorkbench.tsx
import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, Check, RefreshCw } from 'lucide-react'
import { entityFields } from './fields'
import { loadUntranslated, defaultWbClient, type WbClient, type WbEntity, type LoadResult } from './load'
import { exportTranslations } from './export'
import { translateText } from '../translateClient'
import { applyTranslation, applyStatus } from '../apply'
import { mapLimit } from '../../persistence/concurrency'
import { saveWorkbench, loadWorkbench } from '../../persistence/indexeddb'
import type { TransKind } from '../types'

const KINDS: TransKind[] = ['prompt', 'option', 'context', 'instruction', 'message']
const STATUSES = ['draft', 'complete', 'validated']

export interface WorkbenchProps {
  onExit: () => void
  client?: WbClient
  translate?: typeof translateText
}

type Body = Record<string, unknown>
const statusOf = (body: Body, locale: string): string =>
  ((body.content as Record<string, { status?: string }> | undefined)?.[locale]?.status) ?? 'draft'

export function TranslationWorkbench({ onExit, client, translate = translateText }: WorkbenchProps) {
  const wbClient = useMemo(() => client ?? defaultWbClient(), [client])
  const [kind, setKind] = useState<TransKind>('prompt')
  const [source, setSource] = useState('en')
  const [target, setTarget] = useState('')
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadErr, setLoadErr] = useState('')
  const [result, setResult] = useState<LoadResult | null>(null)
  const [bodies, setBodies] = useState<Record<string, Body>>({}) // id → working body
  const [busy, setBusy] = useState<Record<string, boolean>>({})
  const [rowErr, setRowErr] = useState<Record<string, string>>({})
  const [bump, setBump] = useState<Record<string, number>>({})
  const [saved, setSaved] = useState(true)
  const restored = useRef(false)

  // Restore a persisted session on mount (so in-progress translations + status survive reload).
  useEffect(() => {
    let alive = true
    void loadWorkbench().then((s) => {
      if (!alive || !s || restored.current) return
      restored.current = true
      setKind(s.kind as TransKind); setSource(s.source); setTarget(s.target)
      setResult({ items: s.items as WbEntity[], scanned: s.items.length, capped: false })
      setBodies(s.bodies)
    })
    return () => { alive = false }
  }, [])

  // Autosave the session (debounced) whenever the translations change.
  useEffect(() => {
    if (!result) return
    const t = setTimeout(() => {
      void saveWorkbench({
        kind, source: source.trim(), target: target.trim(),
        items: result.items.map((e) => ({ id: e.id, version: e.version, kind: e.kind, body: e.body })),
        bodies, savedAt: Date.now(),
      }).then(() => setSaved(true))
    }, 500)
    return () => clearTimeout(t)
  }, [bodies, result, kind, source, target])

  const canLoad = !!target.trim() && target.trim() !== source.trim() && !loading

  const load = async () => {
    setLoading(true); setLoadErr(''); setResult(null)
    try {
      const r = await loadUntranslated(kind, source.trim(), target.trim(), wbClient)
      setResult(r)
      const map: Record<string, Body> = {}
      for (const e of r.items) map[e.id] = e.body
      setBodies(map)
    } catch {
      setLoadErr('Could not load entities from the Library.')
    } finally {
      setLoading(false)
    }
  }

  const rowKey = (id: string, fi: number) => `${id}#${fi}`

  const writeField = (e: WbEntity, fieldIdx: number, value: string) => {
    const fields = entityFields(bodies[e.id] ?? e.body, kind, target.trim())
    const f = fields[fieldIdx]
    if (!f) return
    setSaved(false)
    setBodies((prev) => {
      let body = prev[e.id] ?? e.body
      body = applyTranslation(body, kind, f.field, target.trim(), value) as Body
      // keep the entity's status unless it's been explicitly set — default new edits to draft
      if (statusOf(body, target.trim()) === 'draft') body = applyStatus(body, kind, target.trim(), 'draft') as Body
      return { ...prev, [e.id]: body }
    })
  }

  const setEntityStatus = (e: WbEntity, status: string) => {
    setSaved(false)
    setBodies((prev) => ({ ...prev, [e.id]: applyStatus(prev[e.id] ?? e.body, kind, target.trim(), status) as Body }))
  }

  const autoField = async (e: WbEntity, fieldIdx: number) => {
    const src = entityFields(bodies[e.id] ?? e.body, kind, source.trim())[fieldIdx]
    if (!src || !src.value.trim()) return
    const k = rowKey(e.id, fieldIdx)
    setBusy((b) => ({ ...b, [k]: true })); setRowErr((x) => ({ ...x, [k]: '' }))
    try {
      const out = await translate(src.value, source.trim(), target.trim(), kind)
      writeField(e, fieldIdx, out)
      setBump((m) => ({ ...m, [k]: (m[k] ?? 0) + 1 }))
    } catch {
      setRowErr((x) => ({ ...x, [k]: 'failed' }))
    } finally {
      setBusy((b) => ({ ...b, [k]: false }))
    }
  }

  const autoAll = async () => {
    if (!result) return
    const pending: { e: WbEntity; fi: number }[] = []
    for (const e of visibleItems) {
      const src = entityFields(bodies[e.id] ?? e.body, kind, source.trim())
      const tgt = entityFields(bodies[e.id] ?? e.body, kind, target.trim())
      src.forEach((sf, fi) => { if (sf.value.trim() && !(tgt[fi]?.value.trim())) pending.push({ e, fi }) })
    }
    await mapLimit(pending, 4, ({ e, fi }) => autoField(e, fi))
  }

  const doExport = () => {
    if (!result) return
    const items = result.items.map((e) => ({ id: e.id, version: e.version, kind, body: bodies[e.id] ?? e.body }))
    exportTranslations(target.trim(), items, new Date().toISOString())
  }

  // search filter: match on entity id, source text, or current translation
  const q = query.trim().toLowerCase()
  const visibleItems = (result?.items ?? []).filter((e) => {
    if (!q) return true
    if (e.id.toLowerCase().includes(q)) return true
    const body = bodies[e.id] ?? e.body
    const texts = [...entityFields(body, kind, source.trim()), ...entityFields(body, kind, target.trim())]
    return texts.some((f) => f.value.toLowerCase().includes(q))
  })

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-ed-border bg-ed-panel px-4 py-2.5 text-sm">
        <button onClick={onExit} aria-label="Back" className="flex items-center gap-1 text-ed-muted hover:text-ed-text">
          <ArrowLeft size={16} aria-hidden="true" /> Back
        </button>
        <span className="font-semibold text-ed-text">Translate Library entities</span>
        {result && (
          <span className={`flex items-center gap-1 text-xs ${saved ? 'text-ed-muted' : 'text-amber-600'}`}
                title="Translations autosave to this browser. Use “Download translations” to export a contribution file.">
            {saved ? <><Check size={12} aria-hidden="true" /> Saved</> : <><RefreshCw size={12} className="animate-spin" aria-hidden="true" /> Saving…</>}
          </span>
        )}
        <label className="flex items-center gap-1 text-xs text-ed-muted">Type
          <select aria-label="Entity type" value={kind} onChange={(e) => setKind(e.target.value as TransKind)}
                  className="rounded-md border border-ed-border-strong bg-ed-surface px-1.5 py-1 text-xs">
            {KINDS.map((k) => <option key={k} value={k}>{k}</option>)}
          </select>
        </label>
        <label className="flex items-center gap-1 text-xs text-ed-muted">From
          <input aria-label="Source language" value={source} onChange={(e) => setSource(e.target.value)}
                 className="w-16 rounded-md border border-ed-border-strong bg-ed-surface px-1.5 py-1 text-xs" />
        </label>
        <label className="flex items-center gap-1 text-xs text-ed-muted">To
          <input aria-label="Target language" value={target} onChange={(e) => setTarget(e.target.value)} placeholder="e.g. fr"
                 className="w-16 rounded-md border border-ed-border-strong bg-ed-surface px-1.5 py-1 text-xs" />
        </label>
        <button onClick={() => void load()} disabled={!canLoad}
                className="rounded-md border border-ed-border-strong bg-ed-surface px-3 py-1 text-xs font-medium text-ed-text hover:bg-ed-subtle disabled:opacity-40">
          {loading ? 'Loading…' : 'Load'}
        </button>
        {result && result.items.length > 0 && (
          <>
            <input aria-label="Search Library translations" value={query} onChange={(e) => setQuery(e.target.value)}
                   placeholder="Search id / source / translation…"
                   className="w-56 rounded-md border border-ed-border-strong bg-ed-surface px-2.5 py-1 text-xs outline-none focus:border-ed-accent focus:ring-2 focus:ring-ed-accent-soft" />
            <button onClick={() => void autoAll()} className="rounded-md border border-ed-border-strong bg-ed-surface px-3 py-1 text-xs font-medium text-ed-text hover:bg-ed-subtle">Auto-translate all</button>
            <button onClick={doExport} className="ml-auto rounded-md bg-ed-accent px-3 py-1 text-xs font-medium text-white">Download translations ({target.trim()})</button>
          </>
        )}
      </div>

      {loadErr && <div className="border-b border-red-100 bg-red-50 px-4 py-1 text-[11px] text-red-700">{loadErr}</div>}
      {result?.capped && (
        <div className="border-b border-amber-100 bg-amber-50 px-4 py-1 text-[11px] text-amber-700">
          Showing the first {result.scanned} entities — narrow by type to cover the rest.
        </div>
      )}

      <div className="flex-1 overflow-auto bg-ed-surface p-5">
        {!result && <div className="text-sm text-ed-muted">Pick a type and a target language, then Load.</div>}
        {result && result.items.length === 0 && <div className="text-sm text-ed-muted">Nothing untranslated for {target.trim()} in {kind}.</div>}
        {result && result.items.length > 0 && visibleItems.length === 0 && <div className="text-sm text-ed-muted">No entities match “{query}”.</div>}
        {visibleItems.map((e) => {
          const body = bodies[e.id] ?? e.body
          const srcFields = entityFields(body, kind, source.trim())
          const tgtFields = entityFields(body, kind, target.trim())
          return (
            <div key={e.id} className="mb-5 overflow-hidden rounded-lg border border-ed-border bg-ed-panel shadow-sm">
              <div className="flex items-center gap-2 border-b border-ed-border bg-ed-subtle px-4 py-2 text-xs">
                <span className="rounded bg-ed-accent-soft px-1.5 py-0.5 font-medium text-ed-accent">{kind}</span>
                <span className="truncate font-mono text-ed-muted">{e.id}@{e.version}</span>
                <label className="ml-auto flex items-center gap-1.5 text-ed-muted">
                  Status
                  <select aria-label={`status ${e.id}`} value={statusOf(body, target.trim())}
                          onChange={(ev) => setEntityStatus(e, ev.target.value)}
                          className="rounded-md border border-ed-border-strong bg-ed-surface px-1.5 py-0.5 text-xs">
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </label>
              </div>
              {srcFields.map((sf, fi) => {
                const k = rowKey(e.id, fi)
                return (
                  <div key={k} className="grid grid-cols-[6.5rem_minmax(0,1fr)_minmax(0,1fr)] items-start gap-x-4 gap-y-2 border-t border-ed-border px-4 py-3.5 first:border-t-0">
                    <span className="pt-2 text-xs font-medium text-ed-muted">{sf.label}</span>
                    <div className="whitespace-pre-wrap pt-2 text-sm leading-relaxed text-ed-text">{sf.value || <span className="italic text-ed-muted/60">(empty)</span>}</div>
                    <div className="flex flex-col gap-2">
                      <textarea aria-label={`target ${e.id} ${fi}`} key={`${k}:${bump[k] ?? 0}`} rows={2}
                                defaultValue={tgtFields[fi]?.value ?? ''}
                                onChange={(ev) => writeField(e, fi, ev.target.value)}
                                className="min-h-[3.5rem] w-full resize-y rounded-md border border-ed-border-strong bg-ed-surface px-3 py-2 text-sm leading-relaxed text-ed-text shadow-sm outline-none transition-colors focus:border-ed-accent focus:ring-2 focus:ring-ed-accent-soft" />
                      <div className="flex items-center gap-2">
                        <button aria-label="Auto" onClick={() => void autoField(e, fi)} disabled={busy[k] || !sf.value.trim()}
                                className="rounded-md border border-ed-border-strong bg-ed-surface px-3 py-1 text-xs font-medium text-ed-text hover:bg-ed-subtle disabled:opacity-40">
                          {busy[k] ? '…' : 'Auto'}
                        </button>
                        {rowErr[k] && <span className="text-[11px] font-medium text-ed-danger">{rowErr[k]}</span>}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}
