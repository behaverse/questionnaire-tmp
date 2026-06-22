import { useState } from 'react'
import { parseParams } from '../app/bootstrap'
import { loginParticipant } from '../app/auth'
import { LoginView } from '../app/chrome/LoginView'
import { fetchMySessions, downloadMyData, type MySession } from './client'

export function MyDataApp() {
  const params = parseParams(window.location.search)
  const [token, setToken] = useState<string | null>(null)
  const [sessions, setSessions] = useState<MySession[]>([])
  const [loginErr, setLoginErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [loaded, setLoaded] = useState(false)

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

  return (
    <main className="min-h-screen px-6 py-8 font-theme max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold mb-6">My data</h1>
      {loaded && sessions.length === 0 ? (
        <p className="text-slate-600">No completed questionnaires yet.</p>
      ) : (
        <ul className="space-y-2 mb-6">
          {sessions.map((s) => (
            <li key={s.session_id} className="border rounded p-3">
              <div className="font-medium">{s.instrument_id} <span className="text-slate-400">{s.instrument_version}</span></div>
              <div className="text-sm text-slate-500">{s.status} · session {s.session_index}{s.submitted_at ? ` · ${s.submitted_at}` : ''}</div>
            </li>
          ))}
        </ul>
      )}
      <button
        className="qv-button qv-focusable px-5 py-2.5"
        onClick={() => { void downloadMyData(params.vsBaseUrl, token).catch((e) => console.error(e)) }}>
        Download my data (CSV)
      </button>
    </main>
  )
}
