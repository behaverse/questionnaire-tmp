export interface ContentMap { [lang: string]: { status: string; text?: string } }

const STATUSES = ['draft', 'complete', 'validated']

export function ContentTextEditor({ content, locale, label, primaryLocale, onChange }: {
  content: ContentMap; locale: string; label: string; primaryLocale?: string; onChange: (c: ContentMap) => void
}) {
  const entry = content?.[locale] ?? { status: 'draft' }
  const setText = (text: string) => onChange({ ...content, [locale]: { ...entry, status: entry.status ?? 'draft', text } })
  const setStatus = (status: string) => onChange({ ...content, [locale]: { ...entry, status } })
  const source = primaryLocale && primaryLocale !== locale ? content?.[primaryLocale]?.text : undefined
  return (
    <div className="space-y-1">
      <label className="block text-sm">{label} ({locale})
        <textarea aria-label={label} value={entry.text ?? ''} onChange={(e) => setText(e.target.value)} rows={2}
                  className="mt-1 w-full rounded border border-slate-300 px-2 py-1" />
      </label>
      {source !== undefined && <p className="text-[11px] text-slate-400">primary: {source || '(empty)'}</p>}
      <label className="text-xs text-slate-500">Status
        <select aria-label={`${label} status`} value={entry.status ?? 'draft'} onChange={(e) => setStatus(e.target.value)}
                className="ml-1 rounded border border-slate-300 px-1 py-0.5">
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </label>
    </div>
  )
}
