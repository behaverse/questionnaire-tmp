// Hand-written response types for the Library Core read API.
// Maintained by hand; diff against library-web/openapi.snapshot.json when the API changes.
// (CatalogueCard / Paginated / VersionInfo mirror the Pydantic models in library/src/library/models.py.)

export interface CatalogueCard {
  id: string
  version: string
  entity_type: string
  title: string | null
  short_title: string | null
  description: string | null
  status: string
  effective_license: string | null
  language: string | null
  available_languages: string[] | null
  item_count: number | null
  estimated_minutes: number | null
  domain: string[]
  population: string[]
  instrument_id: string | null
  variant: string | null
}

// A group of forms that share an instrument_id (the unit /v1/questionnaires now returns).
export interface InstrumentGroup {
  instrument_id: string | null
  title: string | null
  form_count: number
  languages: string[]
  domain: string[]
  forms: CatalogueCard[]
}

export interface Paginated<T> { items: T[]; total: number; limit: number; offset: number }

export interface QuestionHit { id: string; version: string; text?: string | null; language?: string | null }

export interface VersionInfo {
  id: string
  version: string
  status: string
  severity: string | null
  date: string | null
}

export interface FacetValue { value: string; count: number; label?: string }
export interface FacetResponse { facet_type: string; values: FacetValue[] }

export interface CatalogueStats { questionnaires: number; questions: number; options: number; languages: number }

// Resolved Schema-2 definition (only the fields the UI reads; unknown keys allowed).
export interface LangContent {
  status?: string
  text?: string
  label?: string
  options?: { index: number; text?: string; units?: string }[]
  [k: string]: unknown
}
export interface ResolvedPrompt {
  ref?: string
  _unresolved?: boolean
  name?: string
  dimension?: string
  reversed?: boolean
  subscales?: string[]
  content?: Record<string, LangContent>
}
export interface ResolvedOption {
  ref?: string
  _unresolved?: boolean
  input_data_type?: string
  measurement_type?: string
  selection?: string
  options?: { index: number; value?: number }[]
  content?: Record<string, LangContent>
}
export interface ResolvedMessage {
  ref?: string
  _unresolved?: boolean
  type?: string[]
  content?: Record<string, LangContent>
}
export interface ResolvedQuestion {
  ref?: string
  prompt?: ResolvedPrompt
  context?: { content?: Record<string, LangContent> }
  instruction?: { content?: Record<string, LangContent> }
}
export interface DefElement {
  // one of: message ref | item (question+option) | section (nested elements + shared_option)
  ref?: string
  _unresolved?: boolean
  content?: Record<string, LangContent>   // message
  question?: ResolvedQuestion
  option?: ResolvedOption
  required?: boolean
  show_if?: string
  id?: string
  shared_option?: ResolvedOption
  elements?: DefElement[]
  style?: { layout?: string }
}
export interface DefPage { id?: string; title?: string; elements?: DefElement[] }
export interface ScoreDecl { id: string; scorer: string; path: string; name?: string }
export interface DefAuthor { name: string }
export interface DefMetadata {
  id: string
  title: string
  short_title?: string
  variant?: string | null
  description?: string
  version: string
  language?: string
  available_languages?: string[]
  authors?: DefAuthor[]
  publication?: { year?: number; citation?: string; doi?: string }
  license?: string
  rights_holder?: string
  classification?: {
    domain?: string[]; population?: string[]; age_range?: number[]; administration_mode?: string[]
  }
  psychometrics?: { item_count?: number; estimated_minutes?: number; reliability?: unknown[] }
}
export interface ResolvedDefinition {
  metadata: DefMetadata
  pages?: DefPage[]
  scores?: ScoreDecl[]
}
