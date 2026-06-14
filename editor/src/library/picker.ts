export function buildRef(id: string, version: string): string {
  return `${id}@${version}`
}

export function bodySnippet(body: Record<string, unknown> | null, locale: string): string {
  if (!body) return ''
  const content = body.content as Record<string, { text?: string; label?: string }> | undefined
  const entry = content?.[locale] ?? (content ? Object.values(content)[0] : undefined)
  return entry?.text ?? entry?.label ?? String(body.id ?? '')
}
