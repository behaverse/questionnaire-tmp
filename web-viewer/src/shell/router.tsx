import { useSyncExternalStore, type ReactNode, type MouseEvent } from 'react'
import { flushSync } from 'react-dom'

const listeners = new Set<() => void>()
function notify() { flushSync(() => { listeners.forEach((l) => l()) }) }

function onPopState() { flushSync(() => { listeners.forEach((l) => l()) }) }
window.addEventListener('popstate', onPopState)

function preservedSearch(): string {
  const cur = new URLSearchParams(window.location.search)
  const q = new URLSearchParams()
  for (const k of ['viewer_url', 'identity_url']) {
    const v = cur.get(k)
    if (v) q.set(k, v)
  }
  const s = q.toString()
  return s ? `?${s}` : ''
}

export function navigate(path: string): void {
  window.history.pushState(null, '', path + preservedSearch())
  notify()
}

function subscribe(cb: () => void): () => void {
  listeners.add(cb)
  return () => { listeners.delete(cb) }
}

export function useRoute(): string {
  return useSyncExternalStore(subscribe, () => window.location.pathname, () => '/')
}

export function Link({ to, className, children }: { to: string; className?: string; children: ReactNode }) {
  function onClick(e: MouseEvent) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
    e.preventDefault()
    navigate(to)
  }
  return <a href={to} className={className} onClick={onClick}>{children}</a>
}
