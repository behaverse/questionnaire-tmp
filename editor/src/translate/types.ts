import type { NodePath } from '../model/path'

export type TransKind = 'prompt' | 'context' | 'instruction' | 'message' | 'option'
/** which string within an entity body a row edits */
export type TransField = { t: 'text' } | { t: 'opt-label' } | { t: 'opt-units' } | { t: 'choice'; index: number }

export interface TransRow {
  id: string            // stable key: `${groupId}:${fieldKey}`
  fieldLabel: string    // e.g. "Prompt", "Label", "Units", "Choice 1"
  field: TransField
  source: string        // primary-locale text ('' if none)
  target: string        // editing-locale text ('' if none)
  status: string        // editing-locale status (draft if absent)
  done: boolean         // target non-empty
}

export interface TransGroup {
  groupId: string                 // entityRef or `inline:${pathKey}`
  entityRef: string | null        // ref to fork/write (null for inline option)
  inlinePath: NodePath | null     // path to an inline option (entityRef null)
  kind: TransKind
  title: string                   // human label, e.g. the item's prompt id or "Message"
  rows: TransRow[]
}
