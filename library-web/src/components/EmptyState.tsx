export function EmptyState({ message, actionLabel, onAction }: { message: string; actionLabel?: string; onAction?: () => void }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 p-10 text-center text-slate-600">
      <p>{message}</p>
      {actionLabel && onAction && (
        <button className="mt-3 text-accent hover:underline" onClick={onAction}>{actionLabel}</button>
      )}
    </div>
  )
}
