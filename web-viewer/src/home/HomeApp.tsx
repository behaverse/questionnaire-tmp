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
  return `${base}?${q.toString()}`
}

export function HomeApp() {
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

  return (
    <main className="min-h-screen px-6 py-8 font-theme max-w-2xl mx-auto">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Available questionnaires</h1>
        <a className="text-sm text-slate-500 underline" href={carry('mydata.html', {})}>My data</a>
      </header>
      {loaded && items.length === 0 ? (
        <p className="text-slate-600">No questionnaires available right now.</p>
      ) : (
        <ul className="space-y-3">
          {items.map((it) => (
            <li key={it.deployment_id} className="border rounded p-4 flex items-center justify-between gap-4">
              <div>
                <div className="font-medium">{it.title}</div>
                {it.description ? <div className="text-sm text-slate-500">{it.description}</div> : null}
              </div>
              <a className="qv-button qv-focusable px-4 py-2 shrink-0"
                 href={carry('index.html', { deployment: it.deployment_id })}>Start</a>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
