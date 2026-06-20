// editor/src/library/browser/LibraryBrowser.tsx
import { useMemo, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { defaultLibraryClient, type LibraryClient } from './client'
import { LibraryEntityList } from './LibraryEntityList'
import { EntityInspector } from './EntityInspector'

export function LibraryBrowser({ onExit, client }: { onExit: () => void; client?: LibraryClient }) {
  const c = useMemo(() => client ?? defaultLibraryClient(), [client])
  const [selected, setSelected] = useState<string | null>(null)
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-ed-surface">
      <div className="flex items-center gap-3 border-b border-ed-border bg-ed-panel px-4 py-2.5 text-sm">
        <button onClick={onExit} aria-label="Back" className="flex items-center gap-1 text-ed-muted hover:text-ed-text">
          <ArrowLeft size={16} aria-hidden="true" /> Back
        </button>
        <span className="font-semibold text-ed-text">Library entities</span>
      </div>
      <div className="flex min-h-0 flex-1">
        <div className="w-80 shrink-0 border-r border-ed-border bg-ed-surface"><LibraryEntityList client={c} selectedRef={selected} onSelect={setSelected} /></div>
        <div className="min-w-0 flex-1 overflow-auto"><EntityInspector refStr={selected} client={c} /></div>
      </div>
    </div>
  )
}
