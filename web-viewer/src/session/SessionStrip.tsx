import { useSession } from './SessionProvider'

export function SessionStrip() {
  const s = useSession()
  if (s.status !== 'authed' || !s.user) return null
  return (
    <div className="mb-6 flex items-center justify-end gap-3 text-sm text-zinc-500">
      <span>Signed in as <span className="font-medium text-zinc-700">{s.user.email}</span></span>
      <button
        onClick={() => void s.logout()}
        className="rounded-full px-3 py-1.5 font-medium text-zinc-500 transition hover:bg-zinc-200/60 hover:text-zinc-800"
      >
        Log out
      </button>
    </div>
  )
}
