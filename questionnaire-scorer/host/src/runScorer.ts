import type { ScorerResult } from './types.js'

interface ScorerExports {
  memory: WebAssembly.Memory
  scorer_abi_version(): number
  scorer_alloc(len: number): number
  scorer_dealloc(ptr: number, len: number): void
  scorer_score(inPtr: number, inLen: number): number
}

export interface CompiledScorer {
  abiVersion(): number
  run(input: unknown): ScorerResult
}

export async function compileScorer(wasm: BufferSource): Promise<CompiledScorer> {
  const { instance } = await WebAssembly.instantiate(wasm, {})
  const ex = instance.exports as unknown as ScorerExports
  const abi = ex.scorer_abi_version()
  const enc = new TextEncoder()
  const dec = new TextDecoder()

  function run(input: unknown): ScorerResult {
    let inPtr = 0
    let inLen = 0
    let outPtr = 0
    let outTotal = 0
    try {
      const bytes = enc.encode(JSON.stringify(input))
      inLen = bytes.length
      inPtr = ex.scorer_alloc(inLen)
      new Uint8Array(ex.memory.buffer, inPtr, inLen).set(bytes)
      outPtr = ex.scorer_score(inPtr, inLen)
      // memory may have grown during score(); re-read the buffer.
      const view = new DataView(ex.memory.buffer)
      const jsonLen = view.getUint32(outPtr, true)
      outTotal = 4 + jsonLen
      const jsonBytes = new Uint8Array(ex.memory.buffer, outPtr + 4, jsonLen)
      return JSON.parse(dec.decode(jsonBytes)) as ScorerResult
    } catch (e) {
      return { ok: false, error: `trap: ${e instanceof Error ? e.message : String(e)}`, trapped: true }
    } finally {
      if (inPtr) { try { ex.scorer_dealloc(inPtr, inLen) } catch { /* noop */ } }
      if (outPtr) { try { ex.scorer_dealloc(outPtr, outTotal) } catch { /* noop */ } }
    }
  }

  return { abiVersion: () => abi, run }
}

export async function runScorer(wasm: BufferSource, input: unknown): Promise<ScorerResult> {
  const s = await compileScorer(wasm)
  if (s.abiVersion() !== 1) return { ok: false, error: `unsupported scorer ABI version ${s.abiVersion()}` }
  return s.run(input)
}
