import { useMemo, useState } from 'react'
import { useEditorStore } from '../state/store'
import { collectTranslatable } from './collect'
import { applyTranslation, applyStatus, forkedRef } from './apply'
import { setAvailableLanguages } from '../model/tree'
import type { TransKind, TransRow } from './types'
import type { EntityBody } from '../model/types'
import type { NodePath } from '../model/path'
import { translateText } from './translateClient'
import { mapLimit } from '../persistence/concurrency'

const STATUSES = ['draft', 'complete', 'validated']
const LOCALE_RE = /^[a-z]{2,3}(-[A-Z][a-z]{3})?(-[A-Z]{2})?$/

export function TranslationPanel() {
  const model = useEditorStore((s) => s.model)
  const pool = useEditorStore((s) => s.pool)
  const resolved = useEditorStore((s) => s.resolved)
  const editingLocale = useEditorStore((s) => s.editingLocale)
  const setEditingLocale = useEditorStore((s) => s.setEditingLocale)
  const applyEdit = useEditorStore((s) => s.applyEdit)
  const [untranslatedOnly, setUntranslatedOnly] = useState(false)
  const [kindFilter, setKindFilter] = useState('all')
  const [query, setQuery] = useState('')
  const [newLang, setNewLang] = useState('')
  const [busy, setBusy] = useState<Record<string, boolean>>({})
  const [autoErr, setAutoErr] = useState<Record<string, string>>({})
  const [bump, setBump] = useState<Record<string, number>>({})

  const primary = model ? String(model.metadata.language ?? 'en') : 'en'
  const target = editingLocale && editingLocale !== primary ? editingLocale : null

  const groups = useMemo(
    () => (model && target ? collectTranslatable(model, pool, resolved, primary, target) : []),
    [model, pool, resolved, primary, target],
  )

  if (!model) return null

  // No target language chosen yet — guide the user instead of stranding them: let them
  // pick an existing non-primary language or add a new one (and start translating into it).
  if (!target) {
    const existing = ((model.metadata.available_languages ?? []) as string[]).filter((l) => l !== primary)
    const code = newLang.trim()
    const invalid = code.length > 0 && !LOCALE_RE.test(code)
    const addAndTranslate = () => {
      if (!LOCALE_RE.test(code) || code === primary) return
      if (!existing.includes(code)) applyEdit((m) => setAvailableLanguages(m, [...existing, code]))
      setEditingLocale(code)
      setNewLang('')
    }
    return (
      <div className="mx-auto max-w-xl p-8">
        <h2 className="text-lg font-semibold text-ed-text">Translate this questionnaire</h2>
        <p className="mt-2 text-sm text-ed-muted">
          The primary language is <span className="font-mono">{primary}</span>. Pick a target language to
          translate into — translations are stored alongside the original and reused everywhere the entity appears.
        </p>
        {existing.length > 0 && (
          <div className="mt-4">
            <div className="text-xs font-medium text-ed-muted">Translate into an existing language</div>
            <div className="mt-1 flex flex-wrap gap-2">
              {existing.map((l) => (
                <button key={l} onClick={() => setEditingLocale(l)}
                        className="rounded-md border border-ed-border-strong px-3 py-1 text-sm hover:bg-ed-subtle">{l}</button>
              ))}
            </div>
          </div>
        )}
        <div className="mt-4">
          <div className="text-xs font-medium text-ed-muted">{existing.length > 0 ? 'Or add a new language' : 'Add a language to translate into'}</div>
          <div className="mt-1 flex items-center gap-2">
            <input aria-label="New language code" value={newLang} onChange={(e) => setNewLang(e.target.value)} placeholder="e.g. fr"
                   onKeyDown={(e) => { if (e.key === 'Enter') addAndTranslate() }}
                   className="w-28 rounded border border-ed-border-strong px-2 py-1 text-sm" />
            <button onClick={addAndTranslate} disabled={!code || invalid || code === primary}
                    className="rounded-md bg-ed-accent px-3 py-1 text-sm text-white disabled:opacity-40">Add &amp; translate</button>
          </div>
          {invalid && <p className="mt-1 text-[11px] text-red-600">Invalid locale code (e.g. fr, pt-BR).</p>}
          {!invalid && code === primary && <p className="mt-1 text-[11px] text-red-600">That's already the primary language.</p>}
        </div>
      </div>
    )
  }

  const kinds = [...new Set(groups.map((g) => g.kind))]
  const q = query.trim().toLowerCase()
  // a row matches the search if the query hits its source/target text or its group's id/kind
  const rowMatches = (g: typeof groups[number], row: TransRow) =>
    !q || row.source.toLowerCase().includes(q) || row.target.toLowerCase().includes(q) ||
    g.title.toLowerCase().includes(q) || g.kind.toLowerCase().includes(q)
  const visibleGroups = (kindFilter === 'all' ? groups : groups.filter((g) => g.kind === kindFilter))
    .map((g) => ({ ...g, rows: g.rows.filter((r) => rowMatches(g, r)) }))
    .filter((g) => g.rows.length > 0)
  const allRows = visibleGroups.flatMap((g) => g.rows)
  const doneCount = allRows.filter((r) => r.done).length

  // ensure a pool copy of `ref` exists (fork if needed) → returns the pool key, else null
  const ensurePool = async (ref: string): Promise<string | null> => {
    if (pool[ref]) return ref
    const fr = forkedRef(ref)
    if (fr && pool[fr]) return fr
    const ok = await useEditorStore.getState().forkRefAction(ref)
    return ok ? forkedRef(ref) : null
  }

  const writeRef = async (ref: string, _kind: TransKind, mutate: (b: EntityBody) => EntityBody) => {
    const key = await ensurePool(ref)
    if (!key) return
    const body = useEditorStore.getState().pool[key]
    if (body) useEditorStore.getState().upsertPoolEntity(key, mutate(body))
  }

  const writeInline = (path: NodePath, mutate: (b: EntityBody) => EntityBody) => {
    useEditorStore.getState().applyEdit((m) => {
      // path points at the inline option object; replace it
      const cloned = structuredClone(m)
      let node: Record<string, unknown> = cloned as unknown as Record<string, unknown>
      for (let i = 0; i < path.length - 1; i++) node = node[path[i] as keyof typeof node] as Record<string, unknown>
      const last = path[path.length - 1]
      node[last as keyof typeof node] = mutate(node[last as keyof typeof node] as EntityBody) as never
      return cloned
    })
  }

  const onEditText = (g: typeof groups[number], row: TransRow, value: string) => {
    const mut = (b: EntityBody) => applyTranslation(b, g.kind, row.field, target, value)
    if (g.entityRef) void writeRef(g.entityRef, g.kind, mut)
    else if (g.inlinePath) writeInline(g.inlinePath, mut)
  }
  const onEditStatus = (g: typeof groups[number], value: string) => {
    const mut = (b: EntityBody) => applyStatus(b, g.kind, target, value)
    if (g.entityRef) void writeRef(g.entityRef, g.kind, mut)
    else if (g.inlinePath) writeInline(g.inlinePath, mut)
  }

  const autoRow = async (g: typeof groups[number], row: TransRow) => {
    if (!row.source.trim()) return
    setBusy((b) => ({ ...b, [row.id]: true }))
    setAutoErr((e) => ({ ...e, [row.id]: '' }))
    try {
      const out = await translateText(row.source, primary, target!, g.kind)
      onEditText(g, row, out)
      onEditStatus(g, 'draft')
      setBump((m) => ({ ...m, [row.id]: (m[row.id] ?? 0) + 1 }))
    } catch {
      setAutoErr((e) => ({ ...e, [row.id]: 'auto-translate failed' }))
    } finally {
      setBusy((b) => ({ ...b, [row.id]: false }))
    }
  }

  const autoAllUntranslated = async () => {
    // only the visible (kind-filtered) untranslated rows, matching the panel's current view
    const pending = visibleGroups.flatMap((g) => g.rows.filter((r) => !r.done).map((r) => ({ g, r })))
    await mapLimit(pending, 4, ({ g, r }) => autoRow(g, r))
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-ed-border bg-ed-panel px-5 py-3 text-sm">
        <span className="font-semibold text-ed-text">Translate <span className="text-ed-muted">→</span> <span className="text-ed-accent">{target}</span></span>
        <span className="rounded-full bg-ed-subtle px-2 py-0.5 text-xs font-medium text-ed-muted">{doneCount} / {allRows.length} translated</span>
        {kinds.length > 1 && (
          <label className="flex items-center gap-1.5 text-xs text-ed-muted">
            Type
            <select aria-label="Filter by element type" value={kindFilter} onChange={(e) => setKindFilter(e.target.value)}
                    className="rounded-md border border-ed-border-strong bg-ed-surface px-2 py-1 text-xs">
              <option value="all">all</option>
              {kinds.map((k) => <option key={k} value={k}>{k}</option>)}
            </select>
          </label>
        )}
        <input
          aria-label="Search translations"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search source / translation / id…"
          className="ml-auto w-64 rounded-md border border-ed-border-strong bg-ed-surface px-2.5 py-1 text-xs outline-none focus:border-ed-accent focus:ring-2 focus:ring-ed-accent-soft"
        />
        <label className="flex items-center gap-1.5 text-xs text-ed-muted">
          <input type="checkbox" checked={untranslatedOnly} onChange={(e) => setUntranslatedOnly(e.target.checked)} /> show untranslated only
        </label>
        <button onClick={() => void autoAllUntranslated()}
                className="rounded-md border border-ed-border-strong bg-ed-surface px-3 py-1.5 text-xs font-medium text-ed-text hover:bg-ed-subtle">Auto-translate untranslated</button>
      </div>
      <div className="border-b border-amber-200/70 bg-amber-50 px-5 py-1.5 text-[11px] text-amber-700">
        Editing a translation makes a local editable copy of Library content (shared options are copied once).
      </div>
      <div className="flex-1 overflow-auto bg-ed-surface p-5">
        {visibleGroups.map((g) => {
          const rows = untranslatedOnly ? g.rows.filter((r) => !r.done) : g.rows
          if (!rows.length) return null
          return (
            <div key={g.groupId} className="mb-5 overflow-hidden rounded-lg border border-ed-border bg-ed-panel shadow-sm">
              <div className="flex items-center gap-2 border-b border-ed-border bg-ed-subtle px-4 py-2 text-xs">
                <span className="rounded bg-ed-accent-soft px-1.5 py-0.5 font-medium text-ed-accent">{g.kind}</span>
                <span className="truncate font-mono text-ed-muted">{g.title}</span>
              </div>
              {rows.map((row: TransRow) => (
                <div key={row.id} className="grid grid-cols-[6.5rem_minmax(0,1fr)_minmax(0,1fr)] items-start gap-x-4 gap-y-2 border-t border-ed-border px-4 py-3.5 first:border-t-0">
                  <span className="pt-2 text-xs font-medium text-ed-muted">{row.fieldLabel}</span>
                  <div className="whitespace-pre-wrap pt-2 text-sm leading-relaxed text-ed-text">{row.source || <span className="italic text-ed-muted/60">(empty)</span>}</div>
                  <div className="flex flex-col gap-2">
                    <textarea aria-label={`translate ${row.id}`} key={`${row.id}:${bump[row.id] ?? 0}`} rows={2} defaultValue={row.target}
                              onChange={(e) => onEditText(g, row, e.target.value)}
                              className="min-h-[3.5rem] w-full resize-y rounded-md border border-ed-border-strong bg-ed-surface px-3 py-2 text-sm leading-relaxed text-ed-text shadow-sm outline-none transition-colors focus:border-ed-accent focus:ring-2 focus:ring-ed-accent-soft" />
                    <div className="flex items-center gap-2">
                      <select aria-label={`status ${row.id}`} value={row.status} onChange={(e) => onEditStatus(g, e.target.value)}
                              className="rounded-md border border-ed-border-strong bg-ed-surface px-2 py-1 text-xs text-ed-muted">
                        {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <button aria-label="Auto" onClick={() => void autoRow(g, row)} disabled={busy[row.id] || !row.source.trim()}
                              className="rounded-md border border-ed-border-strong bg-ed-surface px-3 py-1 text-xs font-medium text-ed-text hover:bg-ed-subtle disabled:opacity-40">
                        {busy[row.id] ? '…' : 'Auto'}
                      </button>
                      {autoErr[row.id] && <span className="text-[11px] font-medium text-ed-danger">{autoErr[row.id]}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        })}
        {!visibleGroups.length && <div className="text-sm text-ed-muted">No translatable content found.</div>}
      </div>
    </div>
  )
}
