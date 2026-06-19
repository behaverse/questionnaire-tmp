import { useEffect, useState } from 'react'
import { useEditorStore } from '../state/store'
import { StartScreen } from './StartScreen'
import { Topbar } from './Topbar'
import { EditorWorkspace } from './EditorWorkspace'
import { newQuestionnaire } from '../model/scaffold'
import { readQuestionnaireFile } from '../persistence/file'
import { fetchFromLibrary, latestVersion } from '../persistence/library'
import { saveDraft, loadDraft } from '../persistence/indexeddb'
import { LibraryPicker } from '../library/LibraryPicker'
import { LibraryQuestionnairePicker } from '../library/LibraryQuestionnairePicker'
import { ForkDialog } from '../library/ForkDialog'
import { TranslationPanel } from '../translate/TranslationPanel'
import { bisbasSample } from '../samples/sample'

export function App() {
  const { model, loadModel, validation, translateView } = useEditorStore()
  const setTranslateView = useEditorStore((s) => s.setTranslateView)
  const refreshStaleness = useEditorStore((s) => s.refreshStaleness)
  const pool = useEditorStore((s) => s.pool)
  const picker = useEditorStore((s) => s.picker)
  const closePicker = useEditorStore((s) => s.closePicker)
  const fork = useEditorStore((s) => s.fork)
  const closeFork = useEditorStore((s) => s.closeFork)
  const [error, setError] = useState<string | null>(null)
  const [booting, setBooting] = useState(true)
  const [browsing, setBrowsing] = useState(false)
  const [translateOnLoad, setTranslateOnLoad] = useState(false)

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

  if (booting) return <main className="flex h-full items-center justify-center bg-ed-surface text-ed-muted">Loading…</main>

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
          onLoadSample={() => { loadModel(bisbasSample.questionnaire, { kind: 'sample', id: 'qst_x_bisbas' }, bisbasSample.entities); void refreshStaleness() }}
          onBrowseLibrary={() => { setTranslateOnLoad(false); setBrowsing(true) }}
          onTranslate={() => { setTranslateOnLoad(true); setBrowsing(true) }}
        />
        {browsing && (
          <LibraryQuestionnairePicker
            onClose={() => setBrowsing(false)}
            onPick={async (id, version) => {
              setBrowsing(false)
              try {
                setError(null)
                const v = version || (await latestVersion('questionnaire', id)) || version
                loadModel(await fetchFromLibrary(id, v), { kind: 'library', id, version: v })
                void refreshStaleness()
                if (translateOnLoad) { setTranslateView(true); setTranslateOnLoad(false) }
              } catch (e) { setError(String(e)) }
            }}
          />
        )}
      </>
    )
  }

  return (
    <div className="flex h-full flex-col bg-ed-surface">
      <Topbar onValidate={() => useEditorStore.getState().revalidate()} />
      {validation && !validation.valid && (
        <div role="alert" className="border-b border-red-200 bg-red-50 px-4 py-1 text-xs text-red-700">
          {validation.errors.length} validation issue(s): {validation.errors.slice(0, 3).map((e) => e.message).join('; ')}
        </div>
      )}
      {translateView ? <TranslationPanel /> : <EditorWorkspace />}
      {picker && model && (
        <LibraryPicker etype={picker.etype} locale={String(model.metadata.language ?? 'en')}
                       onPick={(ref) => { picker.onPick(ref); closePicker() }} onClose={closePicker}
                       onCreate={picker.onCreate ? () => { picker.onCreate!(); closePicker() } : undefined} />
      )}
      {fork && <ForkDialog refStr={fork.ref} onClose={closeFork} />}
    </div>
  )
}
