import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { compileScorer, runScorer } from '../src/runScorer'

const wasm = new Uint8Array(readFileSync(fileURLToPath(new URL('../../dist-wasm/phq9.wasm', import.meta.url))))
const full = (vals: number[]) => ({ scored_responses: Object.fromEntries(vals.map((v, i) => [`pr_phq9_${i + 1}`, v])) })

test('runs a valid input and returns the ok envelope', async () => {
  const r = await runScorer(wasm, full([1, 2, 1, 2, 1, 1, 2, 1, 1]))
  expect(r).toEqual({ ok: true, output: { total: 12, severity: 'moderate', band: { min: 10, max: 14, label: 'Moderate Depression' }, missing_count: 0 } })
})
test('bad input returns ok:false, never throws', async () => {
  const r = await runScorer(wasm, { scored_responses: { pr_phq9_1: 9 } })
  expect(r.ok).toBe(false)
})
test('compileScorer instance is reusable and deterministic', async () => {
  const s = await compileScorer(wasm)
  expect(s.abiVersion()).toBe(1)
  const a = s.run(full([0, 0, 0, 0, 0, 0, 0, 0, 0]))
  const b = s.run(full([0, 0, 0, 0, 0, 0, 0, 0, 0]))
  expect(JSON.stringify(a)).toBe(JSON.stringify(b))
})
