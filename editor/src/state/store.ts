import { create } from 'zustand'
import type { Questionnaire, EntityBody } from '../model/types'
import { getAtPath, type NodePath } from '../model/path'
import { validateQuestionnaire, type ValidationError } from '../model/validation'
import { collectLibraryRefs, staleSet } from '../library/staleness'
import { upgradeRef, repointRef } from '../model/tree'
import { draftVersion } from '../pool/mint'
import { latestVersion as realLatestVersion, parseRef, fetchEntityBody as realFetchEntityBody } from '../persistence/library'
import type { Source } from './types'

export type { Source } from './types'

type LatestFn = (etype: string, id: string) => Promise<string | null>
type FetchBody = (ref: string) => Promise<EntityBody | null>

interface EditorState {
  model: Questionnaire | null
  source: Source | null
  selection: NodePath | null
  expanded: Record<string, boolean>
  dirty: boolean
  validation: { valid: boolean; errors: ValidationError[] } | null
  previewOpen: boolean
  inspectorOpen: boolean
  toggleInspector: () => void
  translateView: boolean
  setTranslateView: (v: boolean) => void
  pool: Record<string, EntityBody>
  /** Last resolved entity bodies (pool + Library), shared from the preview so the tree can
   *  read content (e.g. for the untranslated indicator) for refs that aren't in the local pool. */
  resolved: Record<string, EntityBody | null>
  setResolved: (m: Record<string, EntityBody | null>) => void
  picker: { etype: string; onPick: (ref: string) => void; onCreate?: () => void } | null
  staleness: Record<string, string>
  fork: { ref: string } | null
  editingLocale: string | null
  setEditingLocale: (locale: string | null) => void
  loadModel: (model: Questionnaire, source: Source, pool?: Record<string, EntityBody>) => void
  upsertPoolEntity: (ref: string, body: EntityBody) => void
  removePoolEntity: (ref: string) => void
  applyEdit: (fn: (model: Questionnaire) => Questionnaire) => void
  revalidate: () => void
  select: (path: NodePath | null) => void
  toggleExpanded: (key: string) => void
  markSaved: () => void
  togglePreview: () => void
  openPicker: (etype: string, onPick: (ref: string) => void, onCreate?: () => void) => void
  closePicker: () => void
  refreshStaleness: (latestFn?: LatestFn) => Promise<void>
  upgradeRefAction: (oldRef: string, newRef: string) => void
  openFork: (ref: string) => void
  closeFork: () => void
  forkRefAction: (ref: string, fetchBody?: FetchBody) => Promise<boolean>
  reset: () => void
}

export const useEditorStore = create<EditorState>((set, get) => ({
  model: null,
  source: null,
  selection: null,
  expanded: {},
  dirty: false,
  validation: null,
  previewOpen: false,
  inspectorOpen: true,
  toggleInspector: () => set((s) => ({ inspectorOpen: !s.inspectorOpen })),
  translateView: false,
  setTranslateView: (v) => set({ translateView: v }),
  pool: {},
  resolved: {},
  setResolved: (m) => set({ resolved: m }),
  picker: null,
  staleness: {},
  editingLocale: null,
  setEditingLocale: (locale) => set({ editingLocale: locale }),
  loadModel: (model, source, pool) =>
    // open with the first page selected (so the canvas shows it, not a blank pane) and
    // the preview on by default; the tree's "Questionnaire" root returns to the q-level inspector.
    set({ model, source, selection: model.pages?.length ? ['pages', 0] : null, dirty: false, validation: validateQuestionnaire(model), pool: pool ?? {}, resolved: {}, editingLocale: null, previewOpen: true, inspectorOpen: true, translateView: false }),
  upsertPoolEntity: (ref, body) => set((s) => ({ pool: { ...s.pool, [ref]: body } })),
  removePoolEntity: (ref) => set((s) => { const p = { ...s.pool }; delete p[ref]; return { pool: p } }),
  applyEdit: (fn) => {
    const { model: cur, selection } = get()
    if (!cur) return
    const next = fn(cur)
    const selectionValid = selection != null && getAtPath(next, selection) !== undefined
    set({
      model: next,
      dirty: true,
      validation: validateQuestionnaire(next),
      selection: selectionValid ? selection : null,
    })
  },
  revalidate: () => {
    const cur = get().model
    if (!cur) return
    set({ validation: validateQuestionnaire(cur) })
  },
  select: (path) => set({ selection: path }),
  toggleExpanded: (key) => set((s) => ({ expanded: { ...s.expanded, [key]: !s.expanded[key] } })),
  markSaved: () => set({ dirty: false }),
  togglePreview: () => set((s) => ({ previewOpen: !s.previewOpen })),
  openPicker: (etype, onPick, onCreate) => set({ picker: { etype, onPick, onCreate } }),
  closePicker: () => set({ picker: null }),
  refreshStaleness: async (latestFn) => {
    const { model, pool } = get()
    if (!model) return
    const fetchLatest = latestFn ?? ((t: string, i: string) => realLatestVersion(t, i))
    const refs = collectLibraryRefs(model, pool)
    const byEntity = new Map<string, { type: string; id: string }>()
    for (const ref of refs) { const p = parseRef(ref); if (p) byEntity.set(`${p.type}/${p.id}`, { type: p.type, id: p.id }) }
    const entries = await Promise.all([...byEntity.entries()].map(async ([key, e]) => [key, await fetchLatest(e.type, e.id)] as const))
    const latestByEntity = Object.fromEntries(entries)
    const latestByKey: Record<string, string | null> = {}
    for (const ref of refs) { const p = parseRef(ref); latestByKey[ref] = p ? (latestByEntity[`${p.type}/${p.id}`] ?? null) : null }
    set({ staleness: staleSet(refs, latestByKey) })
  },
  upgradeRefAction: (oldRef, newRef) => {
    get().applyEdit((m) => upgradeRef(m, oldRef, newRef))
    set((s) => { const st = { ...s.staleness }; delete st[oldRef]; return { staleness: st } })
  },
  fork: null,
  openFork: (ref) => set({ fork: { ref } }),
  closeFork: () => set({ fork: null }),
  forkRefAction: async (ref, fetchBody) => {
    const fetchB = fetchBody ?? ((r: string) => realFetchEntityBody(r))
    const parsed = parseRef(ref)
    if (!parsed) return false
    const body = await fetchB(ref)
    if (!body) return false
    const newRef = `${parsed.id}@${draftVersion(parsed.version)}`
    get().upsertPoolEntity(newRef, body)
    get().applyEdit((m) => repointRef(m, ref, newRef))
    set((s) => { const st = { ...s.staleness }; delete st[ref]; return { staleness: st } })
    return true
  },
  reset: () => set({ model: null, source: null, selection: null, expanded: {}, dirty: false, validation: null, previewOpen: false, inspectorOpen: true, translateView: false, pool: {}, resolved: {}, picker: null, staleness: {}, fork: null, editingLocale: null }),
}))
