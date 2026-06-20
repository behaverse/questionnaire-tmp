import { existsSync, mkdirSync, copyFileSync } from 'node:fs'
import { execSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

// Ensure the renderer lib (which now also emits scoring.js) is built.
const scoringLib = fileURLToPath(new URL('../../web-viewer/dist-lib/scoring.js', import.meta.url))
if (!existsSync(scoringLib)) {
  const cwd = fileURLToPath(new URL('../../web-viewer/', import.meta.url))
  console.log('[editor] building renderer+scoring library (web-viewer dist-lib)…')
  execSync('npm run build:lib', { cwd, stdio: 'inherit' })
}

// Copy the reference PHQ-9 wasm into the editor's public dir for local preview fetch.
const src = fileURLToPath(new URL('../../questionnaire-scorer/dist-wasm/phq9.wasm', import.meta.url))
const destDir = fileURLToPath(new URL('../public/scorers/', import.meta.url))
if (existsSync(src)) {
  mkdirSync(destDir, { recursive: true })
  copyFileSync(src, fileURLToPath(new URL('../public/scorers/phq9.wasm', import.meta.url)))
  console.log('[editor] copied phq9.wasm → public/scorers/phq9.wasm')
} else {
  console.warn('[editor] questionnaire-scorer/dist-wasm/phq9.wasm not found — PHQ-9 preview scoring will be unavailable')
}
