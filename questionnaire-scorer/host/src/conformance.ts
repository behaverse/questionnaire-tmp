import { Ajv } from 'ajv'
import { createHash } from 'node:crypto'
import { compileScorer } from './runScorer.js'
import type { CaseReport, ConformanceReport, ScorerEntity, ScorerResult } from './types.js'

function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true
  if (a === null || b === null || typeof a !== 'object' || typeof b !== 'object') return false
  const aArr = Array.isArray(a), bArr = Array.isArray(b)
  if (aArr !== bArr) return false
  if (aArr) {
    const aa = a as unknown[], ba = b as unknown[]
    if (aa.length !== ba.length) return false
    return aa.every((v, i) => deepEqual(v, ba[i]))
  }
  const aKeys = Object.keys(a as object), bKeys = Object.keys(b as object)
  if (aKeys.length !== bKeys.length) return false
  return aKeys.every((k) => Object.prototype.hasOwnProperty.call(b, k) && deepEqual((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k]))
}

export async function checkScorer(entity: ScorerEntity, opts: { wasm: Uint8Array }): Promise<ConformanceReport> {
  const wasmImpl = entity.implementations.find((i) => i.kind === 'wasm')
  const notChecked = entity.implementations.filter((i) => i.kind !== 'wasm').map((i) => i.kind)

  let sha256Ok: boolean | null = null
  if (wasmImpl?.sha256) {
    const digest = createHash('sha256').update(opts.wasm).digest('hex')
    sha256Ok = digest === wasmImpl.sha256
  }

  const scorer = await compileScorer(opts.wasm.buffer as ArrayBuffer)
  const abiVersion = scorer.abiVersion()

  const ajv = new Ajv({ allErrors: true, strict: false })
  const validate = ajv.compile(entity.output_schema)

  const testCases = entity.test_cases ?? []
  const cases: CaseReport[] = testCases.map((tc, index) => {
    const report: CaseReport = { index, name: tc.name, ok: false, schemaErrors: [] }
    const r1 = scorer.run(tc.input) as ScorerResult
    const r2 = scorer.run(tc.input) as ScorerResult
    if (!r1.ok) { report.envelopeError = r1.error; return report }
    if (JSON.stringify(r1) !== JSON.stringify(r2)) report.nondeterministic = true
    const valid = validate(r1.output) as boolean
    if (!valid) report.schemaErrors = (validate.errors ?? []).map((e) => `${e.instancePath} ${e.message ?? ''}`.trim())
    if (!deepEqual(r1.output, tc.expected)) report.mismatch = { expected: tc.expected, actual: r1.output }
    report.ok = !report.nondeterministic && valid && !report.mismatch
    return report
  })

  const passed = abiVersion === 1 && sha256Ok !== false && cases.length > 0 && cases.every((c) => c.ok)
  return { scorer: entity.id, abiVersion, sha256Ok, checkedKind: 'wasm', notChecked, cases, passed }
}
