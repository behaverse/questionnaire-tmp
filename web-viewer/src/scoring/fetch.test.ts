// @vitest-environment node
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { createHash } from 'node:crypto'
import { fetchScorerWasm } from './fetch'
import { ScorerIntegrityError, UnsupportedScorerKind } from './types'

const wasm = readFileSync(fileURLToPath(new URL('../../../questionnaire-scorer/dist-wasm/phq9.wasm', import.meta.url)))
const sha = createHash('sha256').update(wasm).digest('hex')
const okFetch = async () => new Response(wasm) as unknown as Response

test('fetches and returns bytes when sha256 matches', async () => {
  const buf = await fetchScorerWasm({ kind: 'wasm', url: 'x', sha256: sha }, okFetch as never)
  expect(new Uint8Array(buf).length).toBe(wasm.length)
})
test('throws ScorerIntegrityError on sha256 mismatch', async () => {
  await expect(fetchScorerWasm({ kind: 'wasm', url: 'x', sha256: '0'.repeat(64) }, okFetch as never))
    .rejects.toBeInstanceOf(ScorerIntegrityError)
})
test('throws UnsupportedScorerKind for non-wasm', async () => {
  await expect(fetchScorerWasm({ kind: 'http', url: 'x' } as never, okFetch as never))
    .rejects.toBeInstanceOf(UnsupportedScorerKind)
})
