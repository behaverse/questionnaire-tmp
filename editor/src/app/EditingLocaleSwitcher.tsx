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
    <label className="flex items-center gap-1 text-sm"
           title={`Choose which language to edit. Editing a non-primary language edits that language's translation (primary is "${primary}").`}>
      Editing language
      <select aria-label="Editing language" value={value} onChange={(e) => setEditingLocale(e.target.value)}
              className="rounded border border-ed-border-strong px-1 py-0.5">
        {locales.map((l) => <option key={l} value={l}>{l}</option>)}
      </select>
      {value !== primary && <span className="rounded bg-ed-subtle px-1.5 py-0.5 text-[11px] text-ed-muted">{value} translation</span>}
    </label>
  )
}
