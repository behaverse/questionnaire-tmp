import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

function block(path: string): string {
  const txt = readFileSync(fileURLToPath(new URL(path, import.meta.url)), 'utf8')
  const start = txt.indexOf('/* qv-theme:start')
  const end = txt.indexOf('/* qv-theme:end */')
  expect(start).toBeGreaterThanOrEqual(0)
  expect(end).toBeGreaterThan(start)
  return txt.slice(start, end)
}

test('the qv-theme block is byte-identical in index.css and lib.css', () => {
  expect(block('../index.css')).toBe(block('../renderer/lib.css'))
})
