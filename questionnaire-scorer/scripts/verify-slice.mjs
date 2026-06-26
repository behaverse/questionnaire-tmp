// Verify the wired vertical slice end-to-end: for each questionnaire that declares scores[],
// run its real wasm scorer on a sample response set and resolve every score's JSON-Pointer path.
//   node scripts/verify-slice.mjs            (needs host built: npm --prefix host run build)
import { readFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { runScorer } from '../host/dist/runScorer.js'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const repo = join(root, '..')
const out = join(repo, 'questionnaire-harvester/output')
const ptr = (o, p) => p.split('/').slice(1).reduce((x, k) => (x == null ? x : x[k]), o)

// sample scored responses (final per-item values) per questionnaire
const RESP = {
  qst_gad7: Object.fromEntries([2, 2, 2, 2, 2, 1, 1].map((v, i) => [`pr_gad7_${i + 1}`, v])),
  qst_swls: Object.fromEntries([6, 6, 6, 6, 6].map((v, i) => [`pr_swls_${i + 1}`, v])),
  qst_who5: Object.fromEntries([4, 4, 3, 3, 2].map((v, i) => [`pr_who5_${i + 1}`, v])),
  qst_dass21: Object.fromEntries(Array.from({ length: 21 }, (_, i) => [`pr_dass21_${i + 1}`, (i % 3) + 1])),
  qst_spin: Object.fromEntries(Array.from({ length: 17 }, (_, i) => [`pr_spin_${i + 1}`, 2])),
  qst_ocir: Object.fromEntries(Array.from({ length: 18 }, (_, i) => [`pr_ocir_${i + 1}`, 2])),
  qst_panas: Object.fromEntries(Array.from({ length: 20 }, (_, i) => [`pr_panas_${i + 1}`, (i % 2) ? 2 : 4])),
  qst_fs: Object.fromEntries(Array.from({ length: 8 }, (_, i) => [`pr_fs_${i + 1}`, 6])),
  qst_rrs: Object.fromEntries(Array.from({ length: 22 }, (_, i) => [`pr_rrs_${i + 1}`, 2])),
  qst_rses: Object.fromEntries(Array.from({ length: 10 }, (_, i) => [`pr_rses_${i + 1}`, 2])),
  qst_brs: Object.fromEntries(Array.from({ length: 6 }, (_, i) => [`pr_brs_${i + 1}`, 4])),
  qst_gq6: Object.fromEntries(Array.from({ length: 6 }, (_, i) => [`pr_gq6_${i + 1}`, 6])),
  qst_tils: Object.fromEntries(Array.from({ length: 3 }, (_, i) => [`pr_tils_${i + 1}`, 3])),
  qst_pss: Object.fromEntries(Array.from({ length: 14 }, (_, i) => [`pr_pss_${i + 1}`, 2])),
}

let failed = 0
for (const [qid, resp] of Object.entries(RESP)) {
  const q = JSON.parse(readFileSync(join(out, 'questionnaires', `${qid}.json`), 'utf8'))
  if (!q.scores?.length) { console.log(`${qid}: no scores[] — skip`); continue }
  const wasmName = q.scores[0].scorer.split('@')[0].replace(/^scr_/, '')
  const wasmPath = join(root, 'dist-wasm', `${wasmName}.wasm`)
  if (!existsSync(wasmPath)) { console.log(`${qid}: missing ${wasmName}.wasm`); failed++; continue }
  const res = await runScorer(new Uint8Array(readFileSync(wasmPath)), { scored_responses: resp })
  if (!res.ok) { console.log(`${qid}: scorer error ${res.error}`); failed++; continue }
  console.log(`\n${qid} (${q.scores[0].scorer}):`)
  for (const s of q.scores) {
    const v = ptr(res.output, s.path)
    if (v === undefined) failed++
    console.log(`  ${s.id.padEnd(20)} ${s.path.padEnd(28)} = ${JSON.stringify(v)}`)
  }
}
process.exit(failed ? 1 : 0)
