// Verify EVERY wired scorer end-to-end: for each questionnaire that declares scores[], fill its
// items with a mid-range value, run its real wasm scorer, and confirm every score's JSON-Pointer
// path resolves to a value.  node scripts/verify-slice.mjs   (needs host built)
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { runScorer } from '../host/dist/runScorer.js'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const repo = join(root, '..')
const qdir = join(repo, 'questionnaire-harvester/output/questionnaires')
const odir = join(repo, 'questionnaire-harvester/output/options')
const ptr = (o, p) => p.split('/').slice(1).reduce((x, k) => (x == null ? x : x[k]), o)

// mid value valid for an element's option (so item-range validation passes)
function midFor(el) {
  const ref = (el.option?.ref || '').split('@')[0]
  try {
    const vals = JSON.parse(readFileSync(join(odir, `${ref}.json`), 'utf8')).options.map((o) => o.value)
    const lo = Math.min(...vals), hi = Math.max(...vals)
    return Math.round((lo + hi) / 2)
  } catch { return 2 }
}

let total = 0, failed = 0
for (const f of readdirSync(qdir).sort()) {
  const q = JSON.parse(readFileSync(join(qdir, f), 'utf8'))
  if (!q.scores?.length) continue
  total++
  const wasmName = q.scores[0].scorer.split('@')[0].replace(/^scr_/, '')
  const wasmPath = join(root, 'dist-wasm', `${wasmName}.wasm`)
  if (!existsSync(wasmPath)) { console.log(`MISSING wasm: ${wasmName}`); failed++; continue }
  const resp = {}
  for (const el of q.pages[0].elements) {
    const pid = (el.question?.prompt || el.prompt)?.ref?.split('@')[0]
    if (pid) resp[pid] = midFor(el)
  }
  const res = await runScorer(new Uint8Array(readFileSync(wasmPath)), { scored_responses: resp })
  if (!res.ok) { console.log(`FAIL ${f}: ${res.error}`); failed++; continue }
  const bad = q.scores.filter((s) => ptr(res.output, s.path) === undefined)
  if (bad.length) { console.log(`FAIL ${f}: unresolved ${bad.map((s) => s.path).join(', ')}`); failed++ }
}
console.log(`\n${total - failed}/${total} questionnaires scored OK (${failed} failed)`)
process.exit(failed ? 1 : 0)
