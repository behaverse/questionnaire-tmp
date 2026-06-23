import { useState } from 'react'

type Props = { onSubmit: (email: string, password: string) => void; error: string | null; busy: boolean }

const inputCls =
  'w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10'

export function LoginView({ onSubmit, error, busy }: Props) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  return (
    <div className="qv-login flex min-h-screen items-center justify-center bg-zinc-50 px-6 font-theme text-zinc-900 antialiased">
      <form
        onSubmit={(e) => { e.preventDefault(); onSubmit(email, password) }}
        className="w-full max-w-sm space-y-5 rounded-2xl border border-zinc-200/80 bg-white p-8 shadow-sm"
      >
        <div>
          <span className="inline-flex items-center gap-2 text-sm font-medium text-zinc-400">
            <span className="h-2 w-2 rounded-full bg-violet-500" aria-hidden />
            Behaverse
          </span>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-900">Log in to continue</h1>
          <p className="mt-1 text-sm text-zinc-500">Sign in to your participant account.</p>
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-zinc-700" htmlFor="qv-login-email">Email</label>
          <input id="qv-login-email" type="email" autoComplete="username" value={email}
                 onChange={(e) => setEmail(e.target.value)} required className={inputCls} />
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-zinc-700" htmlFor="qv-login-password">Password</label>
          <input id="qv-login-password" type="password" autoComplete="current-password" value={password}
                 onChange={(e) => setPassword(e.target.value)} required className={inputCls} />
        </div>

        {error ? (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        ) : null}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? 'Logging in…' : 'Log in'}
        </button>
      </form>
    </div>
  )
}
