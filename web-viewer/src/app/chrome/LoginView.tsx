import { useState } from 'react'

type Props = { onSubmit: (email: string, password: string) => void; error: string | null; busy: boolean }

export function LoginView({ onSubmit, error, busy }: Props) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  return (
    <div className="qv-login">
      <form onSubmit={(e) => { e.preventDefault(); onSubmit(email, password) }}>
        <h1>Log in to continue</h1>
        <label htmlFor="qv-login-email">Email</label>
        <input id="qv-login-email" type="email" autoComplete="username" value={email}
               onChange={(e) => setEmail(e.target.value)} required />
        <label htmlFor="qv-login-password">Password</label>
        <input id="qv-login-password" type="password" autoComplete="current-password" value={password}
               onChange={(e) => setPassword(e.target.value)} required />
        {error ? <p role="alert">{error}</p> : null}
        <button type="submit" disabled={busy}>{busy ? 'Logging in…' : 'Log in'}</button>
      </form>
    </div>
  )
}
