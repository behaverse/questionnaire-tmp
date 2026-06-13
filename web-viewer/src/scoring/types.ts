export type PinnedScorerImpl =
  | { kind: 'wasm'; url: string; sha256: string }
  | { kind: 'http'; url: string }
  | { kind: 'python'; package: string }
  | { kind: 'r'; package: string }

export interface PinnedScore {
  id: string
  scorer: string
  path: string
  impl: PinnedScorerImpl
  name?: string
  description?: string
}

export class ScorerIntegrityError extends Error {}
export class UnsupportedScorerKind extends Error {}
