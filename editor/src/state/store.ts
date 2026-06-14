import { create } from 'zustand'
import type { Questionnaire } from '../model/types'
import { getAtPath, type NodePath } from '../model/path'
import { validateQuestionnaire, type ValidationError } from '../model/validation'
import type { Source } from './types'

export type { Source } from './types'

interface EditorState {
  model: Questionnaire | null
  source: Source | null
  selection: NodePath | null
  expanded: Record<string, boolean>
  dirty: boolean
  validation: { valid: boolean; errors: ValidationError[] } | null
  loadModel: (model: Questionnaire, source: Source) => void
  applyEdit: (fn: (model: Questionnaire) => Questionnaire) => void
  revalidate: () => void
  select: (path: NodePath | null) => void
  toggleExpanded: (key: string) => void
  markSaved: () => void
  reset: () => void
}

export const useEditorStore = create<EditorState>((set, get) => ({
  model: null,
  source: null,
  selection: null,
  expanded: {},
  dirty: false,
  validation: null,
  loadModel: (model, source) =>
    set({ model, source, selection: null, dirty: false, validation: validateQuestionnaire(model) }),
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
  reset: () => set({ model: null, source: null, selection: null, expanded: {}, dirty: false, validation: null }),
}))
