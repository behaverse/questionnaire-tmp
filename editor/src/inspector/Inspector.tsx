import type { JSX } from 'react'
import { useEditorStore } from '../state/store'
import { getAtPath, nodeKind } from '../model/path'
import { updateMetadata, updateNodeProps } from '../model/tree'
import { TextField } from './fields'
import type { Block, Page, Section } from '../model/types'

export function Inspector() {
  const { model, selection, applyEdit } = useEditorStore()
  if (!model) return null
  const kind = selection ? nodeKind(model, selection) : 'questionnaire'

  let body: JSX.Element

  if (kind === 'questionnaire') {
    const m = model.metadata
    body = (
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-700">Questionnaire</h3>
        <TextField label="Title" value={m.title ?? ''} onChange={(v) => applyEdit((mm) => updateMetadata(mm, { title: v }))} />
        <TextField label="Id" value={m.id} onChange={(v) => applyEdit((mm) => updateMetadata(mm, { id: v }))} />
        <TextField label="Description" value={m.description ?? ''} onChange={(v) => applyEdit((mm) => updateMetadata(mm, { description: v }))} />
        <TextField label="Language" value={m.language ?? ''} onChange={(v) => applyEdit((mm) => updateMetadata(mm, { language: v }))} />
      </div>
    )
  } else if (kind === 'page' || kind === 'section') {
    const node = getAtPath(model, selection!) as Page | Section
    body = (
      <div className="space-y-3">
        <h3 className="text-sm font-semibold capitalize text-slate-700">{kind}</h3>
        <TextField label={`${kind} title`} value={node.title ?? ''} onChange={(v) => applyEdit((mm) => updateNodeProps(mm, selection!, { title: v }))} />
        <TextField label="Id" value={(node as Page).id ?? ''} onChange={(v) => applyEdit((mm) => updateNodeProps(mm, selection!, { id: v }))} />
        <p className="text-xs text-slate-400">style / flow panels arrive with full coverage in later stages.</p>
      </div>
    )
  } else if (kind === 'block') {
    const node = getAtPath(model, selection!) as Block
    body = (
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-700">Block</h3>
        <TextField label="Block title" value={node.title ?? ''} onChange={(v) => applyEdit((mm) => updateNodeProps(mm, selection!, { title: v }))} />
        <p className="text-xs text-slate-400">Pages in this block: {node.page_ids.join(', ') || '(none)'}</p>
      </div>
    )
  } else {
    const node = getAtPath(model, selection!) as Record<string, unknown>
    body = (
      <div className="space-y-3">
        <h3 className="text-sm font-semibold capitalize text-slate-700">{kind}</h3>
        <pre className="overflow-auto rounded bg-slate-50 p-2 text-xs text-slate-600">{JSON.stringify(node, null, 2)}</pre>
        <p className="text-xs text-slate-400">Content &amp; reference editing arrive in <strong>ED-C</strong>; logic (show_if) in ED-D.</p>
      </div>
    )
  }

  return <aside className="overflow-auto border-l border-slate-200 bg-white p-4">{body}</aside>
}
