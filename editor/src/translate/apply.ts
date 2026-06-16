import type { EntityBody } from '../model/types'
import type { TransKind, TransField } from './types'
import { setChoiceText, setLabel, setUnits, setStatus as setOptStatus, type EditableOption } from '../option/ops'
import { parseRef } from '../persistence/library'
import { draftVersion } from '../pool/mint'

type ContentBody = { content?: Record<string, { status?: string; text?: string }> } & Record<string, unknown>

function setContentText(body: ContentBody, locale: string, text: string): ContentBody {
  const entry = body.content?.[locale] ?? { status: 'draft' }
  return { ...body, content: { ...body.content, [locale]: { ...entry, status: entry.status ?? 'draft', text } } }
}
function setContentStatus(body: ContentBody, locale: string, status: string): ContentBody {
  const entry = body.content?.[locale] ?? {}
  return { ...body, content: { ...body.content, [locale]: { ...entry, status } } }
}

/** Apply a target-locale text edit to an entity body (immutable). */
export function applyTranslation(body: EntityBody, kind: TransKind, field: TransField, locale: string, value: string): EntityBody {
  if (kind === 'option') {
    const opt = body as unknown as EditableOption
    if (field.t === 'choice') return setChoiceText(opt, field.index, locale, value) as unknown as EntityBody
    if (field.t === 'opt-label') return setLabel(opt, locale, value) as unknown as EntityBody
    if (field.t === 'opt-units') return setUnits(opt, locale, value) as unknown as EntityBody
    return body
  }
  return setContentText(body as ContentBody, locale, value) as unknown as EntityBody
}

/** Apply a target-locale status edit. */
export function applyStatus(body: EntityBody, kind: TransKind, locale: string, status: string): EntityBody {
  if (kind === 'option') return setOptStatus(body as unknown as EditableOption, locale, status) as unknown as EntityBody
  return setContentStatus(body as ContentBody, locale, status) as unknown as EntityBody
}

/** The deterministic pool key that forkRefAction produces for a Library ref. */
export function forkedRef(ref: string): string | null {
  const p = parseRef(ref)
  return p ? `${p.id}@${draftVersion(p.version)}` : null
}
