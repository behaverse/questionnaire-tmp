export interface PromptBody {
  id: string
  name?: string
  construct?: string
  dimension?: string
  topics?: string[]
  reversed?: boolean
  content: Record<string, { status: string; text?: string }>
  [k: string]: unknown
}

const LABEL = 'mb-1 block text-xs font-medium text-ed-muted'
const INPUT = 'w-full rounded border border-ed-border px-2 py-1 text-sm'

export function PromptEditor({ prompt, locale, primaryLocale, onChange }: { prompt: PromptBody; locale: string; primaryLocale?: string; onChange: (p: PromptBody) => void }) {
  const entry = prompt.content?.[locale] ?? { status: 'draft' }
  const setText = (text: string) =>
    onChange({ ...prompt, content: { ...prompt.content, [locale]: { ...entry, status: entry.status ?? 'draft', text } } })
  const setStatus = (status: string) =>
    onChange({ ...prompt, content: { ...prompt.content, [locale]: { ...entry, status } } })
  const setField = (k: 'name' | 'construct' | 'dimension', v: string) => {
    const next = { ...prompt }
    if (v) next[k] = v; else delete next[k]
    onChange(next)
  }
  const setTopics = (v: string) => {
    const topics = v.split(',').map((t) => t.trim()).filter(Boolean)
    const next = { ...prompt }
    if (topics.length) next.topics = topics; else delete next.topics
    onChange(next)
  }
  const source = primaryLocale && primaryLocale !== locale ? prompt.content?.[primaryLocale]?.text : undefined
  return (
    <div className="space-y-3">
      <label className="block">
        <span className={LABEL}>Prompt text ({locale})</span>
        <textarea aria-label="Prompt text" value={entry.text ?? ''} onChange={(e) => setText(e.target.value)} rows={2}
                  className={INPUT} />
      </label>
      {source !== undefined && <p className="-mt-2 text-[11px] text-ed-muted">primary: {source || '(empty)'}</p>}
      <label className="block">
        <span className={LABEL}>Status</span>
        <select aria-label="Prompt text status" value={entry.status ?? 'draft'} onChange={(e) => setStatus(e.target.value)}
                className={INPUT}>
          {['draft', 'complete', 'validated'].map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </label>
      <div className="grid grid-cols-2 gap-x-3 gap-y-3">
        <label className="block">
          <span className={LABEL}>Name</span>
          <input aria-label="Name" value={prompt.name ?? ''} onChange={(e) => setField('name', e.target.value)} className={INPUT} />
        </label>
        <label className="block">
          <span className={LABEL}>Construct</span>
          <input aria-label="Construct" value={prompt.construct ?? ''} onChange={(e) => setField('construct', e.target.value)} className={INPUT} />
        </label>
        <label className="block">
          <span className={LABEL}>Dimension</span>
          <input aria-label="Dimension" value={prompt.dimension ?? ''} onChange={(e) => setField('dimension', e.target.value)} className={INPUT} />
        </label>
        <label className="block">
          <span className={LABEL}>Topics (comma-separated)</span>
          <input aria-label="Topics" value={(prompt.topics ?? []).join(', ')} onChange={(e) => setTopics(e.target.value)} className={INPUT} />
        </label>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" aria-label="Reversed" checked={prompt.reversed ?? false}
               onChange={(e) => onChange({ ...prompt, reversed: e.target.checked })} />
        Reversed (loads negatively on its construct)
      </label>
    </div>
  )
}
