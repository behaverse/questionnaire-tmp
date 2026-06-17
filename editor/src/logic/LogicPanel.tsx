import { useState } from 'react'
import { useEditorStore } from '../state/store'
import { updateLogic } from '../model/tree'
import type { LogicRule } from '../model/types'
import { collectLogicTargets } from './targets'
import { collectIdCatalogue } from './ids'
import { collectPipingTargets } from './pipingTargets'
import { useEvaluator } from './useEvaluator'
import { newRule, summarizeRule, validateRule } from './ruleOps'
import { RuleEditor } from './RuleEditor'

export function LogicPanel() {
  const { model, pool, applyEdit } = useEditorStore()
  const evaluator = useEvaluator()
  const [openIdx, setOpenIdx] = useState<number | null>(null)
  if (!model) return null
  const rules = (model.logic ?? []) as LogicRule[]
  const targets = collectLogicTargets(model)
  const catalogue = collectIdCatalogue(model, pool)
  const pipingTargets = collectPipingTargets(model)
  const pipingPaths = pipingTargets.map((t) => t.fieldPath)
  const attention = rules.filter((r) => validateRule(r, targets, pipingPaths).errors.some((e) => e.level === 'error')).length

  const write = (next: LogicRule[]) => applyEdit((m) => updateLogic(m, next))
  const add = () => { const next = [...rules, newRule('skip')]; write(next); setOpenIdx(next.length - 1) }
  const edit = (i: number, rule: LogicRule) => write(rules.map((r, j) => (j === i ? rule : r)))
  const del = (i: number) => { write(rules.filter((_, j) => j !== i)); setOpenIdx(null) }

  return (
    <div className="space-y-2 border-t border-ed-border pt-3">
      <div className="flex items-center gap-2">
        <h4 className="text-xs font-semibold text-ed-muted">Logic rules</h4>
        {attention > 0 && <span className="text-[11px] text-red-600">{attention} need{attention === 1 ? 's' : ''} attention</span>}
        <button type="button" aria-label="Add rule" onClick={add}
          className="ml-auto rounded border border-ed-border px-2 py-0.5 text-xs text-ed-muted hover:bg-ed-subtle">+ Add</button>
      </div>
      {rules.length === 0 && <p className="text-[11px] text-ed-muted">No rules yet.</p>}
      <ul className="space-y-1">
        {rules.map((r, i) => (
          <li key={i}>
            <button type="button" aria-label={`Edit rule ${i + 1}`} onClick={() => setOpenIdx(openIdx === i ? null : i)}
              className="block w-full truncate rounded px-1 py-0.5 text-left font-mono text-xs hover:bg-ed-subtle">
              {summarizeRule(r)}
            </button>
            {openIdx === i && (
              <div className="mt-1">
                <RuleEditor rule={r} targets={targets} catalogue={catalogue} evaluator={evaluator}
                  pipingTargets={pipingTargets} onChange={(rule) => edit(i, rule)} onDelete={() => del(i)} />
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
