import { useEditorStore } from '../state/store'
import { exportToFile, exportBundle } from '../persistence/file'

export function Topbar({ onValidate }: { onValidate: () => void }) {
  const { model, dirty, validation, previewOpen, togglePreview } = useEditorStore()
  const pool = useEditorStore((s) => s.pool)
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
        <button onClick={togglePreview}
                className={`rounded border px-3 py-1 text-sm ${previewOpen ? 'border-slate-800 bg-slate-800 text-white' : 'border-slate-300 hover:bg-slate-50'}`}>
          ▢ Preview
        </button>
        <button onClick={doExport} className="rounded bg-slate-800 px-3 py-1 text-sm text-white">Export</button>
        <button onClick={() => { if (model) exportBundle(model, pool) }}
                className="rounded border border-slate-300 px-3 py-1 text-sm hover:bg-slate-50">Export bundle</button>
      </div>
    </header>
  )
}
