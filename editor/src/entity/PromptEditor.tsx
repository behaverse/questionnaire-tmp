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
      <label className="block text-sm">Prompt text ({locale})
        <textarea aria-label="Prompt text" value={entry.text ?? ''} onChange={(e) => setText(e.target.value)} rows={2}
                  className="mt-1 w-full rounded border border-slate-300 px-2 py-1" />
      </label>
      {source !== undefined && <p className="text-[11px] text-slate-400">primary: {source || '(empty)'}</p>}
      <label className="text-xs text-slate-500">Status
        <select aria-label="Prompt text status" value={entry.status ?? 'draft'} onChange={(e) => setStatus(e.target.value)}
                className="ml-1 rounded border border-slate-300 px-1 py-0.5">
          {['draft', 'complete', 'validated'].map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </label>
      <div className="flex flex-wrap gap-3">
        <label className="text-sm">Name
          <input aria-label="Name" value={prompt.name ?? ''} onChange={(e) => setField('name', e.target.value)}
                 className="ml-1 rounded border border-slate-300 px-1 py-0.5" />
        </label>
        <label className="text-sm">Construct
          <input aria-label="Construct" value={prompt.construct ?? ''} onChange={(e) => setField('construct', e.target.value)}
                 className="ml-1 rounded border border-slate-300 px-1 py-0.5" />
        </label>
        <label className="text-sm">Dimension
          <input aria-label="Dimension" value={prompt.dimension ?? ''} onChange={(e) => setField('dimension', e.target.value)}
                 className="ml-1 rounded border border-slate-300 px-1 py-0.5" />
        </label>
      </div>
      <label className="block text-sm">Topics (comma-separated)
        <input aria-label="Topics" value={(prompt.topics ?? []).join(', ')} onChange={(e) => setTopics(e.target.value)}
               className="mt-1 w-full rounded border border-slate-300 px-2 py-1" />
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" aria-label="Reversed" checked={prompt.reversed ?? false}
               onChange={(e) => onChange({ ...prompt, reversed: e.target.checked })} />
        Reversed (loads negatively on its construct)
      </label>
    </div>
  )
}
