import { describe, it, expect } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { useScoreCache } from './useScoreCache'
import type { LogicEvaluator } from '../logic/types'

// serve the bundled wasm from disk (pretest's ensure-scorers.mjs put it in public/)
// Note: using resolve(__dirname, ...) instead of fileURLToPath(import.meta.url) — jsdom has no file: scheme
// Note: use nodeBuffer.buffer.slice() (not new ArrayBuffer) — jsdom's SubtleCrypto accepts only
// TypedArray-backed ArrayBuffers or node Buffers, not ones created via `new ArrayBuffer(n)`.
const nodeBuffer = readFileSync(resolve(__dirname, '../../public/scorers/phq9.wasm'))
const wasmBuffer: ArrayBuffer = nodeBuffer.buffer.slice(nodeBuffer.byteOffset, nodeBuffer.byteOffset + nodeBuffer.byteLength) as ArrayBuffer
// Mock fetch returning the raw ArrayBuffer (bypasses Response.arrayBuffer() realm mismatch in jsdom)
const fakeFetch = (async (_url: string) => ({
  ok: true,
  status: 200,
  arrayBuffer: async () => wasmBuffer,
})) as unknown as typeof fetch

const PHQ9_SHA = 'd5a9aee827b03eb261de8c6ee6aec7d96682909e3ab47cad9361ed77943c505f'
function item(n: number) {
  return { id: `it_${n}`, question: { prompt: { id: `pr_phq9_${n}` } },
    option: { input_data_type: 'choice', measurement_type: 'ordinal', content: {} } }
}
const runtime = {
  provenance: {}, metadata: { id: 'qst', title: 'PHQ', language: 'en' },
  pages: [{ id: 'p1', elements: Array.from({ length: 9 }, (_, i) => item(i + 1)) }],
  scores: [{ id: 'total', scorer: 'scr_phq9@v26.0602', path: '/total',
    impl: { kind: 'wasm', url: '/scorers/phq9.wasm', sha256: PHQ9_SHA } }],
} as never

// minimal evaluator: reversedValue passthrough is enough for ordinal answers
const ev: LogicEvaluator = {
  condition: () => false, reversedValue: (v) => v,
  compareSolution: () => false, check: () => null,
}

describe('useScoreCache', () => {
  it('compiles the bundled PHQ-9 wasm and computes /total from answers', async () => {
    const { result } = renderHook(() => useScoreCache(runtime, fakeFetch))
    await waitFor(() => expect(result.current).not.toBeNull())
    const cache = result.current!
    const answers = Object.fromEntries(Array.from({ length: 9 }, (_, i) => [`it_${i + 1}`, i % 4])) // 0,1,2,3,0,1,2,3,0 = 12
    cache.refresh(answers, ev)
    expect(cache.resolver.score('total')).toBe(12)
  })

  it('rebuilds the score-input index when the runtime structure changes (no wasm recompile)', async () => {
    // The runtime is live in the editor: a later structure carries a different answer-key for the
    // same prompt. The cache must rebuild its index so the new key still maps (regression: the index
    // was built once at compile time, leaving live answers unmapped → missing_count, total 0).
    const mk = (idPrefix: string) => ({
      provenance: {}, metadata: { id: 'qst', title: 'PHQ', language: 'en' },
      pages: [{ id: 'p1', elements: [{ id: `${idPrefix}_1`, question: { prompt: { id: 'pr_phq9_1' } },
        option: { input_data_type: 'choice', measurement_type: 'ordinal', content: {} } }] }],
      scores: [{ id: 'total', scorer: 'scr_phq9@v26.0602', path: '/total',
        impl: { kind: 'wasm', url: '/scorers/phq9.wasm', sha256: PHQ9_SHA } }],
    }) as never
    const { result, rerender } = renderHook(({ rt }) => useScoreCache(rt, fakeFetch), { initialProps: { rt: mk('itA') } })
    await waitFor(() => expect(result.current).not.toBeNull())
    result.current!.refresh({ itA_1: 3 } as never, ev)
    expect(result.current!.resolver.score('total')).toBe(3)

    // Same scorer set (no recompile), new item key for the same prompt → index must rebuild.
    rerender({ rt: mk('itB') })
    await waitFor(() => expect(result.current).not.toBeNull())
    result.current!.refresh({ itB_1: 2 } as never, ev)
    expect(result.current!.resolver.score('total')).toBe(2)
  })
})
