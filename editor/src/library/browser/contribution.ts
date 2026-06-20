// editor/src/library/browser/contribution.ts
export interface EditedEntity { id: string; version: string; type: string; body: Record<string, unknown> }
export interface Contribution {
  schema: 'questionnaire-contribution/v1'
  generated_at: string
  entries: { id: string; source_version: string; type: string; body: Record<string, unknown> }[]
}

export function buildContribution(edited: EditedEntity[], generatedAt: string): Contribution {
  return {
    schema: 'questionnaire-contribution/v1',
    generated_at: generatedAt,
    entries: edited.map((e) => ({ id: e.id, source_version: e.version, type: e.type, body: e.body })),
  }
}

export function contributionFilename(ts: string): string {
  return `library-contribution.${ts}.json`
}

export function downloadContribution(edited: EditedEntity[], generatedAt: string): void {
  const blob = new Blob([JSON.stringify(buildContribution(edited, generatedAt), null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = contributionFilename(generatedAt)
  a.click()
  URL.revokeObjectURL(url)
}
