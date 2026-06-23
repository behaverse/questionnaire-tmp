import { useState } from 'react'
import { parseParams } from '../app/bootstrap'
import { useSession } from '../session/SessionProvider'
import { register, changePassword } from '../session/client'
import { inputCls, primaryBtn } from './ui'

function ChangePasswordForm() {
  const s = useSession()
  const identityBaseUrl = parseParams(window.location.search).identityBaseUrl
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr(null); setMsg(null)
    if (next.length < 8) { setErr('New password must be at least 8 characters.'); return }
    setBusy(true)
    const r = await changePassword(s.authFetch, identityBaseUrl, current, next)
    setBusy(false)
    if (r.ok) { setMsg('Password updated.'); setCurrent(''); setNext(''); return }
    setErr(r.error === 'wrong_password' ? 'Current password is incorrect.'
      : r.error === 'invalid' ? 'New password must be at least 8 characters.'
      : 'Network error — try again.')
  }

  return (
    <form onSubmit={submit} className="space-y-3 border-t border-zinc-100 pt-4">
      <div className="text-sm font-semibold text-zinc-900">Change password</div>
      <input aria-label="Current password" type="password" autoComplete="current-password" value={current}
             onChange={(e) => setCurrent(e.target.value)} required className={inputCls} placeholder="Current password" />
      <input aria-label="New password" type="password" autoComplete="new-password" value={next}
             onChange={(e) => setNext(e.target.value)} required className={inputCls} placeholder="New password" />
      {err ? <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p> : null}
      {msg ? <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{msg}</p> : null}
      <button type="submit" disabled={busy} className={primaryBtn}>{busy ? 'Saving…' : 'Update password'}</button>
    </form>
  )
}

function Profile() {
  const s = useSession()
  if (!s.user) return null
  return (
    <div className="mx-auto max-w-sm space-y-4 rounded-2xl border border-zinc-200/80 bg-white p-8 shadow-sm">
      <h1 className="text-2xl font-semibold tracking-tight">Your account</h1>
      <dl className="space-y-2 text-sm">
        <div className="flex justify-between gap-4"><dt className="text-zinc-500">Email</dt><dd className="font-medium text-zinc-800">{s.user.email}</dd></div>
        <div className="flex justify-between gap-4"><dt className="text-zinc-500">Name</dt><dd className="font-medium text-zinc-800">{s.user.display_name || '—'}</dd></div>
        <div className="flex justify-between gap-4"><dt className="text-zinc-500">Roles</dt><dd className="font-medium text-zinc-800">{s.user.roles.join(', ') || '—'}</dd></div>
      </dl>
      {!s.user.email_verified ? (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">Your email isn't verified yet.</p>
      ) : null}
      <ChangePasswordForm />
      <button onClick={() => void s.logout()} className={primaryBtn}>Log out</button>
    </div>
  )
}

export function AccountView() {
  const params = parseParams(window.location.search)
  const session = useSession()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  if (session.status === 'loading') return null
  if (session.status === 'authed') return <Profile />

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setErr(null)
    if (mode === 'register') {
      if (password.length < 8) { setErr('Password must be at least 8 characters.'); return }
      setBusy(true)
      const r = await register(params.identityBaseUrl, email, password, displayName)
      if (!r.ok) {
        setBusy(false)
        setErr(r.error === 'email_in_use' ? 'That email is already registered — log in instead.'
          : r.error === 'invalid' ? 'Password must be at least 8 characters.'
          : 'Network error — try again.')
        return
      }
    } else {
      setBusy(true)
    }
    const li = await session.login(email, password)
    setBusy(false)
    if (!li.ok) setErr(li.error === 'invalid_credentials' ? 'Invalid email or password' : 'Network error — try again')
  }

  return (
    <form onSubmit={submit} className="mx-auto max-w-sm space-y-5 rounded-2xl border border-zinc-200/80 bg-white p-8 shadow-sm">
      <div className="flex rounded-full bg-zinc-100 p-1 text-sm font-medium">
        <button type="button" onClick={() => { setMode('login'); setErr(null) }}
          className={'flex-1 rounded-full px-4 py-1.5 transition ' + (mode === 'login' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500')}>Sign in</button>
        <button type="button" onClick={() => { setMode('register'); setErr(null) }}
          className={'flex-1 rounded-full px-4 py-1.5 transition ' + (mode === 'register' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500')}>
          Create account
        </button>
      </div>

      {mode === 'register' ? (
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-zinc-700" htmlFor="acc-name">Name</label>
          <input id="acc-name" type="text" autoComplete="name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className={inputCls} />
        </div>
      ) : null}

      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-zinc-700" htmlFor="acc-email">Email</label>
        <input id="acc-email" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required className={inputCls} />
      </div>
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-zinc-700" htmlFor="acc-password">Password</label>
        <input id="acc-password" type="password" autoComplete={mode === 'register' ? 'new-password' : 'current-password'} value={password} onChange={(e) => setPassword(e.target.value)} required className={inputCls} />
      </div>

      {err ? <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p> : null}

      <button type="submit" disabled={busy} className={primaryBtn}>
        {busy ? 'Please wait…' : mode === 'register' ? 'Sign up' : 'Log in'}
      </button>
    </form>
  )
}
