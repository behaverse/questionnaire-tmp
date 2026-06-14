// Loose structural mirror of canonical Schema 2 (refs kept intact). The schema
// is the source of truth for validation; these types exist for ergonomic editing.

export interface Metadata {
  id: string
  title?: string
  description?: string
  version?: string
  language?: string
  available_languages?: string[]
  [key: string]: unknown
}

export interface MessageRefElement { ref: string } // ref starts msg_ or it_
export interface SavedItemElement { ref: string; required?: boolean; show_if?: string; [k: string]: unknown }
// `option` may be omitted on inline items inside a Section that supplies `shared_option`.
export interface InlineItemElement { question: unknown; option?: unknown; required?: boolean; show_if?: string; [k: string]: unknown }
export interface Section {
  id: string
  title?: string
  shared_option?: unknown
  elements: SectionElement[]
  show_if?: string
  style?: unknown
  [k: string]: unknown
}
export type SectionElement = MessageRefElement | SavedItemElement | InlineItemElement
export type PageElement = Section | SectionElement

export interface Page {
  id: string
  title?: string
  description?: string
  elements: PageElement[]
  style?: unknown
  flow?: unknown
  show_if?: string
  [k: string]: unknown
}

export interface Block {
  id: string
  title?: string
  page_ids: string[]
  style?: unknown
  show_if?: string
  [k: string]: unknown
}

export interface Questionnaire {
  '@context'?: string
  metadata: Metadata
  pages: Page[]
  blocks?: Block[]
  style?: unknown
  flow?: unknown
  [k: string]: unknown
}
