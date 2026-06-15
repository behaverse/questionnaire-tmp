import { useEditorStore } from '../state/store'

export function ForkButton({ refStr }: { refStr: string }) {
  const openFork = useEditorStore((s) => s.openFork)
  return (
    <button onClick={() => openFork(refStr)} className="text-xs text-slate-500 underline hover:text-slate-700">
      Fork to edit
    </button>
  )
}
