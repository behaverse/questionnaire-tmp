import type { ReactNode } from 'react'
import { useSession } from '@behaverse/participant-session'
import { useRoute, Link } from './router'

const NAV = [
  { to: '/', label: 'Questionnaires' },
  { to: '/my-data', label: 'My data' },
  { to: '/account', label: 'Account' },
]

export function NavShell({ children }: { children: ReactNode }) {
  const session = useSession()
  const route = useRoute()
  const nav = session.user?.roles?.includes('researcher') ? [...NAV, { to: '/studies', label: 'Studies' }] : NAV
  return (
    <div className="min-h-screen bg-zinc-50 font-theme text-zinc-900 antialiased">
      <header className="border-b border-zinc-200/70 bg-white/70 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-6 py-3">
          <nav className="flex items-center gap-1">
            <span className="mr-2 inline-flex items-center gap-2 text-sm font-semibold text-zinc-900">
              <span className="h-2 w-2 rounded-full bg-violet-500" aria-hidden /> Behaverse
            </span>
            {nav.map((n) => (
              <Link key={n.to} to={n.to}
                className={
                  'rounded-full px-3 py-1.5 text-sm font-medium transition ' +
                  (route === n.to ? 'bg-zinc-900 text-white' : 'text-zinc-500 hover:bg-zinc-200/60 hover:text-zinc-800')
                }>
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="text-sm">
            {session.status === 'authed' && session.user ? (
              <span className="flex items-center gap-2 text-zinc-500">
                <span aria-hidden className="grid h-7 w-7 place-items-center rounded-full bg-zinc-900 text-xs font-semibold text-white">
                  {(session.user.display_name || session.user.email).charAt(0).toUpperCase()}
                </span>
                <span className="max-w-[12rem] truncate text-zinc-700">{session.user.email}</span>
                <button onClick={() => void session.logout()}
                  className="rounded-full px-3 py-1.5 font-medium text-zinc-500 transition hover:bg-zinc-200/60 hover:text-zinc-800">
                  Log out
                </button>
              </span>
            ) : session.status === 'anon' ? (
              <Link to="/account" className="rounded-full px-3 py-1.5 font-medium text-zinc-500 transition hover:bg-zinc-200/60 hover:text-zinc-800">Log in</Link>
            ) : null}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-6 py-10 sm:py-14">{children}</main>
    </div>
  )
}
