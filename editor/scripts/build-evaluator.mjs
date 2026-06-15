import { execSync } from 'node:child_process'
import { cpSync, mkdirSync, rmSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const evalWeb = join(here, '..', '..', 'questionnaire-expression-evaluator', 'web')
const dest = join(here, '..', 'src', 'logic', 'wasm')

execSync('. "$HOME/.cargo/env" && wasm-pack build --target web --out-dir pkg-web', {
  cwd: evalWeb, stdio: 'inherit', shell: '/bin/bash',
})
rmSync(dest, { recursive: true, force: true })
mkdirSync(dest, { recursive: true })
for (const f of ['questionnaire_expr_web.js', 'questionnaire_expr_web_bg.wasm', 'questionnaire_expr_web.d.ts', 'questionnaire_expr_web_bg.wasm.d.ts']) {
  const src = join(evalWeb, 'pkg-web', f)
  if (existsSync(src)) cpSync(src, join(dest, f))
}
console.log('[editor] evaluator wasm copied to src/logic/wasm/')
