import type { Questionnaire } from '../model/types'

/** Where the currently-open questionnaire came from. */
export type Source =
  | { kind: 'new' }
  | { kind: 'file'; name: string }
  | { kind: 'library'; id: string; version: string }

/** A persisted editor draft. */
export interface Draft { model: Questionnaire; source: Source; savedAt: number; entities: Record<string, unknown> }
