// @vitest-environment node
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { vendorSource } from '../../scripts/build-scorer-host.mjs'

test('vendored scorer host matches the SP1 source (run build-scorer-host.mjs if this fails)', () => {
  const vendored = readFileSync(fileURLToPath(new URL('./vendor/scorerHost.ts', import.meta.url)), 'utf8')
  expect(vendored).toBe(vendorSource())
})
