import { useState } from 'react'
import { parseParams } from '../params'
import { Link } from '../shell/router'
import { requestPasswordReset, resetPassword } from '@behaverse/participant-session'
import { inputCls, primaryBtn, cardCls } from './ui'

export function ResetPasswordView() {
  const identityBaseUrl = parseParams(window.location.search).identityBaseUrl
  const token = new URLSearchParams(window.location.search).get('token')
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function requestSubmit(e: React.FormEvent) {
    e.preventDefault(); setErr(null); setMsg(null); setBusy(true)
    const r = await requestPasswordReset(identityBaseUrl, email)
    setBusy(false)
    if (r.ok) setMsg("If an account exists for that email, we've sent a reset link.")
    else setErr('Network error — try again.')
  }

  async function resetSubmit(e: React.FormEvent) {
    e.preventDefault(); setErr(null); setMsg(null)
    if (pw.length < 8) { setErr('New password must be at least 8 characters.'); return }
    setBusy(true)
    const r = await resetPassword(identityBaseUrl, token as string, pw)
    setBusy(false)
    if (r.ok) { setMsg('Password reset. You can now sign in.'); setPw(''); return }
    setErr(r.error === 'invalid_token' ? 'This reset link is invalid or expired.'
      : r.error === 'weak_password' ? 'New password must be at least 8 characters.'
      : 'Network error — try again.')
  }

  if (!token) {
    return (
      <form onSubmit={requestSubmit} className={cardCls}>
        <h1 className="text-2xl font-semibold tracking-tight">Reset your password</h1>
        <p className="text-sm text-zinc-500">Enter your email and we'll send a reset link.</p>
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-zinc-700" htmlFor="rp-email">Email</label>
          <input id="rp-email" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required className={inputCls} />
        </div>
        {err ? <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p> : null}
        {msg ? <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{msg}</p> : null}
        <button type="submit" disabled={busy} className={primaryBtn}>{busy ? 'Sending…' : 'Send reset link'}</button>
        <Link to="/account" className="block text-center text-sm text-zinc-500 underline">Back to sign in</Link>
      </form>
    )
  }
  return (
    <form onSubmit={resetSubmit} className={cardCls}>
      <h1 className="text-2xl font-semibold tracking-tight">Set a new password</h1>
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-zinc-700" htmlFor="rp-new">New password</label>
        <input id="rp-new" type="password" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} required className={inputCls} />
      </div>
      {err ? <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p> : null}
      {msg ? <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{msg} <Link to="/account" className="underline">Sign in</Link></p> : null}
      <button type="submit" disabled={busy} className={primaryBtn}>{busy ? 'Saving…' : 'Reset password'}</button>
    </form>
  )
}
