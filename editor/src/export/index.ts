// editor/src/export/index.ts
import type { Questionnaire, EntityBody } from '../model/types'
import { projectForPreview } from '../preview/project'
import { downloadText } from '../persistence/file'
import { toMarkdown } from './markdown'
import { toSurveyJS } from './surveyjs'

function buildRuntime(model: Questionnaire, pool: Record<string, EntityBody>) {
  return projectForPreview(model, (ref) => (pool[ref] as EntityBody) ?? null).runtime
}

export function exportMarkdown(model: Questionnaire, pool: Record<string, EntityBody>, locale: string): void {
  const md = toMarkdown(buildRuntime(model, pool), model, locale)
  downloadText(md, `${model.metadata?.id ?? 'questionnaire'}.md`, 'text/markdown')
}

/** Downloads the SurveyJS JSON and returns the list of dropped features (for the dialog). */
export function exportSurveyJS(model: Questionnaire, pool: Record<string, EntityBody>, locale: string): string[] {
  const { json, dropped } = toSurveyJS(buildRuntime(model, pool), model, locale)
  downloadText(JSON.stringify(json, null, 2), `${model.metadata?.id ?? 'questionnaire'}.surveyjs.json`, 'application/json')
  return dropped
}
