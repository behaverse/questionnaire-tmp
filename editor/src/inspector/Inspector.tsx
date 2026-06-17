import type { JSX } from 'react'
import { useEditorStore } from '../state/store'
import { getAtPath, nodeKind, pathKey } from '../model/path'
import { updateMetadata, updateNodeProps, setBlockPages, deleteBlock, updateFlow, unsetNodeProp } from '../model/tree'
import { TextField, CheckboxField } from './fields'
import type { Block, Page, Section } from '../model/types'
import { ShowIfEditor } from '../canvas/ShowIfEditor'
import { LogicPanel } from '../logic/LogicPanel'
import { ValidationPanel } from '../logic/ValidationPanel'
import { ScoringPanel } from '../logic/ScoringPanel'
import { LanguagesField } from './LanguagesField'
import { Tabs } from '../ui/Tabs'

export function Inspector() {
  const { model, selection, applyEdit, select } = useEditorStore()
  if (!model) return null
  const sel = selection && getAtPath(model, selection) !== undefined ? selection : null
  const kind = sel ? nodeKind(model, sel) : 'questionnaire'

  let body: JSX.Element

  if (kind === 'questionnaire') {
    const m = model.metadata
    body = (
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-ed-text">Questionnaire</h3>
        <TextField label="Title" value={m.title ?? ''} onChange={(v) => applyEdit((mm) => updateMetadata(mm, { title: v }))} />
        <TextField label="Id" value={m.id} onChange={(v) => applyEdit((mm) => updateMetadata(mm, { id: v }))} />
        <TextField label="Description" value={m.description ?? ''} onChange={(v) => applyEdit((mm) => updateMetadata(mm, { description: v }))} />
        <TextField label="Language" value={m.language ?? ''} onChange={(v) => applyEdit((mm) => updateMetadata(mm, { language: v }))} />
        <LanguagesField />
        <Tabs tabs={[
          { id: 'logic', label: 'Logic', content: <LogicPanel /> },
          { id: 'validation', label: 'Validation', content: <ValidationPanel /> },
          { id: 'scoring', label: 'Scoring', content: <ScoringPanel /> },
        ]} />
        <CheckboxField label="Randomize page order" checked={(model.flow as { randomize_pages?: boolean })?.randomize_pages === true}
          onChange={(v) => applyEdit((mm) => updateFlow(mm, { randomize_pages: v ? true : undefined }))} />
      </div>
    )
  } else if (kind === 'page' || kind === 'section') {
    const node = getAtPath(model, sel!) as Page | Section
    body = (
      <div className="space-y-3">
        <h3 className="text-sm font-semibold capitalize text-ed-text">{kind}</h3>
        <TextField label={`${kind} title`} value={node.title ?? ''} onChange={(v) => applyEdit((mm) => updateNodeProps(mm, sel!, { title: v }))} />
        <TextField label="Id" value={(node as Page).id ?? ''} onChange={(v) => applyEdit((mm) => updateNodeProps(mm, sel!, { id: v }))} />
        <CheckboxField label="Randomize element order"
          checked={(node as { randomize?: boolean }).randomize === true}
          onChange={(v) => applyEdit((mm) => v ? updateNodeProps(mm, sel!, { randomize: true }) : unsetNodeProp(mm, sel!, 'randomize'))} />
        <ShowIfEditor key={pathKey(sel!)} path={sel!} />
      </div>
    )
  } else if (kind === 'block') {
    const node = getAtPath(model, sel!) as Block
    body = (
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-ed-text">Block</h3>
        <TextField label="Block title" value={node.title ?? ''} onChange={(v) => applyEdit((mm) => updateNodeProps(mm, sel!, { title: v }))} />
        <TextField label="Id" value={node.id} onChange={(v) => applyEdit((mm) => updateNodeProps(mm, sel!, { id: v }))} />
        <div>
          <span className="mb-1 block text-xs font-medium text-ed-muted">Pages in this block</span>
          <ul className="space-y-1">
            {model.pages.map((p) => {
              const inBlock = node.page_ids.includes(p.id)
              return (
                <li key={p.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={inBlock}
                    aria-label={`Include ${p.title ?? p.id}`}
                    onChange={() => applyEdit((mm) => setBlockPages(mm, node.id,
                      inBlock ? node.page_ids.filter((x) => x !== p.id) : [...node.page_ids, p.id]))}
                  />
                  <span className="truncate">{p.title ?? p.id}</span>
                </li>
              )
            })}
          </ul>
        </div>
        <button
          onClick={() => { const id = node.id; select(null); applyEdit((mm) => deleteBlock(mm, id)) }}
          className="rounded border border-red-300 px-2 py-1 text-sm text-red-700 hover:bg-red-50"
        >Delete block</button>
        <CheckboxField label="Randomize page order in block"
          checked={(node as { randomize?: boolean }).randomize === true}
          onChange={(v) => applyEdit((mm) => v ? updateNodeProps(mm, sel!, { randomize: true }) : unsetNodeProp(mm, sel!, 'randomize'))} />
        <ShowIfEditor key={pathKey(sel!)} path={sel!} />
      </div>
    )
  } else {
    const node = getAtPath(model, sel!) as Record<string, unknown>
    body = (
      <div className="space-y-3">
        <h3 className="text-sm font-semibold capitalize text-ed-text">{kind}</h3>
        <pre className="overflow-auto rounded bg-ed-subtle p-2 text-xs text-ed-muted">{JSON.stringify(node, null, 2)}</pre>
        {kind === 'item' && <ShowIfEditor key={pathKey(sel!)} path={sel!} />}
      </div>
    )
  }

  return <aside className="overflow-auto border-l border-ed-border bg-ed-panel p-4">{body}</aside>
}
