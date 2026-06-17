import { ArrowLeft, RefreshCw, ExternalLink, Check, Eye, Languages, Download, Package } from 'lucide-react'
import { useEditorStore } from '../state/store'
import { exportToFile, exportBundle, bundleData } from '../persistence/file'
import { EditingLocaleSwitcher } from './EditingLocaleSwitcher'
import { Button } from '../ui/Button'

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
    <header className="flex items-center gap-3 border-b border-ed-border bg-ed-panel px-4 py-2">
      <Button
        variant="ghost"
        icon={ArrowLeft}
        title="Return to the start screen (your draft is autosaved)"
        onClick={() => { if (!dirty || confirm('Leave this questionnaire? Your draft is autosaved and will be here when you return.')) reset() }}
      >Home</Button>
      <span className="font-medium text-ed-text">{model.metadata.title ?? model.metadata.id}</span>
      {dirty && <span className="text-xs text-amber-600">● unsaved</span>}
      <div className="ml-auto flex items-center gap-2">
        <EditingLocaleSwitcher />
        {Object.keys(staleness).length > 0 && (
          <span className="rounded bg-amber-100 px-2 py-1 text-xs text-amber-800">⬆ {Object.keys(staleness).length} update{Object.keys(staleness).length > 1 ? 's' : ''}</span>
        )}
        <Button
          variant="secondary"
          icon={RefreshCw}
          title="Check the Library for newer versions of any pinned references"
          onClick={() => void refreshStaleness()}
        >Check for updates</Button>
        <Button
          variant="secondary"
          icon={ExternalLink}
          title="Open this draft full-screen in a separate tab (read-only preview)"
          onClick={() => {
            try { sessionStorage.setItem('qv-preview-bundle', JSON.stringify(bundleData(model, pool))) } catch { /* quota: fall through */ }
            window.open('/preview.html', '_blank')
          }}
        >Open preview</Button>
        <Button
          variant="secondary"
          icon={Check}
          title="Re-check this questionnaire against the Schema 2 rules"
          onClick={onValidate}
        >✓ Validate</Button>
        <Button
          variant={previewOpen ? 'primary' : 'secondary'}
          icon={Eye}
          aria-pressed={previewOpen}
          title="Show/hide the live inline preview pane"
          onClick={togglePreview}
        >▢ Preview</Button>
        <Button
          variant={translateView ? 'primary' : 'secondary'}
          icon={Languages}
          aria-pressed={translateView}
          title="Open the side-by-side translation view"
          onClick={() => setTranslateView(!translateView)}
        >Translate</Button>
        <Button
          variant="primary"
          icon={Download}
          title="Download the questionnaire JSON only (references not included)"
          onClick={doExport}
        >Export</Button>
        <Button
          variant="secondary"
          icon={Package}
          title="Download a self-contained bundle: the questionnaire plus all referenced/drafted entities (opens offline in the standalone preview)"
          onClick={() => { if (model) exportBundle(model, pool) }}
        >Export bundle</Button>
      </div>
    </header>
  )
}
