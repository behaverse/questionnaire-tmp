import { useState } from 'react'
import { useEditorStore } from '../state/store'
import { setAvailableLanguages } from '../model/tree'

const LOCALE_RE = /^[a-z]{2,3}(-[A-Z][a-z]{3})?(-[A-Z]{2})?$/

export function LanguagesField() {
  const { model, applyEdit } = useEditorStore()
  const [draft, setDraft] = useState('')
  if (!model) return null
  const primary = String(model.metadata.language ?? 'en')
  const langs = (model.metadata.available_languages ?? []) as string[]
  const code = draft.trim()
  const invalid = code.length > 0 && !LOCALE_RE.test(code)
  const add = () => {
    if (!LOCALE_RE.test(code) || code === primary || langs.includes(code)) return
    applyEdit((m) => setAvailableLanguages(m, [...langs, code]))
    setDraft('')
  }
  const remove = (l: string) => applyEdit((m) => setAvailableLanguages(m, langs.filter((x) => x !== l)))

  return (
    <div className="space-y-1">
      <span className="block text-xs font-medium uppercase tracking-wide text-slate-500">Languages</span>
      <div className="flex flex-wrap items-center gap-1">
        <span className="rounded bg-slate-200 px-2 py-0.5 text-xs">{primary} <span className="text-slate-400">primary</span></span>
        {langs.map((l) => (
          <span key={l} className="flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-xs">
            {l}
            <button type="button" aria-label={`Remove ${l}`} onClick={() => remove(l)} className="text-slate-400 hover:text-red-600">×</button>
          </span>
        ))}
      </div>
      <div className="flex gap-1">
        <input aria-label="Add language" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="fr"
               className="w-20 rounded border border-slate-300 px-1 py-0.5 text-sm" />
        <button type="button" onClick={add} className="rounded border border-slate-300 px-2 py-0.5 text-xs hover:bg-slate-50">Add</button>
      </div>
      {invalid && <p className="text-[11px] text-red-600">Invalid locale code</p>}
    </div>
  )
}
