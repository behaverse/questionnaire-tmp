import { useEditorStore } from '../state/store'

export function ForkButton({ refStr }: { refStr: string }) {
  const openFork = useEditorStore((s) => s.openFork)
  return (
    <button onClick={() => openFork(refStr)} className="text-xs text-ed-muted underline hover:text-ed-text">
      Fork to edit
    </button>
  )
}
