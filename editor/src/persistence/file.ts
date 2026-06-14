import type { Questionnaire } from '../model/types'
import { parseQuestionnaire, serializeQuestionnaire } from '../model/serialize'

function readFileText(file: File): Promise<string> {
  // Prefer Blob.text() (real browsers); fall back to FileReader (jsdom's File lacks .text()).
  if (typeof file.text === 'function') return file.text()
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsText(file)
  })
}

export async function readQuestionnaireFile(file: File): Promise<Questionnaire> {
  const text = await readFileText(file)
  return parseQuestionnaire(text)
}

export function downloadFilename(model: Questionnaire): string {
  const id = model.metadata?.id ?? 'questionnaire'
  return `${id}.json`
}

/** Browser-only: trigger a download of the serialized model. Not unit-tested (DOM side-effect). */
export function exportToFile(model: Questionnaire): void {
  const blob = new Blob([serializeQuestionnaire(model)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = downloadFilename(model)
  a.click()
  URL.revokeObjectURL(url)
}
