import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { checkScorer } from '../src/conformance'
import type { ScorerEntity } from '../src/types'

const wasm = new Uint8Array(readFileSync(fileURLToPath(new URL('../../dist-wasm/phq9.wasm', import.meta.url))))
const entity = JSON.parse(
  readFileSync(fileURLToPath(new URL('../../../schemas/questionnaire/examples/library_examples/scorers/scr_phq9.json', import.meta.url)), 'utf8'),
) as ScorerEntity

test('the PHQ-9 scorer is conformant against its entity test_cases', async () => {
  const report = await checkScorer(entity, { wasm })
  expect(report.passed).toBe(true)
  expect(report.abiVersion).toBe(1)
  expect(report.sha256Ok).toBe(true)
  expect(report.cases.length).toBe(entity.test_cases!.length)
  expect(report.cases.every((c) => c.ok)).toBe(true)
  expect(report.notChecked).toEqual(['http', 'python'])
})

test('a wrong expected value is reported as a mismatch (passed=false)', async () => {
  const tampered: ScorerEntity = { ...entity, test_cases: [{ name: 'x', input: entity.test_cases![0].input, expected: { total: 999, severity: 'minimal', band: { min: 0, max: 4, label: 'Minimal Depression' }, missing_count: 0 } }] }
  const report = await checkScorer(tampered, { wasm })
  expect(report.passed).toBe(false)
  expect(report.cases[0].mismatch).toBeDefined()
})

test('a sha256 that does not match the binary fails', async () => {
  const bad: ScorerEntity = { ...entity, implementations: entity.implementations.map((i) => (i.kind === 'wasm' ? { ...i, sha256: 'f'.repeat(64) } : i)) }
  const report = await checkScorer(bad, { wasm })
  expect(report.sha256Ok).toBe(false)
  expect(report.passed).toBe(false)
})
