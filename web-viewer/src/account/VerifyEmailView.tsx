import { useEffect, useState } from 'react'
import { parseParams } from '../app/bootstrap'
import { Link } from '../shell/router'
import { verifyEmail } from '../session/client'
import { cardCls } from './ui'

export function VerifyEmailView() {
  const identityBaseUrl = parseParams(window.location.search).identityBaseUrl
  const token = new URLSearchParams(window.location.search).get('token')
  const [state, setState] = useState<'verifying' | 'ok' | 'invalid'>(token ? 'verifying' : 'invalid')

  useEffect(() => {
    if (!token) return
    void (async () => {
      const r = await verifyEmail(identityBaseUrl, token)
      setState(r.ok ? 'ok' : 'invalid')
    })()
  }, [identityBaseUrl, token])

  return (
    <div className={cardCls + ' text-center'}>
      {state === 'verifying' ? (
        <p className="text-sm text-zinc-500">Verifying your email…</p>
      ) : state === 'ok' ? (
        <>
          <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">Email verified.</p>
          <Link to="/account" className="block text-center text-sm text-zinc-500 underline">Sign in</Link>
        </>
      ) : (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">This link is invalid or expired.</p>
      )}
    </div>
  )
}
