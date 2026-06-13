import { readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const wv = join(here, '..')
const scorerPkg = join(wv, '..', 'questionnaire-scorer')

/** Deterministically transform the SP1 host source into a single self-contained vendored file. */
export function vendorSource() {
  const src = readFileSync(join(scorerPkg, 'host', 'src', 'runScorer.ts'), 'utf8')
  const inlined = src.replace(
    /import type \{ ScorerResult \} from '\.\/types\.js'/,
    `export type ScorerResult = { ok: true; output: unknown } | { ok: false; error: string; trapped?: boolean }`,
  )
  return '// GENERATED — do not edit. Source: questionnaire-scorer/host/src/runScorer.ts\n' + inlined
}

const destDir = join(wv, 'src', 'scoring', 'vendor')
mkdirSync(destDir, { recursive: true })
writeFileSync(join(destDir, 'scorerHost.ts'), vendorSource())
console.log('vendored scorer host → src/scoring/vendor/scorerHost.ts')

// Dev convenience: copy the reference wasm into public/ so ?fixture= can fetch it.
const wasm = join(scorerPkg, 'dist-wasm', 'phq9.wasm')
if (existsSync(wasm)) {
  const pub = join(wv, 'public', 'scorers')
  mkdirSync(pub, { recursive: true })
  copyFileSync(wasm, join(pub, 'phq9.wasm'))
  console.log('copied phq9.wasm → public/scorers/phq9.wasm')
}
