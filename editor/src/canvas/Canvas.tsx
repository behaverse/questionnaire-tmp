import { useEditorStore } from '../state/store'
import { getAtPath, nodeKind, pathKey, type NodePath } from '../model/path'
import { insertNode, deleteNode } from '../model/tree'
import type { Page, Questionnaire, Section } from '../model/types'

function nextSectionId(model: Questionnaire): string {
  const used = new Set<string>()
  JSON.stringify(model, (k, v) => { if (k === 'id' && typeof v === 'string') used.add(v); return v })
  let n = 1
  while (used.has(`sec_new_${n}`)) n++
  return `sec_new_${n}`
}

export function Canvas() {
  const { model, selection, applyEdit, select } = useEditorStore()
  if (!model) return null
  const sel = selection && getAtPath(model, selection) !== undefined ? selection : null
  if (!sel) return <div className="overflow-auto p-6 text-slate-400">Select a page or section in the structure tree.</div>

  const kind = nodeKind(model, sel)
  if (kind !== 'page' && kind !== 'section' && kind !== 'questionnaire') {
    return <div className="overflow-auto p-6 text-slate-400">This node has no children. Editing item content arrives in ED-C.</div>
  }

  const node = getAtPath(model, sel) as Page | Section
  const elements = (node.elements ?? []) as Record<string, unknown>[]
  const elementsPath: NodePath = [...sel, 'elements']

  const addSection = () => {
    const id = nextSectionId(model)
    const section: Section = { id, title: 'New section', elements: [] }
    applyEdit((m) => insertNode(m, elementsPath, elements.length, section))
  }

  return (
    <div className="overflow-auto p-6">
      <div className="mb-4 flex items-center gap-2">
        <h2 className="text-lg font-medium text-slate-800">{node.title ?? (node as Page).id}</h2>
        <button onClick={addSection} className="ml-auto rounded border border-slate-300 px-2 py-1 text-sm hover:bg-slate-50">+ Add section</button>
      </div>
      <ul className="space-y-2">
        {elements.map((el, i) => {
          const path: NodePath = [...elementsPath, i]
          const k = nodeKind(model, path)
          const label = typeof el.ref === 'string' ? el.ref : k === 'section' ? ((el.title as string) ?? 'Section') : 'inline item'
          return (
            <li key={pathKey(path)}
                className="flex items-center gap-2 rounded border border-slate-200 bg-white px-3 py-2 text-sm">
              <span className="text-slate-400">{k === 'section' ? '▦' : k === 'message' ? '✉' : '◉'}</span>
              <button className="truncate text-left hover:underline" onClick={() => select(path)}>{label}</button>
              <span className="ml-auto rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-500">{k}</span>
              <button aria-label={`Delete ${label}`} onClick={() => applyEdit((m) => deleteNode(m, path))}
                      className="text-slate-400 hover:text-red-600">✕</button>
            </li>
          )
        })}
        {elements.length === 0 && <li className="text-sm text-slate-400">No elements yet.</li>}
      </ul>
    </div>
  )
}
