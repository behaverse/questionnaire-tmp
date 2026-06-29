/** Faithful-projection Schema 3 shapes (ground truth:
 *  questionnaire-runtime-denormaliser/tests/fixtures/mini_phq.py — NOT schemas/runtime/examples/). */
export type LocaleContent = {
  status?: string
  text?: string
  label?: string
  units?: string
  options?: { index: number; text: string }[]
}
export type ContentMap = Record<string, LocaleContent>
export type ContentEntity = { id?: string; name?: string; content?: ContentMap; reversed?: boolean }

export type OptionEntity = {
  id?: string
  input_data_type: string
  measurement_type: string
  selection?: string
  min?: number
  max?: number
  step?: number
  options?: { index: number; value: number | string }[]
  content?: ContentMap
}

export type Question = { prompt?: ContentEntity; context?: ContentEntity; instruction?: ContentEntity }
export type ItemElement = {
  id?: string
  question: Question
  option: OptionEntity
  required?: boolean
  show_if?: string
  style?: { layout?: string }
}
export type SectionElement = {
  id?: string
  title?: string
  shared_option?: OptionEntity
  elements: RuntimeElement[]
  show_if?: string
}
export type MessageElement = ContentEntity
export type RuntimeElement = ItemElement | SectionElement | MessageElement | Record<string, unknown>

export type RuntimePage = { id: string; title?: string; elements: RuntimeElement[] }
export type Runtime = {
  provenance: Record<string, unknown>
  metadata: { id: string; title: string; description?: string; language: string }
  locale?: string
  available_locales?: string[]
  style?: Record<string, unknown>
  flow?: Record<string, unknown>
  blocks?: { id?: string; page_ids?: string[] }[]
  pages: RuntimePage[]
  scores?: PinnedScore[]
  logic?: unknown[]
  validation?: unknown[]
  x_show_score?: boolean
  x_show_score_live?: boolean
}

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

export type AnswerValue = number | string | (number | string)[] | null
export type MergedChoice = { index: number; value: number | string; text: string }

export class RenderError extends Error {}
