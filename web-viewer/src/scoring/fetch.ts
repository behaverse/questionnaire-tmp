import type { PinnedScorerImpl } from './types'
import { ScorerIntegrityError, UnsupportedScorerKind } from './types'

const cache = new Map<string, ArrayBuffer>()

async function sha256Hex(buf: ArrayBuffer): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', buf)
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('')
}

/** Fetch a wasm scorer's bytes and verify its sha256. Deduped by sha256 across scores. */
export async function fetchScorerWasm(impl: PinnedScorerImpl, fetchImpl: typeof fetch = fetch): Promise<ArrayBuffer> {
  if (impl.kind !== 'wasm') throw new UnsupportedScorerKind(impl.kind)
  const hit = cache.get(impl.sha256)
  if (hit) return hit
  const resp = await fetchImpl(impl.url)
  if (!resp.ok) throw new ScorerIntegrityError(`fetch failed: ${resp.status}`)
  const buf = await resp.arrayBuffer()
  const hex = await sha256Hex(buf)
  if (hex !== impl.sha256) throw new ScorerIntegrityError(`sha256 mismatch for ${impl.url}`)
  cache.set(impl.sha256, buf)
  return buf
}
