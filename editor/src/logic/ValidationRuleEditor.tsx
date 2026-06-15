import type { CrossQuestionValidationRule } from '../model/types'
import type { LogicTargets } from './targets'
import type { IdCatalogue } from './ids'
import type { LogicEvaluator } from './types'
import { validateValidationRule } from './validationRuleOps'
import { ExpressionInput } from './ExpressionInput'

export function ValidationRuleEditor({ rule, targets, catalogue, evaluator, allRules, onChange, onDelete }: {
  rule: CrossQuestionValidationRule
  targets: LogicTargets
  catalogue: IdCatalogue
  evaluator: LogicEvaluator | null
  allRules: CrossQuestionValidationRule[]
  onChange: (rule: CrossQuestionValidationRule) => void
  onDelete: () => void
}) {
  const issues = validateValidationRule(rule, targets, allRules).errors
  const current = rule.targets ?? []
  const targetOptions = [...new Set([...targets.elementKeys, ...current])]
  const toggle = (key: string) =>
    onChange({ ...rule, targets: current.includes(key) ? current.filter((t) => t !== key) : [...current, key] })

  return (
    <div className="space-y-2 rounded border border-slate-200 p-2">
      <div className="flex items-center gap-2">
        <label className="text-xs text-slate-500">Id
          <input aria-label="Rule id" value={rule.id} onChange={(e) => onChange({ ...rule, id: e.target.value })}
            className="ml-1 rounded border border-slate-300 px-1 py-0.5 font-mono text-xs" />
        </label>
        <button type="button" aria-label="Delete rule" onClick={onDelete}
          className="ml-auto rounded border border-red-300 px-2 py-0.5 text-xs text-red-700 hover:bg-red-50">Delete</button>
      </div>

      <div className="text-xs font-medium text-slate-500">Condition</div>
      <ExpressionInput value={rule.condition} onChange={(v) => onChange({ ...rule, condition: v })} catalogue={catalogue} evaluator={evaluator} />

      <label className="block text-xs font-medium text-slate-500">Error message
        <input aria-label="Error message" value={rule.message} onChange={(e) => onChange({ ...rule, message: e.target.value })}
          className="mt-0.5 w-full rounded border border-slate-300 px-2 py-1 text-sm" />
      </label>

      <div className="text-xs font-medium text-slate-500">Targets</div>
      <div className="flex flex-wrap gap-2">
        {targetOptions.length === 0 && <span className="text-[11px] text-slate-400">No elements to target yet.</span>}
        {targetOptions.map((k) => (
          <label key={k} className="flex items-center gap-1 text-xs text-slate-600">
            <input type="checkbox" aria-label={`Target ${k}`} checked={current.includes(k)} onChange={() => toggle(k)} />
            {k}
          </label>
        ))}
      </div>

      {issues.length > 0 && (
        <ul className="space-y-0.5 text-xs">
          {issues.map((it, i) => (
            <li key={i} className={it.level === 'error' ? 'text-red-600' : 'text-amber-600'}>
              {it.level === 'error' ? '✗' : '⚠'} {it.message}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
