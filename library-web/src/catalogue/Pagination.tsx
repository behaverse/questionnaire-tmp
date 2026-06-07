export function Pagination({ page, total, limit, onPage }: { page: number; total: number; limit: number; onPage: (p: number) => void }) {
  const pages = Math.max(1, Math.ceil(total / limit))
  if (pages <= 1) return null
  return (
    <nav className="mt-6 flex items-center justify-center gap-3 text-sm" aria-label="Pagination">
      <button className="rounded border border-slate-300 px-3 py-1 disabled:opacity-40" disabled={page <= 1} onClick={() => onPage(page - 1)}>
        Previous
      </button>
      <span className="text-slate-600">Page {page} of {pages}</span>
      <button className="rounded border border-slate-300 px-3 py-1 disabled:opacity-40" disabled={page >= pages} onClick={() => onPage(page + 1)}>
        Next
      </button>
    </nav>
  )
}
