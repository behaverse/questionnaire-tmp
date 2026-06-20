import type { PinnedScorerImpl } from '@behaverse/questionnaire-renderer'

// sha256 of questionnaire-scorer/dist-wasm/phq9.wasm (kept in sync; guard test below).
export const PHQ9_SHA256 = 'd5a9aee827b03eb261de8c6ee6aec7d96682909e3ab47cad9361ed77943c505f'

// Scorers whose wasm the editor bundles for local preview. Preview-only — never authored.
const REGISTRY: Record<string, PinnedScorerImpl> = {
  scr_phq9: { kind: 'wasm', url: '/scorers/phq9.wasm', sha256: PHQ9_SHA256 },
}

/** Bare id before '@' (e.g. 'scr_phq9' from 'scr_phq9@v26.0602'). */
export function scorerImpl(scorerRef: string): PinnedScorerImpl | null {
  const bareId = scorerRef.split('@')[0]
  return REGISTRY[bareId] ?? null
}

export function isKnownScorer(scorerRef: string): boolean {
  return scorerImpl(scorerRef) !== null
}
