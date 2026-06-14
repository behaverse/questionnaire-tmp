import type { Questionnaire } from './types'

export function newQuestionnaire(): Questionnaire {
  return {
    '@context': 'https://behaverse.org/schemas/questionnaire/context.jsonld',
    metadata: { id: 'qst_untitled', title: 'Untitled questionnaire', version: 'v26.0609', language: 'en' },
    pages: [{ id: 'page_1', title: 'Page 1', elements: [{ ref: 'msg_placeholder@v26.0609' }] }],
  }
}
