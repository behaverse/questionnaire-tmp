import type { EntityBody } from '../model/types'
import { mintEntityId } from './mint'

export function buildContext(ids: Set<string>, draftVer: string, locale: string): { ref: string; body: EntityBody } {
  const id = mintEntityId('ctx', ids)
  return { ref: `${id}@${draftVer}`, body: { id, content: { [locale]: { status: 'draft', text: '' } } } }
}

export function buildInstruction(ids: Set<string>, draftVer: string, locale: string): { ref: string; body: EntityBody } {
  const id = mintEntityId('ins', ids)
  return { ref: `${id}@${draftVer}`, body: { id, content: { [locale]: { status: 'draft', text: '' } } } }
}

export function buildMessage(ids: Set<string>, draftVer: string, locale: string): { ref: string; body: EntityBody } {
  const id = mintEntityId('msg', ids)
  return { ref: `${id}@${draftVer}`, body: { id, type: ['information'], content: { [locale]: { status: 'draft', text: '' } } } }
}
