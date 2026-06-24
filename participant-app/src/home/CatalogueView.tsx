import { useEffect, useState } from 'react'
import { useSession, mintHandoff } from '@behaverse/participant-session'
import { parseParams } from '../params'
import { fetchCatalogue, type CatalogueItem } from './client'

function carry(base: string, extra: Record<string, string>): string {
  const q = new URLSearchParams()
  for (const [k, v] of Object.entries(extra)) q.set(k, v)
  const cur = new URLSearchParams(window.location.search)
  for (const k of ['viewer_url', 'identity_url']) {
    const v = cur.get(k)
    if (v) q.set(k, v)
  }
  const qs = q.toString()
  return qs ? `${base}?${qs}` : base
}

/** The player URL that runs a deployment, carrying a return_url back to this catalogue. */
function launchUrl(playerBaseUrl: string, deploymentId: string): string {
  return carry(`${playerBaseUrl}/`, { deployment: deploymentId, return_url: returnUrlFor(deploymentId) })
}

/** Absolute URL back to this catalogue, marked so we can greet the returning participant.
 *  Absolute (built from origin) so the player's safeReturnUrl accepts it; carries the dev
 *  service-URL overrides so the returned portal keeps talking to the same services. */
export function returnUrlFor(deploymentId: string): string {
  const u = new URL('/', window.location.origin)
  u.searchParams.set('done', deploymentId)
  const cur = new URLSearchParams(window.location.search)
  for (const k of ['viewer_url', 'identity_url']) {
    const v = cur.get(k)
    if (v) u.searchParams.set(k, v)
  }
  return u.toString()
}

function DoneBanner({ items }: { items: CatalogueItem[] }) {
  const [dismissed, setDismissed] = useState(false)
  const done = new URLSearchParams(window.location.search).get('done')
  if (!done || dismissed) return null
  const title = items.find((i) => i.deployment_id === done)?.title
  function dismiss() {
    setDismissed(true)
    const q = new URLSearchParams(window.location.search)
    q.delete('done')
    const qs = q.toString()
    window.history.replaceState(null, '', window.location.pathname + (qs ? `?${qs}` : ''))
  }
  return (
    <div role="status" className="mb-6 flex items-start justify-between gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4">
      <p className="text-sm leading-relaxed text-emerald-900">
        <span className="font-semibold">✓ All done — thanks for taking part.</span>{' '}
        {title ? <>You finished “{title}”. </> : null}Pick another below.
      </p>
      <button onClick={dismiss} aria-label="Dismiss" className="shrink-0 rounded-full px-2 py-1 text-emerald-700 transition hover:bg-emerald-100">✕</button>
    </div>
  )
}

const startCls = 'inline-flex shrink-0 items-center justify-center gap-1.5 self-start rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 sm:self-auto'

function Card({ item, playerBaseUrl, identityStart }: { item: CatalogueItem; playerBaseUrl: string; identityStart?: () => void }) {
  const arrow = <span aria-hidden className="transition-transform duration-200 group-hover:translate-x-0.5">→</span>
  return (
    <li className="group rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-md sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h2 className="truncate text-lg font-semibold tracking-tight text-zinc-900">{item.title}</h2>
          {item.description ? <p className="mt-1 text-sm leading-relaxed text-zinc-500">{item.description}</p> : null}
        </div>
        {/* a signed-in participant launching an authenticated questionnaire gets a one-time SSO
            handoff so the player doesn't re-prompt login; everything else is a plain link */}
        {identityStart
          ? <button onClick={identityStart} className={startCls}>Start {arrow}</button>
          : <a href={launchUrl(playerBaseUrl, item.deployment_id)} className={startCls}>Start {arrow}</a>}
      </div>
    </li>
  )
}

function Skeleton() {
  return (
    <li className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex animate-pulse items-center justify-between gap-4">
        <div className="w-full space-y-3">
          <div className="h-4 w-2/5 rounded bg-zinc-200" />
          <div className="h-3 w-3/4 rounded bg-zinc-100" />
        </div>
        <div className="h-10 w-24 shrink-0 rounded-full bg-zinc-200" />
      </div>
    </li>
  )
}

export function CatalogueView() {
  const params = parseParams(window.location.search)
  const session = useSession()
  const [items, setItems] = useState<CatalogueItem[]>([])
  const [loaded, setLoaded] = useState(false)

  // For an authenticated questionnaire while signed in: mint a one-time handoff code, then launch
  // the player with it (no re-login on the player origin). Falls back to a plain launch on failure.
  function identityStartFor(item: CatalogueItem): (() => void) | undefined {
    if (item.auth !== 'identity' || session.status !== 'authed' || !session.accessToken) return undefined
    return () => {
      void (async () => {
        const base = launchUrl(params.playerBaseUrl, item.deployment_id)
        const r = await mintHandoff(params.identityBaseUrl, session.accessToken!)
        window.location.href = r.ok ? `${base}&handoff=${encodeURIComponent(r.code)}` : base
      })()
    }
  }

  useEffect(() => {
    void (async () => {
      const res = await fetchCatalogue(params.vsBaseUrl)
      if (res.ok) setItems(res.items)
      setLoaded(true)
    })()
  }, [params.vsBaseUrl])

  if (!loaded) return <ul className="space-y-4"><Skeleton /><Skeleton /></ul>
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-300 bg-white/60 px-6 py-16 text-center">
        <p className="text-base font-medium text-zinc-700">No questionnaires available right now.</p>
      </div>
    )
  }
  return (
    <>
      <DoneBanner items={items} />
      <ul className="space-y-4">{items.map((it) => <Card key={it.deployment_id} item={it} playerBaseUrl={params.playerBaseUrl} identityStart={identityStartFor(it)} />)}</ul>
    </>
  )
}
