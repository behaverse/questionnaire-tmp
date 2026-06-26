import type { ResolvedDefinition } from '../api/types'
import { buildRenderModel } from '../definition/renderModel'
import { downloadText } from '../lib/download'
import { toMarkdown } from './markdown'
import { toSurveyJS } from './surveyjs'

export function exportMarkdown(def: ResolvedDefinition, lang: string): void {
  const md = toMarkdown(buildRenderModel(def, lang), def.metadata)
  downloadText(md, `${def.metadata.id}.md`, 'text/markdown')
}

/** Downloads the SurveyJS JSON; returns the list of dropped features (for the inline notice). */
export function exportSurveyJS(def: ResolvedDefinition, lang: string): string[] {
  const { json, dropped } = toSurveyJS(buildRenderModel(def, lang), def.scores ?? [])
  const withTitle = { title: def.metadata.title, ...(def.metadata.description ? { description: def.metadata.description } : {}), ...json }
  downloadText(JSON.stringify(withTitle, null, 2), `${def.metadata.id}.surveyjs.json`, 'application/json')
  return dropped
}
