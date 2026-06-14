import { useEditorStore } from '../state/store'
import { exportToFile } from '../persistence/file'

export function Topbar({ onValidate }: { onValidate: () => void }) {
  const { model, dirty, validation } = useEditorStore()
  if (!model) return null
  const invalid = validation && !validation.valid
  const doExport = () => {
    if (invalid && !confirm('This questionnaire is not Schema-2-valid. Export anyway?')) return
    exportToFile(model)
  }
  return (
    <header className="flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-2">
      <span className="font-medium text-slate-800">{model.metadata.title ?? model.metadata.id}</span>
      {dirty && <span className="text-xs text-amber-600">● unsaved</span>}
      <div className="ml-auto flex items-center gap-2">
        <button onClick={onValidate} className="rounded border border-slate-300 px-3 py-1 text-sm hover:bg-slate-50">✓ Validate</button>
        <button disabled className="rounded border border-slate-200 px-3 py-1 text-sm text-slate-400" title="Available in ED-B">▢ Preview</button>
        <button onClick={doExport} className="rounded bg-slate-800 px-3 py-1 text-sm text-white">Export</button>
      </div>
    </header>
  )
}
