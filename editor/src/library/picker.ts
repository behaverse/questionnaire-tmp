export function buildRef(id: string, version: string): string {
  return `${id}@${version}`
}

export function bodySnippet(body: Record<string, unknown> | null, locale: string): string {
  if (!body) return ''
  const content = body.content as Record<string, { text?: string; label?: string }> | undefined
  const entry = content?.[locale] ?? (content ? Object.values(content)[0] : undefined)
  return entry?.text ?? entry?.label ?? String(body.id ?? '')
}

/** All searchable text in an entity body (id + every locale's text/label/units/description and
 *  option anchor texts), lowercased — so the picker can filter by CONTENT, not just id/title. */
export function searchableText(body: Record<string, unknown> | null): string {
  if (!body) return ''
  const parts: string[] = [String(body.id ?? '')]
  const content = body.content as Record<string, Record<string, unknown>> | undefined
  if (content) {
    for (const loc of Object.values(content)) {
      if (!loc || typeof loc !== 'object') continue
      for (const k of ['text', 'label', 'units', 'description']) {
        if (typeof loc[k] === 'string') parts.push(loc[k] as string)
      }
      for (const o of (loc.options as { text?: string }[] | undefined) ?? []) {
        if (o && typeof o.text === 'string') parts.push(o.text)
      }
    }
  }
  return parts.join(' ').toLowerCase()
}
