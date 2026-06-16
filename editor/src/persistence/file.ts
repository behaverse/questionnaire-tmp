import type { Questionnaire, EntityBody } from '../model/types'
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

export function bundleData(model: Questionnaire, pool: Record<string, EntityBody>) {
  return { questionnaire: model, entities: pool }
}

export function bundleFilename(model: Questionnaire): string {
  const id = model.metadata?.id ?? 'questionnaire'
  return `${id}.bundle.json`
}

export function parseBundle(text: string): { questionnaire: Questionnaire; entities: Record<string, EntityBody> } {
  const obj = JSON.parse(text) as { questionnaire?: unknown; entities?: unknown }
  const q = obj?.questionnaire as Questionnaire | undefined
  const entities = obj?.entities as Record<string, EntityBody> | undefined
  if (!q?.metadata || !entities || typeof entities !== 'object') throw new Error('Not a valid questionnaire bundle')
  return { questionnaire: q, entities }
}

/** Browser-only: download the {questionnaire, entities} bundle. */
export function exportBundle(model: Questionnaire, pool: Record<string, EntityBody>): void {
  const blob = new Blob([JSON.stringify(bundleData(model, pool), null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = bundleFilename(model)
  a.click()
  URL.revokeObjectURL(url)
}
