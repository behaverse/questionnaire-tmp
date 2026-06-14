export interface ContentMap { [lang: string]: { status: string; text?: string } }

export function ContentTextEditor({ content, locale, label, onChange }: {
  content: ContentMap; locale: string; label: string; onChange: (c: ContentMap) => void
}) {
  const entry = content?.[locale] ?? { status: 'draft' }
  const setText = (text: string) => onChange({ ...content, [locale]: { ...entry, status: entry.status ?? 'draft', text } })
  return (
    <label className="block text-sm">{label} ({locale})
      <textarea aria-label={label} value={entry.text ?? ''} onChange={(e) => setText(e.target.value)} rows={2}
                className="mt-1 w-full rounded border border-slate-300 px-2 py-1" />
    </label>
  )
}
