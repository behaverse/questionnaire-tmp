// editor/src/library/browser/EntityInspector.tsx
import { useEffect, useState } from 'react'
import { parseRef } from '../../persistence/library'
import type { LibraryClient } from './client'

type ContentEntry = { status?: string; text?: string; label?: string; units?: string; options?: { index: number; text?: string }[] }

// structural (non-content, non-id) scalar/array fields, rendered read-only
function structuralFields(body: Record<string, unknown>): [string, string][] {
  return Object.entries(body)
    .filter(([k]) => k !== 'content' && k !== 'id')
    .map(([k, v]) => [k, typeof v === 'object' ? JSON.stringify(v) : String(v)])
}

export function EntityInspector({ refStr, client }: { refStr: string | null; client: LibraryClient }) {
  const [body, setBody] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  useEffect(() => {
    if (!refStr) { setBody(null); return }
    let alive = true
    setLoading(true); setErr(''); setBody(null)
    client.fetchEntityBody(refStr)
      .then((b) => { if (alive) { setBody(b); setLoading(false) } })
      .catch(() => { if (alive) { setErr('Could not load this entity.'); setLoading(false) } })
    return () => { alive = false }
  }, [refStr, client])

  if (!refStr) return <div className="p-8 text-sm text-ed-muted">Select an entity from the list to inspect it.</div>
  if (loading) return <div className="p-8 text-sm text-ed-muted">Loading…</div>
  if (err) return <div className="p-8 text-sm text-red-600">{err}</div>
  if (!body) return <div className="p-8 text-sm text-ed-muted">Entity not found.</div>

  const type = parseRef(refStr)?.type ?? 'entity'
  const content = (body.content ?? {}) as Record<string, ContentEntry>

  return (
    <div className="mx-auto max-w-3xl p-6">
      <div className="mb-4 flex items-center gap-2">
        <span className="rounded bg-ed-accent-soft px-1.5 py-0.5 text-xs font-medium text-ed-accent">{type}</span>
        <span className="font-mono text-sm text-ed-text">{refStr}</span>
      </div>

      <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-ed-muted">Fields</h3>
      <dl className="mb-5 grid grid-cols-[10rem_1fr] gap-x-4 gap-y-1 text-sm">
        {structuralFields(body).map(([k, v]) => (
          <div key={k} className="contents"><dt className="text-ed-muted">{k}</dt><dd className="break-words font-mono text-ed-text">{v}</dd></div>
        ))}
      </dl>

      <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-ed-muted">Content</h3>
      {Object.keys(content).length === 0 && <div className="text-sm text-ed-muted">No translatable content.</div>}
      {Object.entries(content).map(([locale, c]) => (
        <div key={locale} className="mb-3 rounded-lg border border-ed-border bg-ed-panel p-3">
          <div className="mb-1 flex items-center gap-2 text-xs">
            <span className="rounded bg-ed-subtle px-1.5 py-0.5 font-medium text-ed-muted">{locale}</span>
            {c.status && <span className="text-ed-muted">{c.status}</span>}
          </div>
          {c.text && <div className="whitespace-pre-wrap text-sm leading-relaxed text-ed-text">{c.text}</div>}
          {c.label && <div className="text-sm text-ed-text">{c.label}{c.units ? ` (${c.units})` : ''}</div>}
          {c.options && c.options.length > 0 && (
            <ul className="mt-1 list-inside list-disc text-sm text-ed-text">
              {c.options.map((o) => <li key={o.index}>{o.text || <span className="italic text-ed-muted/60">(empty)</span>}</li>)}
            </ul>
          )}
        </div>
      ))}
    </div>
  )
}
