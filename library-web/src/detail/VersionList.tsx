import { Link } from 'react-router-dom'
import type { VersionInfo } from '../api/types'
import { Badge } from '../components/Badge'

export function VersionList({ id, versions, current }: { id: string; versions: VersionInfo[]; current: string }) {
  if (versions.length === 0) return null
  return (
    <ul className="space-y-1 text-sm">
      {versions.map((v) => (
        <li key={v.version} className="flex items-center gap-2">
          <Link to={`/q/${id}/${v.version}`} className={v.version === current ? 'font-semibold text-slate-900' : 'text-accent hover:underline'}>
            {v.version}
          </Link>
          {v.date && <span className="text-slate-400">{v.date}</span>}
          {v.severity && <Badge>{v.severity}</Badge>}
          {v.status !== 'published' && <Badge tone="warn">{v.status}</Badge>}
        </li>
      ))}
    </ul>
  )
}
