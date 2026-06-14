import { existsSync } from 'node:fs'
import { execSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const lib = fileURLToPath(new URL('../../web-viewer/dist-lib/renderer.js', import.meta.url))
if (!existsSync(lib)) {
  const cwd = fileURLToPath(new URL('../../web-viewer/', import.meta.url))
  console.log('[editor] building renderer library (web-viewer dist-lib)…')
  execSync('npm run build:lib', { cwd, stdio: 'inherit' })
}
