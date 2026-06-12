import { requiredUnanswered, type Step } from '../app/steps'
import { visibleEntries } from '../logic/visibility'
import type { Programs } from '../logic/compile'
import type { Bindings, LogicEvaluator } from '../logic/types'
import type { AnswerValue, Runtime } from '../renderer/types'
import type { ResumeRecord, ResumeStore } from './types'
import type { SessionState as VsSession } from '../app/bootstrap'

export type ResumeOutcome =
  | { kind: 'fresh' }
  | { kind: 'retry' }
  | { kind: 'completed' }
  | { kind: 'ephemeral_cleared' }
  | { kind: 'resume'; record: ResumeRecord; runtime: Runtime }

export type ResumeVs = {
  getSession(vs: string, id: string, token: string): Promise<VsSession>
  getRuntime(vs: string, id: string, token: string): Promise<Runtime | null>
}

const DONE = new Set(['submitted', 'forwarded', 'completed', 'validated'])

export async function resolveResume(vs: string, deploymentId: string, store: ResumeStore, deps: ResumeVs): Promise<ResumeOutcome> {
  const record = await store.get(deploymentId)
  if (!record) return { kind: 'fresh' }
  const s = await deps.getSession(vs, record.sessionId, record.token)
  if (s.kind === 'network') return { kind: 'retry' }
  if (s.kind === 'ephemeral') { await store.clear(deploymentId); return { kind: 'ephemeral_cleared' } }
  if (s.kind === 'invalid') { await store.clear(deploymentId); return { kind: 'fresh' } }
  if (DONE.has(s.status)) { await store.clear(deploymentId); return { kind: 'completed' } }
  const runtime = await deps.getRuntime(vs, record.sessionId, record.token)
  if (!runtime) return { kind: 'retry' }
  return { kind: 'resume', record: { ...record, lastActiveLocale: s.lastActiveLocale, agentId: s.agentId, sessionIndex: s.sessionIndex }, runtime }
}

/** OD-14 case 1: first step with a required, visible, unanswered element; else the last step index. */
export function firstUnansweredStep(steps: Step[], programs: Programs, ev: LogicEvaluator, bindings: Bindings, answers: Record<string, AnswerValue>): number {
  for (let i = 0; i < steps.length; i++) {
    const visible = visibleEntries(steps[i], programs, ev, bindings)
    if (visible.length === 0) continue
    const visibleStep: Step = { pageId: steps[i].pageId, elements: visible.map((e) => ({ key: e.key, element: e.element })) }
    if (requiredUnanswered(visibleStep, answers).length > 0) return i
  }
  return Math.max(0, steps.length - 1)
}
