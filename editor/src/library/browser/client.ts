import { listAllEntities, fetchEntityBody, type FetchOpts } from '../../persistence/library'

export interface LibEntity { id: string; version: string; title: string | null }
export interface LibraryClient {
  listEntities: (etype: string) => Promise<LibEntity[]>
  fetchEntityBody: (ref: string) => Promise<Record<string, unknown> | null>
}

// editable types (have editors) first, then inspect-only types
export const LIBRARY_TYPES: { type: string; label: string }[] = [
  { type: 'prompt', label: 'Prompt' },
  { type: 'option', label: 'Option' },
  { type: 'context', label: 'Context' },
  { type: 'instruction', label: 'Instruction' },
  { type: 'message', label: 'Message' },
  { type: 'question', label: 'Question' },
  { type: 'item', label: 'Item' },
  { type: 'placeholder', label: 'Placeholder' },
  { type: 'help', label: 'Help' },
  { type: 'regex', label: 'RegEx' },
  { type: 'solution', label: 'Solution' },
  { type: 'scorer', label: 'Scorer' },
]

export function defaultLibraryClient(opts: FetchOpts = {}): LibraryClient {
  return {
    listEntities: (etype) => listAllEntities(etype, opts).then((rs) => rs.map((r) => ({ id: r.id, version: r.version, title: r.title }))),
    fetchEntityBody: (ref) => fetchEntityBody(ref, opts) as Promise<Record<string, unknown> | null>,
  }
}
