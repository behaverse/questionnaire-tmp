export interface ScorerImpl { kind: string; url?: string; sha256?: string; package?: string }
export interface ScorerEntity {
  id: string
  inputs?: unknown
  output_schema: Record<string, unknown>
  implementations: ScorerImpl[]
  test_cases?: { name?: string; input: unknown; expected: unknown }[]
}
export type ScorerResult =
  | { ok: true; output: unknown }
  | { ok: false; error: string; trapped?: boolean }
export interface CaseReport {
  index: number
  name?: string
  ok: boolean
  schemaErrors: string[]
  envelopeError?: string
  mismatch?: { expected: unknown; actual: unknown }
  nondeterministic?: boolean
}
export interface ConformanceReport {
  scorer: string
  abiVersion: number | null
  sha256Ok: boolean | null
  checkedKind: string
  notChecked: string[]
  cases: CaseReport[]
  passed: boolean
}
