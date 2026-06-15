import type { LogicRule } from '../model/types'
import type { LogicTargets } from './targets'

export type RuleIssue = { field: string; message: string; level: 'error' | 'warning' }

export function newRule(type: LogicRule['type']): LogicRule {
  if (type === 'visibility') return { type, condition: '', action: { target_id: '', show: false } }
  if (type === 'piping') return { type, condition: '', action: { source: '', field_path: '' } }
  return { type, condition: '', action: { skip_to: '' } } // skip + branch
}

export function summarizeRule(rule: LogicRule): string {
  const cond = (rule.condition ?? '').trim() || '…'
  const a = (rule.action ?? {}) as Record<string, unknown>
  switch (rule.type) {
    case 'skip': return `skip → ${a.skip_to || '?'} if ${cond}`
    case 'branch': return `branch → ${a.skip_to || '?'} if ${cond}`
    case 'visibility': return `${a.show ? 'show' : 'hide'} ${a.target_id || '?'} if ${cond}`
    case 'piping': return `pipe ${a.source || '?'} → ${a.field_path || '?'} if ${cond}`
    default: return cond
  }
}

export function validateRule(rule: LogicRule, targets: LogicTargets, pipingPaths: string[] = []): { errors: RuleIssue[] } {
  const errors: RuleIssue[] = []
  const a = (rule.action ?? {}) as Record<string, unknown>
  if (!rule.condition || !rule.condition.trim()) errors.push({ field: 'condition', message: 'Condition required', level: 'error' })
  if (rule.type === 'skip' || rule.type === 'branch') {
    const t = a.skip_to
    if (typeof t !== 'string' || !t) errors.push({ field: 'skip_to', message: 'Choose a target page', level: 'error' })
    else if (!targets.pageIds.includes(t)) errors.push({ field: 'skip_to', message: `Unknown page id: ${t}`, level: 'warning' })
  } else if (rule.type === 'visibility') {
    const t = a.target_id
    if (typeof t !== 'string' || !t) errors.push({ field: 'target_id', message: 'Choose a target element', level: 'error' })
    else if (!targets.elementKeys.includes(t)) errors.push({ field: 'target_id', message: `Unknown element: ${t}`, level: 'warning' })
    if (typeof a.show !== 'boolean') errors.push({ field: 'show', message: 'Show must be true or false', level: 'error' })
  } else if (rule.type === 'piping') {
    const src = a.source
    if (typeof src !== 'string' || !src) errors.push({ field: 'source', message: 'Choose a source question', level: 'error' })
    const fp = a.field_path
    if (typeof fp !== 'string' || !fp) errors.push({ field: 'field_path', message: 'Choose a target prompt', level: 'error' })
    else if (!pipingPaths.includes(fp)) errors.push({ field: 'field_path', message: `Unknown target: ${fp}`, level: 'warning' })
  }
  return { errors }
}
