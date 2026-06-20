// editor/src/translate/workbench/TranslationWorkbench.tsx
import { useMemo, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { entityFields } from './fields'
import { loadUntranslated, defaultWbClient, type WbClient, type WbEntity, type LoadResult } from './load'
import { exportTranslations } from './export'
import { translateText } from '../translateClient'
import { applyTranslation, applyStatus } from '../apply'
import { mapLimit } from '../../persistence/concurrency'
import type { TransKind } from '../types'

const KINDS: TransKind[] = ['prompt', 'option', 'context', 'instruction', 'message']

export interface WorkbenchProps {
  onExit: () => void
  client?: WbClient
  translate?: typeof translateText
}

export function TranslationWorkbench({ onExit, client, translate = translateText }: WorkbenchProps) {
  const wbClient = useMemo(() => client ?? defaultWbClient(), [client])
  const [kind, setKind] = useState<TransKind>('prompt')
  const [source, setSource] = useState('en')
  const [target, setTarget] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadErr, setLoadErr] = useState('')
  const [result, setResult] = useState<LoadResult | null>(null)
  const [bodies, setBodies] = useState<Record<string, Record<string, unknown>>>({}) // id → working body
  const [busy, setBusy] = useState<Record<string, boolean>>({})
  const [rowErr, setRowErr] = useState<Record<string, string>>({})
  const [bump, setBump] = useState<Record<string, number>>({})

  const canLoad = !!target.trim() && target.trim() !== source.trim() && !loading

  const load = async () => {
    setLoading(true); setLoadErr(''); setResult(null)
    try {
      const r = await loadUntranslated(kind, source.trim(), target.trim(), wbClient)
      setResult(r)
      const map: Record<string, Record<string, unknown>> = {}
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
    setBodies((prev) => {
      let body = prev[e.id] ?? e.body
      body = applyTranslation(body, kind, f.field, target.trim(), value) as Record<string, unknown>
      body = applyStatus(body, kind, target.trim(), 'draft') as Record<string, unknown>
      return { ...prev, [e.id]: body }
    })
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
    for (const e of result.items) {
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

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="flex flex-wrap items-center gap-3 border-b border-ed-border bg-ed-panel px-4 py-2 text-sm">
        <button onClick={onExit} aria-label="Back" className="flex items-center gap-1 text-ed-muted hover:text-ed-text">
          <ArrowLeft size={16} aria-hidden="true" /> Back
        </button>
        <span className="font-semibold">Translate Library entities</span>
        <label className="flex items-center gap-1 text-xs text-ed-muted">Type
          <select aria-label="Entity type" value={kind} onChange={(e) => setKind(e.target.value as TransKind)}
                  className="rounded border border-ed-border-strong px-1 py-0.5 text-xs">
            {KINDS.map((k) => <option key={k} value={k}>{k}</option>)}
          </select>
        </label>
        <label className="flex items-center gap-1 text-xs text-ed-muted">From
          <input aria-label="Source language" value={source} onChange={(e) => setSource(e.target.value)}
                 className="w-16 rounded border border-ed-border-strong px-1 py-0.5 text-xs" />
        </label>
        <label className="flex items-center gap-1 text-xs text-ed-muted">To
          <input aria-label="Target language" value={target} onChange={(e) => setTarget(e.target.value)} placeholder="e.g. fr"
                 className="w-16 rounded border border-ed-border-strong px-1 py-0.5 text-xs" />
        </label>
        <button onClick={() => void load()} disabled={!canLoad}
                className="rounded border border-ed-border-strong px-2 py-0.5 text-xs hover:bg-ed-subtle disabled:opacity-40">
          {loading ? 'Loading…' : 'Load'}
        </button>
        {result && result.items.length > 0 && (
          <>
            <button onClick={() => void autoAll()} className="rounded border border-ed-border-strong px-2 py-0.5 text-xs hover:bg-ed-subtle">Auto-translate all</button>
            <button onClick={doExport} className="ml-auto rounded bg-ed-accent px-2 py-0.5 text-xs text-white">Download translations ({target.trim()})</button>
          </>
        )}
      </div>

      {loadErr && <div className="border-b border-red-100 bg-red-50 px-4 py-1 text-[11px] text-red-700">{loadErr}</div>}
      {result?.capped && (
        <div className="border-b border-amber-100 bg-amber-50 px-4 py-1 text-[11px] text-amber-700">
          Showing the first {result.scanned} entities — narrow by type to cover the rest.
        </div>
      )}

      <div className="flex-1 overflow-auto p-4">
        {!result && <div className="text-sm text-ed-muted">Pick a type and a target language, then Load.</div>}
        {result && result.items.length === 0 && <div className="text-sm text-ed-muted">Nothing untranslated for {target.trim()} in {kind}.</div>}
        {result?.items.map((e) => {
          const body = bodies[e.id] ?? e.body
          const srcFields = entityFields(body, kind, source.trim())
          const tgtFields = entityFields(body, kind, target.trim())
          return (
            <div key={e.id} className="mb-4 rounded border border-ed-border">
              <div className="flex items-center gap-2 border-b border-ed-border bg-ed-subtle px-3 py-1 text-xs text-ed-muted">
                <span>{kind}</span><span className="font-mono">{e.id}@{e.version}</span>
              </div>
              {srcFields.map((sf, fi) => {
                const k = rowKey(e.id, fi)
                return (
                  <div key={k} className="grid grid-cols-[7rem_1fr_1fr_auto] items-start gap-2 px-3 py-2">
                    <span className="pt-1 text-xs text-ed-muted">{sf.label}</span>
                    <div className="whitespace-pre-wrap pt-1 text-sm text-ed-muted">{sf.value || <span className="text-ed-muted/50">(empty)</span>}</div>
                    <textarea aria-label={`target ${e.id} ${fi}`} key={`${k}:${bump[k] ?? 0}`} rows={1}
                              defaultValue={tgtFields[fi]?.value ?? ''}
                              onChange={(ev) => writeField(e, fi, ev.target.value)}
                              className="w-full rounded border border-ed-border-strong px-2 py-1 text-sm" />
                    <div className="flex flex-col items-end gap-1">
                      <button aria-label="Auto" onClick={() => void autoField(e, fi)} disabled={busy[k] || !sf.value.trim()}
                              className="rounded border border-ed-border-strong px-2 py-0.5 text-xs hover:bg-ed-subtle disabled:opacity-40">
                        {busy[k] ? '…' : 'Auto'}
                      </button>
                      {rowErr[k] && <span className="text-[10px] text-red-600">{rowErr[k]}</span>}
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
