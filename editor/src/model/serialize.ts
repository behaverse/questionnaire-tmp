import type { Questionnaire } from './types'

export function parseQuestionnaire(text: string): Questionnaire {
  const obj = JSON.parse(text) // throws on malformed JSON
  if (typeof obj !== 'object' || obj === null || !('metadata' in obj)) {
    throw new Error('Not a questionnaire: missing "metadata"')
  }
  return obj as Questionnaire
}

export function serializeQuestionnaire(model: Questionnaire): string {
  return JSON.stringify(model, null, 2)
}
