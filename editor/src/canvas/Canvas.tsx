import { useEditorStore } from '../state/store'
import { getAtPath, nodeKind, pathKey, type NodePath } from '../model/path'
import { insertNode, deleteNode, updateNodeProps } from '../model/tree'
import type { Page, Questionnaire, Section } from '../model/types'
import { ItemEditor } from './ItemEditor'
import { MessagePane } from './MessagePane'
import { collectIds, draftVersion } from '../pool/mint'
import { buildNewItem } from '../pool/newItem'
import { buildMessage } from '../pool/newEntities'
import { UpgradeBadge } from '../library/UpgradeBadge'
import { ForkButton } from '../library/ForkButton'

function nextSectionId(model: Questionnaire): string {
  const used = new Set<string>()
  JSON.stringify(model, (k, v) => { if (k === 'id' && typeof v === 'string') used.add(v); return v })
  let n = 1
  while (used.has(`sec_new_${n}`)) n++
  return `sec_new_${n}`
}

export function Canvas() {
  const { model, selection, applyEdit, select, pool, upsertPoolEntity, openPicker } = useEditorStore()
  if (!model) return null
  const sel = selection && getAtPath(model, selection) !== undefined ? selection : null
  if (!sel) return <div className="overflow-auto p-6 text-slate-400">Select a page or section in the structure tree.</div>

  const kind = nodeKind(model, sel)

  // Route items (any node with a question — inline OR ref-based option) and matrix
  // sections (shared_option) to the item/Option editor; messages to the message pane.
  const selNode = getAtPath(model, sel) as Record<string, unknown> | undefined
  const isItem = !!selNode && 'question' in selNode
  const isSharedOptionSection = !!selNode && kind === 'section'
    && 'shared_option' in selNode && typeof selNode.shared_option === 'object'
  if (isItem || isSharedOptionSection) return <ItemEditor path={sel} />

  const isMessageElement = !!selNode && kind === 'message' && typeof (selNode as { ref?: unknown }).ref === 'string'
  if (isMessageElement) return <MessagePane path={sel} />

  if (kind !== 'page' && kind !== 'section' && kind !== 'questionnaire') {
    return <div className="overflow-auto p-6 text-slate-400">Select a page or section in the structure tree to edit its contents.</div>
  }

  const node = getAtPath(model, sel) as Page | Section
  const elements = (node.elements ?? []) as Record<string, unknown>[]
  const elementsPath: NodePath = [...sel, 'elements']

  const addSection = () => {
    const id = nextSectionId(model)
    const section: Section = { id, title: 'New section', elements: [] }
    applyEdit((m) => insertNode(m, elementsPath, elements.length, section))
  }

  const addItem = () => {
    const ids = collectIds(model, pool)
    const draftVer = draftVersion(model.metadata.version as string | undefined)
    const locale = String(model.metadata.language ?? 'en')
    const { promptRef, promptBody, item } = buildNewItem(ids, draftVer, locale)
    upsertPoolEntity(promptRef, promptBody)
    applyEdit((m) => insertNode(m, elementsPath, elements.length, item))
    select([...elementsPath, elements.length])
  }

  const addMessage = () => {
    const { ref, body } = buildMessage(collectIds(model, pool), draftVersion(model.metadata.version as string | undefined), String(model.metadata.language ?? 'en'))
    upsertPoolEntity(ref, body)
    applyEdit((m) => insertNode(m, elementsPath, elements.length, { ref }))
    select([...elementsPath, elements.length])
  }

  const pickItem = () => openPicker('item', (ref) => {
    applyEdit((m) => insertNode(m, elementsPath, elements.length, { ref }))
    select([...elementsPath, elements.length])
  })
  const pickMessage = () => openPicker('message', (ref) => {
    applyEdit((m) => insertNode(m, elementsPath, elements.length, { ref }))
    select([...elementsPath, elements.length])
  })

  return (
    <div className="overflow-auto p-6">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <h2 className="text-lg font-medium text-slate-800">{node.title ?? (node as Page).id}</h2>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          {(kind === 'page' || kind === 'section') && (
            <>
              <button onClick={addItem} className="rounded border border-slate-300 px-2 py-1 text-sm hover:bg-slate-50">+ Add item</button>
              <button onClick={addMessage} className="rounded border border-slate-300 px-2 py-1 text-sm hover:bg-slate-50">+ Add message</button>
              <button onClick={pickItem} className="rounded border border-slate-300 px-2 py-1 text-sm hover:bg-slate-50">Pick item</button>
              <button onClick={pickMessage} className="rounded border border-slate-300 px-2 py-1 text-sm hover:bg-slate-50">Pick message</button>
            </>
          )}
          <button onClick={addSection} className="rounded border border-slate-300 px-2 py-1 text-sm hover:bg-slate-50">+ Add section</button>
        </div>
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
              {typeof el.ref === 'string' && <UpgradeBadge refStr={el.ref} />}
              {typeof el.ref === 'string' && !(el.ref in pool) && <ForkButton refStr={el.ref} />}
              {(('question' in el) || (typeof el.ref === 'string' && el.ref.startsWith('it_'))) && (
                <label className="ml-2 inline-flex items-center gap-1 text-xs text-slate-500">
                  <input type="checkbox" aria-label="Required" checked={!!el.required}
                         onChange={(e) => applyEdit((m) => updateNodeProps(m, [...elementsPath, i], { required: e.target.checked }))} />
                  Required
                </label>
              )}
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
