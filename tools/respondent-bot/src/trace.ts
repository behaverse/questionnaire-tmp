import type { MouseSample } from './mouse'

export type Statement = Record<string, unknown> & { verb?: string; timestamp?: string }
export type Trace = { deployment_id: string; session_id: string; statements: Statement[]; mouse?: MouseSample[] }

export function extractEventStatements(bodies: unknown[]): Statement[] {
  const out: Statement[] = []
  for (const b of bodies) {
    const evs = (b as { events?: unknown } | null)?.events
    if (Array.isArray(evs)) out.push(...(evs as Statement[]))
  }
  return out
}

export function buildTrace(deploymentId: string, sessionId: string, bodies: unknown[], mouse?: MouseSample[]): Trace {
  const trace: Trace = { deployment_id: deploymentId, session_id: sessionId, statements: extractEventStatements(bodies) }
  if (mouse && mouse.length) trace.mouse = mouse
  return trace
}

export function checkWellFormed(statements: Statement[]): { ok: boolean; reason?: string } {
  if (statements.length === 0) return { ok: false, reason: 'empty' }
  let prev = ''
  for (const s of statements) {
    if (typeof s.verb !== 'string' || !s.verb.startsWith('bdm:')) return { ok: false, reason: `bad verb ${String(s.verb)}` }
    const ts = String(s.timestamp ?? '')
    if (ts && prev && ts < prev) return { ok: false, reason: 'timestamp regressed' }
    if (ts) prev = ts
  }
  return { ok: true }
}
