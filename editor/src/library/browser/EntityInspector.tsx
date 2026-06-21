// editor/src/library/browser/EntityInspector.tsx
import { useState } from 'react'
import { parseRef } from '../../persistence/library'
import { applyStatus } from '../../translate/apply'
import type { TransKind } from '../../translate/types'
import { EntityEditTab } from './EntityEditTab'

type ContentEntry = { status?: string; text?: string; label?: string; units?: string; options?: { index: number; text?: string }[] }
type Body = Record<string, unknown>
const STATUSES = ['draft', 'complete', 'validated']

function structuralFields(body: Body): [string, string][] {
  return Object.entries(body).filter(([k]) => k !== 'content' && k !== 'id')
    .map(([k, v]) => [k, typeof v === 'object' ? JSON.stringify(v) : String(v)])
}

export function EntityInspector({ refStr, body, loading, err, onChange }: {
  refStr: string | null
  body: Body | null
  loading: boolean
  err: string
  onChange: (next: Body) => void
}) {
  const [tab, setTab] = useState<'inspect' | 'edit'>('inspect')
  const [locale, setLocale] = useState('')

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
        {(['inspect', 'edit'] as const).map((t) => (
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
    </div>
  )
}
