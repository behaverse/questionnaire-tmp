import { execSync } from 'node:child_process'
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, '..')          // questionnaire-scorer/
const repo = join(root, '..')          // repo root

execSync('. "$HOME/.cargo/env" && cargo build -p phq9 --target wasm32-unknown-unknown --release', {
  cwd: root, stdio: 'inherit', shell: '/bin/bash',
})

const built = join(root, 'target', 'wasm32-unknown-unknown', 'release', 'phq9.wasm')
const distDir = join(root, 'dist-wasm')
mkdirSync(distDir, { recursive: true })
const dist = join(distDir, 'phq9.wasm')
copyFileSync(built, dist)

const sha = createHash('sha256').update(readFileSync(dist)).digest('hex')
console.log('phq9.wasm sha256:', sha)

// Keep the live Scorer example's wasm-impl sha256 in sync (surgical replace; preserve formatting).
const entityPath = join(repo, 'schemas/questionnaire/examples/library_examples/scorers/scr_phq9.json')
const txt = readFileSync(entityPath, 'utf8')
const updated = txt.replace(/("kind":\s*"wasm"[\s\S]*?"sha256":\s*")[a-f0-9]{64}(")/, `$1${sha}$2`)
if (updated !== txt) {
  writeFileSync(entityPath, updated)
  console.log('updated scr_phq9.json wasm sha256')
}
