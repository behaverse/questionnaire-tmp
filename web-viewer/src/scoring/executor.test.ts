// @vitest-environment node
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { createHash } from 'node:crypto'
import { compileScorers, makeScoreCache } from './executor'
import type { Runtime } from '../renderer/types'
import { makeFakeEvaluator } from '../logic/evaluator'
import { elementKey, pageElementFallback } from '../renderer/keys'

const wasm = readFileSync(fileURLToPath(new URL('../../../questionnaire-scorer/dist-wasm/phq9.wasm', import.meta.url)))
const sha = createHash('sha256').update(wasm).digest('hex')
const fetchWasm = async () => new Response(wasm) as unknown as Response

function phq9Runtime(): Runtime {
  const item = (n: number) => ({
    id: `item_${n}`,
    question: { prompt: { id: `pr_phq9_${n}`, content: { en: { text: `q${n}` } } } },
    option: { input_data_type: 'choice', measurement_type: 'ordinal', selection: 'single',
      options: [{ index: 1, value: 0 }, { index: 2, value: 1 }, { index: 3, value: 2 }, { index: 4, value: 3 }],
      content: { en: { options: [{ index: 1, text: 'a' }, { index: 2, text: 'b' }, { index: 3, text: 'c' }, { index: 4, text: 'd' }] } } },
  })
  const impl = { kind: 'wasm', url: 'x', sha256: sha }
  return {
    provenance: {}, metadata: { id: 'phq9', title: 'PHQ-9', language: 'en' }, locale: 'en',
    pages: [{ id: 'p1', elements: Array.from({ length: 9 }, (_, i) => item(i + 1)) }],
    scores: [
      { id: 'phq9_total', scorer: 'scr_phq9@v26.0602', path: '/total', impl },
      { id: 'phq9_severity', scorer: 'scr_phq9@v26.0602', path: '/severity', impl },
      { id: 'phq9_band_label', scorer: 'scr_phq9@v26.0602', path: '/band/label', impl },
    ],
  } as unknown as Runtime
}

test('compiles, runs once per scorer, and resolves scores by JSON Pointer', async () => {
  const rt = phq9Runtime()
  const ev = makeFakeEvaluator()
  const set = await compileScorers(rt, fetchWasm as never)
  expect(set.failures.size).toBe(0)
  const cache = makeScoreCache(set, rt)
  // elementKey returns element.id when present; items have id='item_N' so keys are 'item_1'..'item_9'
  const answers: Record<string, number> = {}
  rt.pages[0].elements.forEach((el: any, i: number) => {
    const key = elementKey(el, pageElementFallback('p1', i))
    answers[key] = 1 // all 1 → total 9
  })
  cache.refresh(answers, ev)
  expect(cache.resolver.score('phq9_total')).toBe(9)
  expect(cache.resolver.score('phq9_severity')).toBe('mild')
  expect(cache.resolver.score('phq9_band_label')).toBe('Mild Depression')
  expect(cache.resolver.score('unknown_id')).toBeNull()
})

test('scorerOutputs() returns the cached structured outputs keyed by scorer ref', async () => {
  const rt = phq9Runtime()
  const ev = makeFakeEvaluator()
  const set = await compileScorers(rt, fetchWasm as never)
  const cache = makeScoreCache(set, rt)
  const answers: Record<string, number> = {}
  rt.pages[0].elements.forEach((el: any, i: number) => { answers[elementKey(el, pageElementFallback('p1', i))] = 1 })
  cache.refresh(answers, ev)
  const outputs = cache.scorerOutputs()
  expect(Object.keys(outputs)).toEqual(['scr_phq9@v26.0602'])
  expect((outputs['scr_phq9@v26.0602'] as any).total).toBe(9)
})

test('a failed/absent scorer resolves scores to null (no throw)', async () => {
  // Use a distinct sha so the module-level fetch cache (keyed by sha256) does not return the
  // real wasm compiled in the first test. The sha mismatch causes ScorerIntegrityError inside
  // compileScorers, which records the failure without throwing.
  const badSha = '0'.repeat(64)
  const badImpl = { kind: 'wasm' as const, url: 'x', sha256: badSha }
  const rt = {
    ...phq9Runtime(),
    scores: [
      { id: 'phq9_total',     scorer: 'scr_phq9@v26.0602', path: '/total',      impl: badImpl },
      { id: 'phq9_severity',  scorer: 'scr_phq9@v26.0602', path: '/severity',   impl: badImpl },
      { id: 'phq9_band_label',scorer: 'scr_phq9@v26.0602', path: '/band/label', impl: badImpl },
    ],
  } as unknown as Runtime
  const ev = makeFakeEvaluator()
  const badFetch = async () => new Response('not wasm') as unknown as Response
  const set = await compileScorers(rt, badFetch as never)
  expect(set.failures.size).toBe(1)
  const cache = makeScoreCache(set, rt)
  cache.refresh({}, ev)
  expect(cache.resolver.score('phq9_total')).toBeNull()
})
