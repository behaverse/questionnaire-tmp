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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="w-[480px] rounded-lg bg-ed-panel shadow-xl">
        <div className="border-b border-ed-border p-3 text-sm font-semibold">Edit <span className="font-mono">{refStr}</span>?</div>
        <div className="space-y-3 p-4 text-sm">
          <p className="text-ed-muted">This is a shared Library entity, so it's read-only. To edit it here, the editor makes a <strong>local copy</strong> in this questionnaire — the shared Library entry is left unchanged.</p>
          <div className="flex flex-col gap-2">
            <button onClick={derive} disabled={busy}
                    className="rounded bg-ed-accent px-3 py-2 text-left text-white disabled:opacity-50">
              <div className="font-medium">Create a local copy &amp; edit</div>
              <div className="text-xs text-white/70">Copies it into this questionnaire as a draft you can edit (study-scoped).</div>
            </button>
            <button disabled title="Needs Identity / Library write (OD-08)"
                    className="rounded border border-ed-border px-3 py-2 text-left text-ed-muted">
              <div className="font-medium">Propose a new shared version</div>
              <div className="text-xs">Open a Library contribution — needs Identity (OD-08).</div>
            </button>
            <button onClick={onClose} className="rounded border border-ed-border-strong px-3 py-2 text-left hover:bg-ed-subtle">Cancel</button>
          </div>
          {error && <div role="alert" className="text-sm text-red-600">{error}</div>}
        </div>
      </div>
    </div>
  )
}
