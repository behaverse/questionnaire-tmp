export interface ContentMap { [lang: string]: { status: string; text?: string } }

const STATUSES = ['draft', 'complete', 'validated']
const LABEL = 'mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500'
const INPUT = 'w-full rounded border border-slate-300 px-2 py-1 text-sm'

export function ContentTextEditor({ content, locale, label, primaryLocale, onChange }: {
  content: ContentMap; locale: string; label: string; primaryLocale?: string; onChange: (c: ContentMap) => void
}) {
  const entry = content?.[locale] ?? { status: 'draft' }
  const setText = (text: string) => onChange({ ...content, [locale]: { ...entry, status: entry.status ?? 'draft', text } })
  const setStatus = (status: string) => onChange({ ...content, [locale]: { ...entry, status } })
  const source = primaryLocale && primaryLocale !== locale ? content?.[primaryLocale]?.text : undefined
  return (
    <div className="space-y-3">
      <label className="block">
        <span className={LABEL}>{label} ({locale})</span>
        <textarea aria-label={label} value={entry.text ?? ''} onChange={(e) => setText(e.target.value)} rows={2}
                  className={INPUT} />
      </label>
      {source !== undefined && <p className="-mt-2 text-[11px] text-slate-400">primary: {source || '(empty)'}</p>}
      <label className="block">
        <span className={LABEL}>Status</span>
        <select aria-label={`${label} status`} value={entry.status ?? 'draft'} onChange={(e) => setStatus(e.target.value)}
                className={INPUT}>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </label>
    </div>
  )
}
