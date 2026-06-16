import type { Questionnaire, EntityBody } from '../model/types'

/** Where the currently-open questionnaire came from. */
export type Source =
  | { kind: 'new' }
  | { kind: 'file'; name: string }
  | { kind: 'library'; id: string; version: string }
  | { kind: 'sample'; id: string }

/** A persisted editor draft. */
export interface Draft { model: Questionnaire; source: Source; savedAt: number; entities: Record<string, EntityBody> }
