import { useEffect, useState } from 'react'
import { parseParams } from '../params'
import { useSession } from '@behaverse/participant-session'
import { Link } from '../shell/router'
import { fetchMySessions, downloadMyData, type MySession } from './client'

function StatusBadge({ status }: { status: string }) {
  const done = status === 'submitted' || status === 'completed' || status === 'forwarded' || status === 'validated'
  return (
    <span className={'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ' + (done ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700')}>
      <span className={'h-1.5 w-1.5 rounded-full ' + (done ? 'bg-emerald-500' : 'bg-amber-500')} aria-hidden />
      {status}
    </span>
  )
}

function fmtDate(iso: string | null): string | null {
  if (!iso) return null
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

function SessionRow({ s }: { s: MySession }) {
  const when = fmtDate(s.submitted_at ?? s.completed_at ?? s.started_at)
  return (
    <li className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm transition hover:border-zinc-300 hover:shadow-md sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate text-base font-semibold tracking-tight text-zinc-900">
            {s.instrument_id}<span className="ml-2 align-middle text-xs font-normal text-zinc-400">{s.instrument_version}</span>
          </h2>
          <p className="mt-1 text-sm text-zinc-500">Attempt {s.session_index}{when ? <span className="text-zinc-400"> · {when}</span> : null}</p>
        </div>
        <StatusBadge status={s.status} />
      </div>
    </li>
  )
}

function Skeleton() {
  return (
    <li className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex animate-pulse items-start justify-between gap-3">
        <div className="w-full space-y-3"><div className="h-4 w-1/3 rounded bg-zinc-200" /><div className="h-3 w-1/2 rounded bg-zinc-100" /></div>
        <div className="h-6 w-20 shrink-0 rounded-full bg-zinc-100" />
      </div>
    </li>
  )
}

export function MyDataView() {
  const params = parseParams(window.location.search)
  const session = useSession()
  const [sessions, setSessions] = useState<MySession[]>([])
  const [loaded, setLoaded] = useState(false)
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    if (session.status !== 'authed') return
    void (async () => {
      const list = await fetchMySessions(params.vsBaseUrl, session.authFetch)
      setLoaded(true)
      if (list.ok) setSessions(list.sessions)
    })()
  }, [session.status, params.vsBaseUrl, session.authFetch])

  if (session.status === 'loading') return null
  if (session.status === 'anon') {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-300 bg-white/60 px-6 py-16 text-center">
        <p className="text-base font-medium text-zinc-700">Log in to view your data.</p>
        <Link to="/account" className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-700">Log in</Link>
      </div>
    )
  }

  async function handleDownload() {
    setDownloading(true)
    try { await downloadMyData(params.vsBaseUrl, session.authFetch) }
    catch (e) { console.error(e) }
    finally { setDownloading(false) }
  }

  return (
    <>
      <header className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">My data</h1>
        <p className="mt-2 text-base text-zinc-500">The questionnaires you've completed. Download a copy of your responses anytime.</p>
      </header>
      {!loaded ? (
        <ul className="space-y-4"><Skeleton /><Skeleton /></ul>
      ) : sessions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-white/60 px-6 py-16 text-center">
          <p className="text-base font-medium text-zinc-700">No completed questionnaires yet.</p>
        </div>
      ) : (
        <ul className="space-y-4">{sessions.map((s) => <SessionRow key={s.session_id} s={s} />)}</ul>
      )}
      {loaded && sessions.length > 0 ? (
        <div className="mt-8 flex items-center justify-between gap-4 rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm sm:p-6">
          <div className="min-w-0">
            <div className="text-sm font-semibold text-zinc-900">Export your responses</div>
            <div className="mt-0.5 text-sm text-zinc-500">A CSV of every answer you've submitted.</div>
          </div>
          <button onClick={() => void handleDownload()} disabled={downloading}
            className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60">
            {downloading ? 'Preparing…' : 'Download my data (CSV)'}
          </button>
        </div>
      ) : null}
    </>
  )
}
