import { useEffect, useState } from 'react'
import { parseParams } from '../app/bootstrap'
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

function Card({ item }: { item: CatalogueItem }) {
  return (
    <li className="group rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-md sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h2 className="truncate text-lg font-semibold tracking-tight text-zinc-900">{item.title}</h2>
          {item.description ? <p className="mt-1 text-sm leading-relaxed text-zinc-500">{item.description}</p> : null}
        </div>
        <a href={carry('index.html', { deployment: item.deployment_id, return_url: returnUrlFor(item.deployment_id) })}
          className="inline-flex shrink-0 items-center justify-center gap-1.5 self-start rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 sm:self-auto">
          Start
          <span aria-hidden className="transition-transform duration-200 group-hover:translate-x-0.5">→</span>
        </a>
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
  const [items, setItems] = useState<CatalogueItem[]>([])
  const [loaded, setLoaded] = useState(false)

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
      <ul className="space-y-4">{items.map((it) => <Card key={it.deployment_id} item={it} />)}</ul>
    </>
  )
}
