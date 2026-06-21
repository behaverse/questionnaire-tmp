// editor/src/library/browser/EntityInspector.tsx
import { useState } from 'react'
import { parseRef } from '../../persistence/library'
import { applyTranslation, applyStatus } from '../../translate/apply'
import type { TransKind } from '../../translate/types'
import { entityFields } from '../../translate/workbench/fields'
import { translateText } from '../../translate/translateClient'
import { EntityEditTab } from './EntityEditTab'

type ContentEntry = { status?: string; text?: string; label?: string; units?: string; options?: { index: number; text?: string }[] }
type Body = Record<string, unknown>
const STATUSES = ['draft', 'complete', 'validated']

function structuralFields(body: Body): [string, string][] {
  return Object.entries(body).filter(([k]) => k !== 'content' && k !== 'id')
    .map(([k, v]) => [k, typeof v === 'object' ? JSON.stringify(v) : String(v)])
}

export function EntityInspector({ refStr, body, loading, err, onChange, translate = translateText }: {
  refStr: string | null
  body: Body | null
  loading: boolean
  err: string
  onChange: (next: Body) => void
  translate?: typeof translateText
}) {
  const [tab, setTab] = useState<'inspect' | 'edit' | 'translate'>('inspect')
  const [locale, setLocale] = useState('')
  const [bump, setBump] = useState<Record<string, number>>({})
  const [busy, setBusy] = useState<Record<string, boolean>>({})
  const [rowErr, setRowErr] = useState<Record<string, string>>({})
  const [tSource, setTSource] = useState('')
  const [tTarget, setTTarget] = useState('')

  if (!refStr) return <div className="p-8 text-sm text-ed-muted">Select an entity from the list to inspect it.</div>
  if (loading) return <div className="p-8 text-sm text-ed-muted">Loading…</div>
  if (err) return <div className="p-8 text-sm text-red-600">{err}</div>
  if (!body) return <div className="p-8 text-sm text-ed-muted">Entity not found.</div>

  const type = parseRef(refStr)?.type ?? 'entity'
  const content = (body.content ?? {}) as Record<string, ContentEntry>
  const locales = Object.keys(content)
  const editLocale = locale || locales[0] || 'en'
  const status = content[editLocale]?.status ?? 'draft'
  const editable = status === 'draft'
  const isEditableType = ['prompt', 'option', 'context', 'instruction', 'message'].includes(type)

  const setStatus = (s: string) => onChange(applyStatus(body, type as TransKind, editLocale, s) as Body)

  return (
    <div className="mx-auto max-w-3xl p-6">
      <div className="mb-3 flex items-center gap-2">
        <span className="rounded bg-ed-accent-soft px-1.5 py-0.5 text-xs font-medium text-ed-accent">{type}</span>
        <span className="font-mono text-sm text-ed-text">{refStr}</span>
      </div>

      <div role="tablist" className="mb-4 flex gap-1 border-b border-ed-border">
        {(['inspect', 'edit', 'translate'] as const).map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)}
                  className={`-mb-px border-b-2 px-3 py-1.5 text-sm capitalize ${tab === t ? 'border-ed-accent font-medium text-ed-text' : 'border-transparent text-ed-muted hover:text-ed-text'}`}>{t}</button>
        ))}
      </div>

      {tab === 'inspect' && (
        <>
          <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-ed-muted">Fields</h3>
          <dl className="mb-5 grid grid-cols-[10rem_1fr] gap-x-4 gap-y-1 text-sm">
            {structuralFields(body).map(([k, v]) => (
              <div key={k} className="contents"><dt className="text-ed-muted">{k}</dt><dd className="break-words font-mono text-ed-text">{v}</dd></div>
            ))}
          </dl>
          <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-ed-muted">Content</h3>
          {locales.length === 0 && <div className="text-sm text-ed-muted">No translatable content.</div>}
          {Object.entries(content).map(([loc, c]) => (
            <div key={loc} className="mb-3 rounded-lg border border-ed-border bg-ed-panel p-3">
              <div className="mb-1 flex items-center gap-2 text-xs">
                <span className="rounded bg-ed-subtle px-1.5 py-0.5 font-medium text-ed-muted">{loc}</span>
                {c.status && <span className="text-ed-muted">{c.status}</span>}
              </div>
              {c.text && <div className="whitespace-pre-wrap text-sm leading-relaxed text-ed-text">{c.text}</div>}
              {c.label && <div className="text-sm text-ed-text">{c.label}{c.units ? ` (${c.units})` : ''}</div>}
              {c.options && c.options.length > 0 && (
                <ul className="mt-1 list-inside list-disc text-sm text-ed-text">
                  {c.options.map((o) => <li key={o.index}>{o.text || <span className="italic text-ed-muted/60">(empty)</span>}</li>)}
                </ul>
              )}
            </div>
          ))}
        </>
      )}

      {tab === 'edit' && (
        <div>
          <div className="mb-3 flex flex-wrap items-center gap-3 text-xs text-ed-muted">
            <label className="flex items-center gap-1.5">Locale
              <select aria-label="Edit locale" value={editLocale} onChange={(e) => setLocale(e.target.value)}
                      className="rounded-md border border-ed-border-strong bg-ed-surface px-2 py-1 text-xs">
                {(locales.length ? locales : [editLocale]).map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </label>
            <input aria-label="Add locale" placeholder="add locale (e.g. fr)"
                   onKeyDown={(e) => { if (e.key === 'Enter') { const v = (e.target as HTMLInputElement).value.trim(); if (v) { setLocale(v); (e.target as HTMLInputElement).value = '' } } }}
                   className="w-32 rounded-md border border-ed-border-strong bg-ed-surface px-2 py-1 text-xs" />
            {isEditableType && (
              <label className="flex items-center gap-1.5">Status
                <select aria-label="Entity status" value={status} onChange={(e) => setStatus(e.target.value)}
                        className="rounded-md border border-ed-border-strong bg-ed-surface px-2 py-1 text-xs">
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </label>
            )}
            {!editable && <span className="text-ed-muted">🔒 locked ({status}) — set to draft to edit</span>}
          </div>
          <EntityEditTab type={type} body={body} locale={editLocale} primaryLocale={locales[0]} editable={editable} onChange={onChange} />
        </div>
      )}

      {tab === 'translate' && (() => {
        if (!isEditableType) return <div className="text-sm text-ed-muted">No translatable content for this type.</div>
        const kind = type as TransKind
        const src = (tSource || locales[0] || 'en').trim()
        const tgt = (tTarget || locales.find((l) => l !== src) || '').trim()
        const tStatus = tgt ? (content[tgt]?.status ?? 'draft') : 'draft'
        const tEditable = tStatus === 'draft'
        const srcFields = entityFields(body, kind, src)
        const tgtFields = tgt ? entityFields(body, kind, tgt) : []
        const auto = async (fi: number) => {
          const sf = srcFields[fi]
          if (!tgt || !tEditable || !sf?.value.trim()) return
          const k = `${tgt}#${fi}`
          setBusy((b) => ({ ...b, [k]: true })); setRowErr((x) => ({ ...x, [k]: '' }))
          try {
            const out = await translate(sf.value, src, tgt, kind)
            let nb = applyTranslation(body, kind, sf.field, tgt, out) as Body
            if ((nb.content as Record<string, { status?: string }>)[tgt]?.status !== 'draft') nb = applyStatus(nb, kind, tgt, 'draft') as Body
            onChange(nb)
            setBump((m) => ({ ...m, [k]: (m[k] ?? 0) + 1 }))
          } catch { setRowErr((x) => ({ ...x, [k]: 'failed' })) }
          finally { setBusy((b) => ({ ...b, [k]: false })) }
        }
        const write = (fi: number, v: string) => { const sf = srcFields[fi]; if (sf && tgt) onChange(applyTranslation(body, kind, sf.field, tgt, v) as Body) }
        return (
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-3 text-xs text-ed-muted">
              <label className="flex items-center gap-1.5">From
                <select aria-label="Source locale" value={src} onChange={(e) => setTSource(e.target.value)} className="rounded-md border border-ed-border-strong bg-ed-surface px-2 py-1 text-xs">
                  {(locales.length ? locales : [src]).map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
              </label>
              <label className="flex items-center gap-1.5">To
                <input aria-label="Target locale" value={tgt} onChange={(e) => setTTarget(e.target.value)} placeholder="fr" className="w-16 rounded-md border border-ed-border-strong bg-ed-surface px-2 py-1 text-xs" />
              </label>
              {tgt && <label className="flex items-center gap-1.5">Status
                <select aria-label="Translate status" value={tStatus} onChange={(e) => onChange(applyStatus(body, kind, tgt, e.target.value) as Body)} className="rounded-md border border-ed-border-strong bg-ed-surface px-2 py-1 text-xs">
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select></label>}
              {tgt && !tEditable && <span>🔒 locked ({tStatus})</span>}
            </div>
            {!tgt && <div className="text-sm text-ed-muted">Enter a target locale to translate into.</div>}
            {tgt && srcFields.map((sf, fi) => {
              const k = `${tgt}#${fi}`
              return (
                <div key={k} className="mb-3 grid grid-cols-[6rem_minmax(0,1fr)] items-start gap-x-3 gap-y-1.5 border-t border-ed-border pt-3 first:border-t-0">
                  <span className="row-span-2 pt-2 text-xs font-medium text-ed-muted">{sf.label}</span>
                  <div className="whitespace-pre-wrap rounded-md bg-ed-subtle/60 px-3 py-2 text-sm leading-relaxed text-ed-text">{sf.value || <span className="italic text-ed-muted/60">(empty)</span>}</div>
                  <div className="flex items-center gap-2">
                    <textarea aria-label={`target ${fi}`} key={`${k}:${bump[k] ?? 0}`} rows={2} readOnly={!tEditable}
                              defaultValue={tgtFields[fi]?.value ?? ''} onChange={(e) => write(fi, e.target.value)}
                              className={`min-h-[3rem] w-full resize-y rounded-md border px-3 py-2 text-sm leading-relaxed outline-none ${tEditable ? 'border-ed-border-strong bg-ed-surface text-ed-text focus:border-ed-accent focus:ring-2 focus:ring-ed-accent-soft' : 'cursor-not-allowed border-ed-border bg-ed-subtle text-ed-muted'}`} />
                    {tEditable && <button aria-label="Auto" onClick={() => void auto(fi)} disabled={busy[k] || !sf.value.trim()}
                                          className="shrink-0 rounded-md border border-ed-border-strong bg-ed-surface px-3 py-1.5 text-xs font-medium text-ed-text hover:bg-ed-subtle disabled:opacity-40">{busy[k] ? '…' : 'Auto'}</button>}
                    {rowErr[k] && <span className="text-[11px] font-medium text-ed-danger">{rowErr[k]}</span>}
                  </div>
                </div>
              )
            })}
          </div>
        )
      })()}
    </div>
  )
}
