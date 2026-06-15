import type { CrossQuestionValidationRule } from '../model/types'
import type { LogicTargets } from './targets'
import type { RuleIssue } from './ruleOps'

const ID_RE = /^[a-z][a-z0-9_]+$/

export function newValidationRule(existing: CrossQuestionValidationRule[]): CrossQuestionValidationRule {
  const ids = new Set(existing.map((r) => r.id))
  let n = 1
  while (ids.has(`val_${n}`)) n++
  return { id: `val_${n}`, condition: '', message: '', targets: [] }
}

export function summarizeValidationRule(rule: CrossQuestionValidationRule): string {
  const cond = (rule.condition ?? '').trim() || '…'
  const tgts = (rule.targets ?? []).join(', ') || '(no targets)'
  return `${rule.id || '?'}: if ${cond} → ${tgts}`
}

export function validateValidationRule(
  rule: CrossQuestionValidationRule,
  targets: LogicTargets,
  allRules: CrossQuestionValidationRule[],
): { errors: RuleIssue[] } {
  const errors: RuleIssue[] = []
  if (!rule.id) errors.push({ field: 'id', message: 'Id required', level: 'error' })
  else if (!ID_RE.test(rule.id)) errors.push({ field: 'id', message: 'Id must be lowercase letters/digits/underscore (≥2 chars)', level: 'error' })
  else if (allRules.filter((r) => r.id === rule.id).length > 1) errors.push({ field: 'id', message: `Duplicate id: ${rule.id}`, level: 'warning' })
  if (!rule.condition || !rule.condition.trim()) errors.push({ field: 'condition', message: 'Condition required', level: 'error' })
  if (!rule.message || !rule.message.trim()) errors.push({ field: 'message', message: 'Message required', level: 'error' })
  for (const t of rule.targets ?? []) if (!targets.elementKeys.includes(t)) errors.push({ field: 'targets', message: `Unknown element: ${t}`, level: 'warning' })
  if ((rule.targets ?? []).length === 0) errors.push({ field: 'targets', message: "No targets — the error won't display", level: 'warning' })
  return { errors }
}
