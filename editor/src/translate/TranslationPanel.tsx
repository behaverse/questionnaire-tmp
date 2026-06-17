import { useMemo, useState } from 'react'
import { useEditorStore } from '../state/store'
import { collectTranslatable } from './collect'
import { applyTranslation, applyStatus, forkedRef } from './apply'
import type { TransKind, TransRow } from './types'
import type { EntityBody } from '../model/types'
import type { NodePath } from '../model/path'

const STATUSES = ['draft', 'complete', 'validated']

export function TranslationPanel() {
  const model = useEditorStore((s) => s.model)
  const pool = useEditorStore((s) => s.pool)
  const resolved = useEditorStore((s) => s.resolved)
  const editingLocale = useEditorStore((s) => s.editingLocale)
  const [untranslatedOnly, setUntranslatedOnly] = useState(false)

  const primary = model ? String(model.metadata.language ?? 'en') : 'en'
  const target = editingLocale && editingLocale !== primary ? editingLocale : null

  const groups = useMemo(
    () => (model && target ? collectTranslatable(model, pool, resolved, primary, target) : []),
    [model, pool, resolved, primary, target],
  )

  if (!model) return null

  if (!target) {
    return (
      <div className="p-8 text-sm text-ed-muted">
        Pick a non-primary editing language in the top bar to translate.
      </div>
    )
  }

  const allRows = groups.flatMap((g) => g.rows)
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

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="flex items-center gap-3 border-b border-ed-border bg-ed-panel px-4 py-2 text-sm">
        <span className="font-semibold">Translate → {target}</span>
        <span className="text-ed-muted">{doneCount} / {allRows.length} translated</span>
        <label className="ml-auto flex items-center gap-1 text-xs text-ed-muted">
          <input type="checkbox" checked={untranslatedOnly} onChange={(e) => setUntranslatedOnly(e.target.checked)} /> show untranslated only
        </label>
      </div>
      <div className="border-b border-amber-100 bg-amber-50 px-4 py-1 text-[11px] text-amber-700">
        Editing a translation makes a local editable copy of Library content (shared options are copied once).
      </div>
      <div className="flex-1 overflow-auto p-4">
        {groups.map((g) => {
          const rows = untranslatedOnly ? g.rows.filter((r) => !r.done) : g.rows
          if (!rows.length) return null
          return (
            <div key={g.groupId} className="mb-4 rounded border border-ed-border">
              <div className="flex items-center gap-2 border-b border-ed-border bg-ed-subtle px-3 py-1 text-xs text-ed-muted">
                <span>{g.kind}</span><span className="font-mono">{g.title}</span>
              </div>
              {rows.map((row: TransRow) => (
                <div key={row.id} className="grid grid-cols-[7rem_1fr_1fr_auto] items-start gap-2 px-3 py-2">
                  <span className="pt-1 text-xs text-ed-muted">{row.fieldLabel}</span>
                  <div className="whitespace-pre-wrap pt-1 text-sm text-ed-muted">{row.source || <span className="text-ed-muted/50">(empty)</span>}</div>
                  <textarea aria-label={`translate ${row.id}`} rows={1} defaultValue={row.target}
                            onChange={(e) => onEditText(g, row, e.target.value)}
                            className="w-full rounded border border-ed-border-strong px-2 py-1 text-sm" />
                  <select aria-label={`status ${row.id}`} value={row.status} onChange={(e) => onEditStatus(g, e.target.value)}
                          className="rounded border border-ed-border-strong px-1 py-0.5 text-xs">
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              ))}
            </div>
          )
        })}
        {!groups.length && <div className="text-sm text-ed-muted">No translatable content found.</div>}
      </div>
    </div>
  )
}
