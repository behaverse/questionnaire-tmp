import { useState } from 'react'
import { useEditorStore } from '../state/store'
import type { EntityBody } from '../model/types'

export function ForkDialog({ refStr, onClose, fetchBody }: {
  refStr: string; onClose: () => void; fetchBody?: (ref: string) => Promise<EntityBody | null>
}) {
  const forkRefAction = useEditorStore((s) => s.forkRefAction)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const derive = async () => {
    setBusy(true); setError(null)
    const ok = await forkRefAction(refStr, fetchBody)
    setBusy(false)
    if (ok) onClose()
    else setError('Could not fork — the Library entity could not be fetched.')
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div className="w-[480px] rounded-lg bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="border-b border-slate-200 p-3 text-sm font-semibold">Edit <span className="font-mono">{refStr}</span>?</div>
        <div className="space-y-3 p-4 text-sm">
          <p className="text-slate-600">This is a shared Library entity. To change it, fork a local copy or propose a shared change.</p>
          <div className="flex flex-col gap-2">
            <button onClick={derive} disabled={busy}
                    className="rounded bg-slate-800 px-3 py-2 text-left text-white disabled:opacity-50">
              <div className="font-medium">Derive locally</div>
              <div className="text-xs text-slate-300">Copy into this questionnaire as a draft you can edit (study-scoped).</div>
            </button>
            <button disabled title="Needs Identity / Library write (OD-08)"
                    className="rounded border border-slate-200 px-3 py-2 text-left text-slate-400">
              <div className="font-medium">Propose a new shared version</div>
              <div className="text-xs">Open a Library contribution — needs Identity (OD-08).</div>
            </button>
            <button onClick={onClose} className="rounded border border-slate-300 px-3 py-2 text-left hover:bg-slate-50">Cancel</button>
          </div>
          {error && <div role="alert" className="text-sm text-red-600">{error}</div>}
        </div>
      </div>
    </div>
  )
}
