import { useEffect, useState } from 'react'
import { useEditorStore } from '../state/store'
import { StartScreen } from './StartScreen'
import { Topbar } from './Topbar'
import { EditorWorkspace } from './EditorWorkspace'
import { newQuestionnaire } from '../model/scaffold'
import { readQuestionnaireFile } from '../persistence/file'
import { fetchFromLibrary } from '../persistence/library'
import { saveDraft, loadDraft } from '../persistence/indexeddb'
import { LibraryPicker } from '../library/LibraryPicker'

export function App() {
  const { model, loadModel, validation } = useEditorStore()
  const refreshStaleness = useEditorStore((s) => s.refreshStaleness)
  const pool = useEditorStore((s) => s.pool)
  const picker = useEditorStore((s) => s.picker)
  const closePicker = useEditorStore((s) => s.closePicker)
  const [error, setError] = useState<string | null>(null)
  const [booting, setBooting] = useState(true)

  // restore autosaved draft on boot
  useEffect(() => {
    loadDraft().then((d) => { if (d) { loadModel(d.model, d.source, d.entities); void refreshStaleness() } }).finally(() => setBooting(false))
  }, [loadModel, refreshStaleness])

  // autosave on model/pool change (debounced)
  useEffect(() => {
    if (!model) return
    const t = setTimeout(() => {
      const { source, pool } = useEditorStore.getState()
      if (source) saveDraft(model, source, pool)
    }, 500)
    return () => clearTimeout(t)
  }, [model, pool])

  if (booting) return <main className="flex h-full items-center justify-center text-slate-400">Loading…</main>

  if (!model) {
    return (
      <>
        {error && <div role="alert" className="bg-red-50 p-2 text-sm text-red-700">{error}</div>}
        <StartScreen
          onNew={() => { loadModel(newQuestionnaire(), { kind: 'new' }); void refreshStaleness() }}
          onOpenFile={async (f) => {
            try { setError(null); loadModel(await readQuestionnaireFile(f), { kind: 'file', name: f.name }); void refreshStaleness() }
            catch (e) { setError(String(e)) }
          }}
          onOpenLibrary={async (id, version) => {
            try { setError(null); loadModel(await fetchFromLibrary(id, version), { kind: 'library', id, version }); void refreshStaleness() }
            catch (e) { setError(String(e)) }
          }}
        />
      </>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <Topbar onValidate={() => useEditorStore.getState().revalidate()} />
      {validation && !validation.valid && (
        <div role="alert" className="border-b border-red-200 bg-red-50 px-4 py-1 text-xs text-red-700">
          {validation.errors.length} validation issue(s): {validation.errors.slice(0, 3).map((e) => e.message).join('; ')}
        </div>
      )}
      <EditorWorkspace />
      {picker && model && (
        <LibraryPicker etype={picker.etype} locale={String(model.metadata.language ?? 'en')}
                       onPick={(ref) => { picker.onPick(ref); closePicker() }} onClose={closePicker} />
      )}
    </div>
  )
}
