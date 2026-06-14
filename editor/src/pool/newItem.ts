import type { EntityBody } from '../model/types'
import { mintEntityId } from './mint'

function defaultOption(locale: string) {
  return {
    input_data_type: 'choice', measurement_type: 'ordinal', selection: 'single',
    options: [{ index: 1, value: 0 }, { index: 2, value: 1 }],
    content: { [locale]: { status: 'draft', options: [{ index: 1, text: 'Option 1' }, { index: 2, text: 'Option 2' }] } },
  }
}

export interface NewItem {
  promptRef: string
  promptBody: EntityBody
  item: { question: { prompt: { ref: string } }; option: ReturnType<typeof defaultOption> }
}

export function buildNewItem(existingIds: Set<string>, draftVer: string, locale: string): NewItem {
  const id = mintEntityId('pr', existingIds)
  const promptRef = `${id}@${draftVer}`
  const promptBody: EntityBody = { id, content: { [locale]: { status: 'draft', text: '' } } }
  return { promptRef, promptBody, item: { question: { prompt: { ref: promptRef } }, option: defaultOption(locale) } }
}
