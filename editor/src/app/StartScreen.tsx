import { useRef, useState } from 'react'
import { Sparkles, FilePlus2, Upload, Library, Languages } from 'lucide-react'
import { Button } from '../ui/Button'

interface Props {
  onNew: () => void
  onOpenFile: (file: File) => void
  onOpenLibrary: (id: string, version: string) => void
  onLoadSample: () => void
  onBrowseLibrary: () => void
  onTranslate: () => void
}

export function StartScreen({ onNew, onOpenFile, onOpenLibrary, onLoadSample, onBrowseLibrary, onTranslate }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [id, setId] = useState('')
  const [version, setVersion] = useState('')
  return (
    <main className="mx-auto flex h-full max-w-2xl flex-col justify-center gap-6 p-8">
      <h1 className="text-3xl font-semibold text-ed-text">Questionnaire Editor</h1>
      <div className="grid gap-4">
        <button
          onClick={onLoadSample}
          className="rounded-lg border border-ed-border p-4 text-left hover:bg-ed-subtle"
        >
          <div className="flex items-center gap-2 font-medium">
            <Sparkles size={16} aria-hidden="true" className="text-ed-muted" />
            Load a sample
          </div>
          <div className="text-sm text-ed-muted">Explore a ready-made questionnaire (BIS/BAS) — works offline</div>
        </button>

        <button
          onClick={onNew}
          className="rounded-lg border border-ed-border p-4 text-left hover:bg-ed-subtle"
        >
          <div className="flex items-center gap-2 font-medium">
            <FilePlus2 size={16} aria-hidden="true" className="text-ed-muted" />
            New questionnaire
          </div>
          <div className="text-sm text-ed-muted">Start from an empty scaffold</div>
        </button>

        <button
          onClick={onTranslate}
          className="rounded-lg border border-ed-border p-4 text-left hover:bg-ed-subtle"
        >
          <div className="flex items-center gap-2 font-medium">
            <Languages size={16} aria-hidden="true" className="text-ed-muted" />
            Translate a questionnaire
          </div>
          <div className="text-sm text-ed-muted">Pick one from the Library and open it in the side-by-side translation view</div>
        </button>

        <label className="cursor-pointer rounded-lg border border-ed-border p-4 hover:bg-ed-subtle">
          <div className="flex items-center gap-2 font-medium">
            <Upload size={16} aria-hidden="true" className="text-ed-muted" />
            Open file
          </div>
          <div className="text-sm text-ed-muted">Load a canonical Schema 2 .json</div>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) onOpenFile(f) }}
          />
        </label>

        <div className="rounded-lg border border-ed-border p-4">
          <div className="flex items-center gap-2 font-medium">
            <Library size={16} aria-hidden="true" className="text-ed-muted" />
            Open from Library
          </div>
          <Button variant="primary" onClick={onBrowseLibrary} className="mt-2">Browse Library…</Button>
          <div className="mt-3 text-xs text-ed-muted">Or open by exact id + version:</div>
          <div className="mt-1 flex gap-2">
            <input value={id} onChange={(e) => setId(e.target.value)} placeholder="qst_phq9"
                   className="flex-1 rounded border border-ed-border px-2 py-1 text-sm" aria-label="Questionnaire id" />
            <input value={version} onChange={(e) => setVersion(e.target.value)} placeholder="v26.0609"
                   className="w-32 rounded border border-ed-border px-2 py-1 text-sm" aria-label="Version" />
            <button onClick={() => onOpenLibrary(id, version)} disabled={!id || !version}
                    className="rounded border border-ed-border px-3 py-1 text-sm disabled:opacity-40">Open</button>
          </div>
        </div>
      </div>
    </main>
  )
}
