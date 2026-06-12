export function UnsupportedElement({ id, reason, notice }: { id: string; reason: string; notice: string }) {
  return (
    <div role="note" className="rounded-xl border-2 border-dashed border-warning/60 bg-warning/5 p-4 text-sm text-slate-600">
      <p>{notice}</p>
      <p className="mt-1 font-mono text-xs text-slate-400">{id}: {reason}</p>
    </div>
  )
}
