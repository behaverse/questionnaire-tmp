import { ArrowLeft, RefreshCw, Check, AlertTriangle, Eye, PanelRight, Languages, Download, Package, ExternalLink } from 'lucide-react'
import { useEditorStore } from '../state/store'
import { exportToFile, exportBundle, bundleData } from '../persistence/file'
import { EditingLocaleSwitcher } from './EditingLocaleSwitcher'
import { Button, IconButton } from '../ui/Button'
import { Menu } from '../ui/Menu'

export function Topbar({ onValidate }: { onValidate: () => void }) {
  const { model, dirty, validation, previewOpen, togglePreview, inspectorOpen, toggleInspector, translateView } = useEditorStore()
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
      <span
        className={`flex items-center gap-1 text-xs ${dirty ? 'text-amber-600' : 'text-ed-muted'}`}
        title="Your work autosaves to this browser. Use Export ▾ to download a file or contribution bundle."
      >
        {dirty ? <><RefreshCw size={12} className="animate-spin" aria-hidden="true" /> Saving…</> : <><Check size={12} aria-hidden="true" /> Saved</>}
      </span>
      <div className="ml-auto flex items-center gap-2">
        {/* Utilities */}
        <EditingLocaleSwitcher />
        {Object.keys(staleness).length > 0 && (
          <span className="rounded bg-amber-100 px-2 py-1 text-xs text-amber-800">⬆ {Object.keys(staleness).length} update{Object.keys(staleness).length > 1 ? 's' : ''}</span>
        )}
        <IconButton icon={RefreshCw} label="Check for updates" onClick={() => void refreshStaleness()} />
        <Button
          variant="secondary"
          icon={invalid ? AlertTriangle : Check}
          title="Re-check this questionnaire against the Schema 2 rules"
          onClick={onValidate}
        >
          {invalid ? `Validate (${(validation as { errors?: unknown[] }).errors?.length ?? '!'})` : 'Validate'}
        </Button>

        {/* Mode toggles — segmented group */}
        <div className="inline-flex overflow-hidden rounded-md border border-ed-border-strong [&>button]:rounded-none [&>button]:border-0">
          <Button
            variant={previewOpen ? 'primary' : 'ghost'}
            icon={Eye}
            aria-pressed={previewOpen}
            title="Show/hide the live inline preview pane"
            onClick={togglePreview}
          >Preview</Button>
          <Button
            variant={inspectorOpen ? 'primary' : 'ghost'}
            icon={PanelRight}
            aria-pressed={inspectorOpen}
            title="Show/hide the inspector panel"
            onClick={toggleInspector}
          >Inspector</Button>
          <Button
            variant={translateView ? 'primary' : 'ghost'}
            icon={Languages}
            aria-pressed={translateView}
            title="Open the side-by-side translation view"
            onClick={() => setTranslateView(!translateView)}
          >Translate</Button>
        </div>

        {/* Export menu */}
        <Menu label="Export" icon={Download} variant="primary" items={[
          { label: 'Export JSON', icon: Download, title: 'Download the questionnaire JSON only (references not included)', onClick: doExport },
          { label: 'Export bundle', icon: Package, title: 'Download a self-contained bundle (opens offline in the standalone preview)', onClick: () => { if (model) exportBundle(model, pool) } },
          { label: 'Open preview', icon: ExternalLink, title: 'Open this draft full-screen in a separate tab (read-only preview)', onClick: () => {
            try { sessionStorage.setItem('qv-preview-bundle', JSON.stringify(bundleData(model, pool))) } catch { /* quota */ }
            window.open('/preview.html', '_blank')
          } },
        ]} />
      </div>
    </header>
  )
}
