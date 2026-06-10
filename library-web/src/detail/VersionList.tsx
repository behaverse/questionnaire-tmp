import { Link } from 'react-router-dom'
import type { VersionInfo } from '../api/types'
import { Badge } from '../components/Badge'

export function VersionList({ id, versions, current }: { id: string; versions: VersionInfo[]; current: string }) {
  if (versions.length === 0) return null
  return (
    <ul className="divide-y divide-rule-soft text-sm">
      {versions.map((v) => {
        const isCurrent = v.version === current
        return (
          <li
            key={v.version}
            className="flex flex-wrap items-center gap-2.5 py-2.5 first:pt-0"
          >
            <Link
              to={`/q/${id}/${v.version}`}
              aria-current={isCurrent ? 'true' : undefined}
              className={
                isCurrent
                  ? 'font-mono text-[13px] font-semibold text-ink'
                  : 'font-mono text-[13px] text-accent underline-offset-2 hover:underline'
              }
            >
              {v.version}
            </Link>
            {isCurrent && (
              <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-accent" />
            )}
            {v.date && (
              <span className="font-mono text-xs text-ink-faint">
                <span className="text-ink-faint/70">added</span> {v.date}
              </span>
            )}
            <span className="flex-1" />
            {v.severity && <Badge>{v.severity}</Badge>}
            {v.status !== 'published' && <Badge tone="warn">{v.status}</Badge>}
          </li>
        )
      })}
    </ul>
  )
}
