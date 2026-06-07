export function EmptyState({ message, actionLabel, onAction }: { message: string; actionLabel?: string; onAction?: () => void }) {
  return (
    <div className="rounded-xl border border-dashed border-rule bg-paper-raised/60 px-10 py-16 text-center">
      <svg aria-hidden viewBox="0 0 32 32" fill="none" className="mx-auto mb-4 h-9 w-9 text-ink-faint/60">
        <rect x="6" y="4" width="20" height="24" rx="2.5" stroke="currentColor" strokeWidth="1.6" />
        <path d="M11 11h10M11 16h10M11 21h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
      <p className="text-[15px] text-ink-soft">{message}</p>
      {actionLabel && onAction && (
        <button
          className="mt-4 inline-flex items-center rounded-lg border border-rule bg-paper-raised px-3.5 py-1.5 text-sm font-medium text-accent shadow-card transition-colors hover:border-accent/40"
          onClick={onAction}
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}
