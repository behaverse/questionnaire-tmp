import { useState } from 'react'
import { parseParams } from '../app/bootstrap'
import { loginParticipant } from '../app/auth'
import { LoginView } from '../app/chrome/LoginView'
import { fetchMySessions, downloadMyData, type MySession } from './client'

function carry(base: string): string {
  const q = new URLSearchParams()
  const cur = new URLSearchParams(window.location.search)
  for (const k of ['viewer_url', 'identity_url']) {
    const v = cur.get(k)
    if (v) q.set(k, v)
  }
  const qs = q.toString()
  return qs ? `${base}?${qs}` : base
}

function StatusBadge({ status }: { status: string }) {
  const done = status === 'submitted' || status === 'completed' || status === 'forwarded' || status === 'validated'
  return (
    <span
      className={
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ' +
        (done ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700')
      }
    >
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
            {s.instrument_id}
            <span className="ml-2 align-middle text-xs font-normal text-zinc-400">{s.instrument_version}</span>
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            Attempt {s.session_index}
            {when ? <span className="text-zinc-400"> · {when}</span> : null}
          </p>
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
        <div className="w-full space-y-3">
          <div className="h-4 w-1/3 rounded bg-zinc-200" />
          <div className="h-3 w-1/2 rounded bg-zinc-100" />
        </div>
        <div className="h-6 w-20 shrink-0 rounded-full bg-zinc-100" />
      </div>
    </li>
  )
}

export function MyDataApp() {
  const params = parseParams(window.location.search)
  const [token, setToken] = useState<string | null>(null)
  const [sessions, setSessions] = useState<MySession[]>([])
  const [loginErr, setLoginErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [downloading, setDownloading] = useState(false)

  async function handleLogin(email: string, password: string) {
    setBusy(true); setLoginErr(null)
    const res = await loginParticipant(params.identityBaseUrl, email, password)
    if (!res.ok) {
      setBusy(false)
      setLoginErr(res.error === 'invalid_credentials' ? 'Invalid email or password' : 'Network error — try again')
      return
    }
    setToken(res.accessToken)
    const list = await fetchMySessions(params.vsBaseUrl, res.accessToken)
    setBusy(false)
    setLoaded(true)
    if (list.ok) setSessions(list.sessions)
  }

  if (!token) return <LoginView onSubmit={handleLogin} error={loginErr} busy={busy} />

  async function handleDownload() {
    if (!token) return
    setDownloading(true)
    try { await downloadMyData(params.vsBaseUrl, token) }
    catch (e) { console.error(e) }
    finally { setDownloading(false) }
  }

  return (
    <div className="min-h-screen bg-zinc-50 font-theme text-zinc-900 antialiased">
      <div className="mx-auto max-w-2xl px-6 py-10 sm:py-16">
        <div className="mb-6 flex items-center justify-between">
          <span className="inline-flex items-center gap-2 text-sm font-medium text-zinc-400">
            <span className="h-2 w-2 rounded-full bg-violet-500" aria-hidden />
            Behaverse
          </span>
          <a
            href={carry('home.html')}
            className="rounded-full px-3 py-1.5 text-sm font-medium text-zinc-500 transition hover:bg-zinc-200/60 hover:text-zinc-800"
          >
            Questionnaires
          </a>
        </div>

        <header className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">My data</h1>
          <p className="mt-2 text-base text-zinc-500">
            The questionnaires you've completed. Download a copy of your responses anytime.
          </p>
        </header>

        {!loaded ? (
          <ul className="space-y-4">
            <Skeleton />
            <Skeleton />
          </ul>
        ) : sessions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-300 bg-white/60 px-6 py-16 text-center">
            <p className="text-base font-medium text-zinc-700">No completed questionnaires yet.</p>
            <p className="mx-auto mt-1 max-w-sm text-sm text-zinc-400">
              Once you finish a questionnaire it will appear here.
            </p>
            <a
              href={carry('home.html')}
              className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-700"
            >
              Browse questionnaires
              <span aria-hidden>→</span>
            </a>
          </div>
        ) : (
          <ul className="space-y-4">
            {sessions.map((s) => (
              <SessionRow key={s.session_id} s={s} />
            ))}
          </ul>
        )}

        {loaded && sessions.length > 0 ? (
          <div className="mt-8 flex items-center justify-between gap-4 rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm sm:p-6">
            <div className="min-w-0">
              <div className="text-sm font-semibold text-zinc-900">Export your responses</div>
              <div className="mt-0.5 text-sm text-zinc-500">A CSV of every answer you've submitted.</div>
            </div>
            <button
              onClick={() => { void handleDownload() }}
              disabled={downloading}
              className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {downloading ? 'Preparing…' : 'Download my data (CSV)'}
            </button>
          </div>
        ) : null}

        <footer className="mt-12 text-center text-xs text-zinc-400">
          Powered by the Behaverse questionnaire platform
        </footer>
      </div>
    </div>
  )
}
