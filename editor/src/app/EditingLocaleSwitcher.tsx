import { useEditorStore } from '../state/store'

export function EditingLocaleSwitcher() {
  const model = useEditorStore((s) => s.model)
  const editingLocale = useEditorStore((s) => s.editingLocale)
  const setEditingLocale = useEditorStore((s) => s.setEditingLocale)
  if (!model) return null
  const primary = String(model.metadata.language ?? 'en')
  const locales = [primary, ...((model.metadata.available_languages ?? []) as string[]).filter((l) => l !== primary)]
  const value = editingLocale ?? primary
  return (
    <label className="flex items-center gap-1 text-sm">Editing
      <select aria-label="Editing language" value={value} onChange={(e) => setEditingLocale(e.target.value)}
              className="rounded border border-slate-300 px-1 py-0.5">
        {locales.map((l) => <option key={l} value={l}>{l}</option>)}
      </select>
      {value !== primary && <span className="text-[11px] text-amber-600">translating</span>}
    </label>
  )
}
