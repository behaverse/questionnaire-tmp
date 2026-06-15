import type { LogicRule } from '../model/types'
import type { LogicTargets } from './targets'
import type { IdCatalogue } from './ids'
import type { LogicEvaluator } from './types'
import { newRule, validateRule } from './ruleOps'
import { ExpressionInput } from './ExpressionInput'

const TYPES: LogicRule['type'][] = ['skip', 'branch', 'visibility', 'piping']

function TargetSelect({ label, value, options, onChange }: {
  label: string; value: string; options: string[]; onChange: (v: string) => void
}) {
  const opts = value && !options.includes(value) ? [value, ...options] : options
  return (
    <select aria-label={label} value={value} onChange={(e) => onChange(e.target.value)}
      className="mt-0.5 block w-full rounded border border-slate-300 px-1 py-0.5 text-sm">
      <option value="">— choose —</option>
      {opts.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  )
}

export function RuleEditor({ rule, targets, catalogue, evaluator, onChange, onDelete }: {
  rule: LogicRule
  targets: LogicTargets
  catalogue: IdCatalogue
  evaluator: LogicEvaluator | null
  onChange: (rule: LogicRule) => void
  onDelete: () => void
}) {
  const a = (rule.action ?? {}) as Record<string, unknown>
  const issues = validateRule(rule, targets).errors
  const setAction = (patch: Record<string, unknown>) => onChange({ ...rule, action: { ...rule.action, ...patch } })
  const changeType = (type: LogicRule['type']) =>
    onChange({ ...newRule(type), condition: rule.condition, ...(rule.id ? { id: rule.id } : {}) })

  return (
    <div className="space-y-2 rounded border border-slate-200 p-2">
      <div className="flex items-center gap-2">
        <select aria-label="Rule type" value={rule.type} onChange={(e) => changeType(e.target.value as LogicRule['type'])}
          className="rounded border border-slate-300 px-1 py-0.5 text-sm">
          {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <button type="button" aria-label="Delete rule" onClick={onDelete}
          className="ml-auto rounded border border-red-300 px-2 py-0.5 text-xs text-red-700 hover:bg-red-50">Delete</button>
      </div>

      <div className="text-xs font-medium text-slate-500">Condition</div>
      <ExpressionInput value={rule.condition} onChange={(v) => onChange({ ...rule, condition: v })}
        catalogue={catalogue} evaluator={evaluator} />

      {(rule.type === 'skip' || rule.type === 'branch') && (
        <div>
          <div className="text-xs font-medium text-slate-500">Go to page</div>
          <TargetSelect label="Target page" value={String(a.skip_to ?? '')} options={targets.pageIds}
            onChange={(v) => setAction({ skip_to: v })} />
          <p className="mt-0.5 text-[11px] text-slate-400">Navigation — runs in the deployed viewer (not shown in preview).</p>
        </div>
      )}

      {rule.type === 'visibility' && (
        <div className="space-y-1">
          <div className="text-xs font-medium text-slate-500">Target element</div>
          <TargetSelect label="Target element" value={String(a.target_id ?? '')} options={targets.elementKeys}
            onChange={(v) => setAction({ target_id: v })} />
          <label className="flex items-center gap-1 text-xs text-slate-600">
            <input type="checkbox" aria-label="Show when condition is true" checked={a.show === true}
              onChange={(e) => setAction({ show: e.target.checked })} />
            Show when condition is true (unchecked = hide)
          </label>
        </div>
      )}

      {rule.type === 'piping' && <p className="text-xs text-amber-600">Piping editing arrives in ED-D2b.</p>}

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
