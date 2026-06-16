import { useEditorStore } from '../state/store'
import { exportToFile, exportBundle, bundleData } from '../persistence/file'
import { EditingLocaleSwitcher } from './EditingLocaleSwitcher'

export function Topbar({ onValidate }: { onValidate: () => void }) {
  const { model, dirty, validation, previewOpen, togglePreview, translateView } = useEditorStore()
  const pool = useEditorStore((s) => s.pool)
  const staleness = useEditorStore((s) => s.staleness)
  const refreshStaleness = useEditorStore((s) => s.refreshStaleness)
  const setTranslateView = useEditorStore((s) => s.setTranslateView)
  const reset = useEditorStore((s) => s.reset)
  if (!model) return null
  const invalid = validation && !validation.valid
  const doExport = () => {
    if (invalid && !confirm('This questionnaire is not Schema-2-valid. Export anyway?')) return
    exportToFile(model)
  }
  return (
    <header className="flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-2">
      <button
        title="Return to the start screen (your draft is autosaved)"
        onClick={() => { if (!dirty || confirm('Leave this questionnaire? Your draft is autosaved and will be here when you return.')) reset() }}
        className="rounded border border-slate-300 px-2 py-1 text-sm hover:bg-slate-50">← Home</button>
      <span className="font-medium text-slate-800">{model.metadata.title ?? model.metadata.id}</span>
      {dirty && <span className="text-xs text-amber-600">● unsaved</span>}
      <div className="ml-auto flex items-center gap-2">
        <EditingLocaleSwitcher />
        {Object.keys(staleness).length > 0 && (
          <span className="rounded bg-amber-100 px-2 py-1 text-xs text-amber-800">⬆ {Object.keys(staleness).length} update{Object.keys(staleness).length > 1 ? 's' : ''}</span>
        )}
        <button title="Check the Library for newer versions of any pinned references" onClick={() => void refreshStaleness()} className="rounded border border-slate-300 px-3 py-1 text-sm hover:bg-slate-50">Check for updates</button>
        <button title="Open this draft full-screen in a separate tab (read-only preview)" onClick={() => {
          try { sessionStorage.setItem('qv-preview-bundle', JSON.stringify(bundleData(model, pool))) } catch { /* quota: fall through */ }
          window.open('/preview.html', '_blank')
        }} className="rounded border border-slate-300 px-3 py-1 text-sm hover:bg-slate-50">Open preview</button>
        <button title="Re-check this questionnaire against the Schema 2 rules" onClick={onValidate} className="rounded border border-slate-300 px-3 py-1 text-sm hover:bg-slate-50">✓ Validate</button>
        <button title="Show/hide the live inline preview pane" onClick={togglePreview}
                className={`rounded border px-3 py-1 text-sm ${previewOpen ? 'border-slate-800 bg-slate-800 text-white' : 'border-slate-300 hover:bg-slate-50'}`}>
          ▢ Preview
        </button>
        <button title="Open the side-by-side translation view" onClick={() => setTranslateView(!translateView)}
                className={`rounded border px-3 py-1 text-sm ${translateView ? 'border-slate-800 bg-slate-800 text-white' : 'border-slate-300 hover:bg-slate-50'}`}>
          Translate
        </button>
        <button title="Download the questionnaire JSON only (references not included)" onClick={doExport} className="rounded bg-slate-800 px-3 py-1 text-sm text-white">Export</button>
        <button title="Download a self-contained bundle: the questionnaire plus all referenced/drafted entities (opens offline in the standalone preview)" onClick={() => { if (model) exportBundle(model, pool) }}
                className="rounded border border-slate-300 px-3 py-1 text-sm hover:bg-slate-50">Export bundle</button>
      </div>
    </header>
  )
}
