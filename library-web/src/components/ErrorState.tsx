export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50/70 px-6 py-8 text-center">
      <p className="text-sm font-medium text-red-800">{message}</p>
      {onRetry && (
        <button
          className="mt-4 inline-flex items-center rounded-lg bg-red-700 px-3.5 py-1.5 text-sm font-medium text-white shadow-card transition-colors hover:bg-red-800"
          onClick={onRetry}
        >
          Retry
        </button>
      )}
    </div>
  )
}
