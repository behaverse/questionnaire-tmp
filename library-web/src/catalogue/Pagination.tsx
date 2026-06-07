export function Pagination({ page, total, limit, onPage }: { page: number; total: number; limit: number; onPage: (p: number) => void }) {
  const pages = Math.max(1, Math.ceil(total / limit))
  if (pages <= 1) return null
  const btn =
    'rounded-lg border border-rule bg-paper-raised px-3.5 py-1.5 font-medium text-ink-soft shadow-card transition-colors hover:border-ink-faint/50 hover:text-ink disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-rule disabled:hover:text-ink-soft'
  return (
    <nav className="mt-10 flex items-center justify-center gap-4 text-sm" aria-label="Pagination">
      <button className={btn} disabled={page <= 1} onClick={() => onPage(page - 1)}>
        Previous
      </button>
      <span className="font-mono text-xs tabular-nums text-ink-faint">
        Page {page} <span className="text-rule">/</span> {pages}
      </span>
      <button className={btn} disabled={page >= pages} onClick={() => onPage(page + 1)}>
        Next
      </button>
    </nav>
  )
}
