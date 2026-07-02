import { useEffect, useState } from 'react'
import { parseParams } from '../params'
import { useSession } from '@behaverse/participant-session'
import { listDeployments, listSessions, mintReplayLink, type Deployment, type Session } from './api'

function fmt(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

export function StudiesView() {
  const { vsBaseUrl } = parseParams(window.location.search)
  const session = useSession()
  const isResearcher = !!session.user?.roles?.includes('researcher')
  const [deployments, setDeployments] = useState<Deployment[]>([])
  const [selected, setSelected] = useState('')
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!isResearcher) return
    let live = true
    listDeployments(vsBaseUrl, session.authFetch)
      .then((d) => { if (!live) return; setDeployments(d); if (d.length && !selected) setSelected(d[0].deployment_id) })
      .catch(() => { if (live) setDeployments([]) })
    return () => { live = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isResearcher, vsBaseUrl, session.authFetch])

  useEffect(() => {
    if (!selected) { setSessions([]); return }
    let live = true
    setLoading(true)
    listSessions(vsBaseUrl, session.authFetch, selected)
      .then((s) => { if (live) setSessions(s) })
      .catch(() => { if (live) setSessions([]) })
      .finally(() => { if (live) setLoading(false) })
    return () => { live = false }
  }, [selected, vsBaseUrl, session.authFetch])

  async function copyLink(sid: string) {
    try {
      const link = await mintReplayLink(vsBaseUrl, session.authFetch, selected, sid)
      const url = link.replay_url ?? link.bundle_url
      await navigator.clipboard.writeText(url)
      setCopied((c) => ({ ...c, [sid]: link.replay_url ? 'Copied ✓' : 'Copied bundle URL—set WEB_VIEWER_BASE_URL for a player link' }))
    } catch {
      setCopied((c) => ({ ...c, [sid]: 'Could not copy the link' }))
    }
  }

  if (!isResearcher) {
    return <p className="text-sm text-zinc-500">Researchers only. Log in with a researcher account to view studies.</p>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-lg font-semibold tracking-tight text-zinc-900">Studies</h1>
        <label className="flex items-center gap-2 text-sm text-zinc-500">
          Deployment
          <select value={selected} onChange={(e) => setSelected(e.target.value)}
            className="rounded-lg border border-zinc-200 bg-white px-2 py-1 text-sm text-zinc-800">
            <option value="">Select…</option>
            {deployments.map((d) => <option key={d.deployment_id} value={d.deployment_id}>{d.questionnaire_ref} · {d.deployment_id}</option>)}
          </select>
        </label>
      </div>

      {loading ? <p className="text-sm text-zinc-400">Loading sessions…</p>
        : !selected ? <p className="text-sm text-zinc-400">Pick a deployment to see its sessions.</p>
        : sessions.length === 0 ? <p className="text-sm text-zinc-400">No sessions for this deployment yet.</p>
        : (
          <ul className="divide-y divide-zinc-100 overflow-hidden rounded-2xl border border-zinc-200/80 bg-white">
            {sessions.map((s) => (
              <li key={s.session_id} className="flex items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="truncate font-mono text-sm text-zinc-800">{s.session_id}</p>
                  <p className="mt-0.5 text-xs text-zinc-500">
                    {s.status} · {s.participant_sub ?? 'anon'} · {fmt(s.submitted_at ?? s.completed_at ?? s.started_at)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {copied[s.session_id] && <span className="text-xs text-emerald-600">{copied[s.session_id]}</span>}
                  <button onClick={() => void copyLink(s.session_id)}
                    className="rounded-full border border-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100">
                    Copy replay link
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
    </div>
  )
}
