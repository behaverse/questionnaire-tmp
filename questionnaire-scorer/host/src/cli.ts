import { readFileSync } from 'node:fs'
import { checkScorer } from './conformance.js'
import type { ScorerEntity } from './types.js'

async function main(): Promise<void> {
  const [entityPath, wasmPath] = process.argv.slice(2)
  if (!entityPath || !wasmPath) {
    console.error('usage: scorer-conformance <entity.json> <impl.wasm>')
    process.exit(2)
  }
  const entity = JSON.parse(readFileSync(entityPath, 'utf8')) as ScorerEntity
  const wasm = new Uint8Array(readFileSync(wasmPath))
  const report = await checkScorer(entity, { wasm })
  for (const c of report.cases) {
    console.log(`  [${c.ok ? 'PASS' : 'FAIL'}] case ${c.index}${c.name ? ` (${c.name})` : ''}`)
    if (c.envelopeError) console.log(`        envelope error: ${c.envelopeError}`)
    for (const e of c.schemaErrors) console.log(`        schema: ${e}`)
    if (c.mismatch) console.log(`        mismatch: expected ${JSON.stringify(c.mismatch.expected)} got ${JSON.stringify(c.mismatch.actual)}`)
    if (c.nondeterministic) console.log('        non-deterministic output')
  }
  console.log(`${report.scorer}: ABI v${report.abiVersion}, sha256 ${report.sha256Ok === null ? 'n/a' : report.sha256Ok}, ${report.passed ? 'CONFORMANT' : 'NON-CONFORMANT'}`)
  if (report.notChecked.length) console.log(`  (not checked: ${report.notChecked.join(', ')})`)
  process.exit(report.passed ? 0 : 1)
}

void main()
