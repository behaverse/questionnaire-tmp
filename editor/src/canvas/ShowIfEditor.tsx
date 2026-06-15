import { useState } from 'react'
import { useEditorStore } from '../state/store'
import { getAtPath, type NodePath } from '../model/path'
import { updateNodeProps, unsetNodeProp } from '../model/tree'
import { collectIdCatalogue } from '../logic/ids'
import { ExpressionInput } from '../logic/ExpressionInput'
import { useEvaluator } from '../logic/useEvaluator'

export function ShowIfEditor({ path }: { path: NodePath }) {
  const { model, pool, applyEdit } = useEditorStore()
  const evaluator = useEvaluator()
  const node = model ? (getAtPath(model, path) as { show_if?: string } | undefined) : undefined
  const [draft, setDraft] = useState<string>(node?.show_if ?? '')
  if (!model || !node) return null
  const catalogue = collectIdCatalogue(model, pool)

  return (
    <div className="space-y-2 border-t border-slate-200 pt-3">
      <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Visible when…</h4>
      <ExpressionInput value={draft} onChange={setDraft} catalogue={catalogue} evaluator={evaluator} />
      <div className="flex gap-2">
        <button type="button"
          onClick={() => applyEdit((m) => updateNodeProps(m, path, { show_if: draft }))}
          disabled={!draft.trim()}
          className="rounded bg-slate-700 px-2 py-1 text-xs text-white hover:bg-slate-800 disabled:opacity-40">
          Set
        </button>
        <button type="button"
          onClick={() => { setDraft(''); applyEdit((m) => unsetNodeProp(m, path, 'show_if')) }}
          className="rounded border border-slate-300 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50">
          Clear
        </button>
      </div>
      <p className="text-[11px] text-slate-400">Always shown when empty. A malformed condition is treated as shown.</p>
    </div>
  )
}
