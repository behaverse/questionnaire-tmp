import { useEditorStore } from '../state/store'

export function UpgradeBadge({ refStr }: { refStr: string }) {
  const latest = useEditorStore((s) => s.staleness[refStr])
  const upgradeRefAction = useEditorStore((s) => s.upgradeRefAction)
  if (!latest) return null
  const id = refStr.slice(0, refStr.lastIndexOf('@'))
  return (
    <span className="ml-2 inline-flex items-center gap-1 rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-800">
      newer: {latest}
      <button onClick={() => upgradeRefAction(refStr, `${id}@${latest}`)} className="font-medium underline">Upgrade</button>
    </span>
  )
}
