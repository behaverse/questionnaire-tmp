export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center text-red-800">
      <p>{message}</p>
      {onRetry && <button className="mt-3 rounded bg-red-600 px-3 py-1.5 text-white" onClick={onRetry}>Retry</button>}
    </div>
  )
}
