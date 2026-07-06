import type { BdmEvent } from '../app/events'

export const POLL_MS = 4000
export const NO_CHANGE_CAP = 5   // stop after ~20s with no new statements (abandoned session)
export const FAIL_CAP = 15   // stop after ~60s of consecutive poll failures (revoked or dead link)

const TERMINAL = new Set(['bdm:submitted', 'bdm:completed', 'bdm:consent_declined'])

export function isTerminal(statements: BdmEvent[]): boolean {
  return statements.some((s) => typeof s.verb === 'string' && TERMINAL.has(s.verb))
}
