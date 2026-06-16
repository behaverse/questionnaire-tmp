import { useRef, useState } from 'react'

interface Props {
  onNew: () => void
  onOpenFile: (file: File) => void
  onOpenLibrary: (id: string, version: string) => void
  onLoadSample: () => void
  onBrowseLibrary: () => void
}

export function StartScreen({ onNew, onOpenFile, onOpenLibrary, onLoadSample, onBrowseLibrary }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [id, setId] = useState('')
  const [version, setVersion] = useState('')
  return (
    <main className="mx-auto flex h-full max-w-2xl flex-col justify-center gap-6 p-8">
      <h1 className="text-3xl font-semibold text-slate-800">Questionnaire Editor</h1>
      <div className="grid gap-4">
        <button
          onClick={onLoadSample}
          className="rounded-lg border border-slate-300 p-4 text-left hover:bg-slate-50"
        >
          <div className="font-medium">Load a sample</div>
          <div className="text-sm text-slate-500">Explore a ready-made questionnaire (BIS/BAS) — works offline</div>
        </button>

        <button
          onClick={onNew}
          className="rounded-lg border border-slate-300 p-4 text-left hover:bg-slate-50"
        >
          <div className="font-medium">New questionnaire</div>
          <div className="text-sm text-slate-500">Start from an empty scaffold</div>
        </button>

        <label className="cursor-pointer rounded-lg border border-slate-300 p-4 hover:bg-slate-50">
          <div className="font-medium">Open file</div>
          <div className="text-sm text-slate-500">Load a canonical Schema 2 .json</div>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) onOpenFile(f) }}
          />
        </label>

        <div className="rounded-lg border border-slate-300 p-4">
          <div className="font-medium">Open from Library</div>
          <button onClick={onBrowseLibrary}
                  className="mt-2 rounded bg-slate-800 px-3 py-1 text-sm text-white">Browse Library…</button>
          <div className="mt-3 text-xs text-slate-400">Or open by exact id + version:</div>
          <div className="mt-1 flex gap-2">
            <input value={id} onChange={(e) => setId(e.target.value)} placeholder="qst_phq9"
                   className="flex-1 rounded border border-slate-300 px-2 py-1 text-sm" aria-label="Questionnaire id" />
            <input value={version} onChange={(e) => setVersion(e.target.value)} placeholder="v26.0609"
                   className="w-32 rounded border border-slate-300 px-2 py-1 text-sm" aria-label="Version" />
            <button onClick={() => onOpenLibrary(id, version)} disabled={!id || !version}
                    className="rounded border border-slate-300 px-3 py-1 text-sm disabled:opacity-40">Open</button>
          </div>
        </div>
      </div>
    </main>
  )
}
