import { useQuestionSearch } from '../api/queries'
import { Skeleton } from '../components/Skeleton'
import { EmptyState } from '../components/EmptyState'
import { ErrorState } from '../components/ErrorState'
import { ApiError } from '../api/client'

/**
 * Results list for the "Questions" search mode — individual question-text entities (prompts),
 * matched on their text or id via GET /v1/questions/search. Shows the prompt text prominently
 * with its id@version. Read-only, mirroring the catalogue's loading/empty/error treatment.
 */
export function QuestionResults({ q }: { q: string | undefined }) {
  const list = useQuestionSearch(q)

  if (list.isLoading) {
    return <div className="space-y-3 pt-2">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
  }
  if (list.isError) {
    return list.error instanceof ApiError && list.error.status === 422
      ? <ErrorState message="Invalid search — try different terms." onRetry={() => list.refetch()} />
      : <ErrorState message="Could not search questions." onRetry={() => list.refetch()} />
  }
  if (!list.data) return null
  if (list.data.total === 0) {
    return <EmptyState message={q ? `No questions match “${q}”.` : 'Type to search individual questions.'} />
  }

  return (
    <>
      <p className="mb-1 text-[11px] font-medium uppercase tracking-[0.12em] text-ink-faint">
        {list.data.total} question{list.data.total === 1 ? '' : 's'}
      </p>
      <ul className="space-y-2.5">
        {list.data.items.map((it) => (
          <li
            key={`${it.id}@${it.version}`}
            className="rounded-lg border border-rule bg-paper-raised p-4 shadow-card"
          >
            <p className="text-[15px] leading-relaxed text-ink">
              {it.text ?? <span className="italic text-ink-faint">(no text in this language)</span>}
            </p>
            <p className="mt-1.5 font-mono text-xs text-ink-faint">
              {it.id}<span className="text-ink-faint/60">@{it.version}</span>
              {it.language && <span className="ml-2 uppercase">{it.language}</span>}
            </p>
          </li>
        ))}
      </ul>
    </>
  )
}
