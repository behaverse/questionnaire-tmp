import { useEffect, useState } from 'react'
import { applyTheme } from '../app/theme'
import { getTheme, resolveThemeId } from '../theme/registry'
import { reconstruct } from './reconstruct'
import { buildCursor, findRecordingStartMs } from './cursor'
import { loadBundle, type ReplayBundle } from './load'
import { ReplayView } from './ReplayView'
import { isTerminal, POLL_MS, NO_CHANGE_CAP } from './follow'

type Phase = { kind: 'loading' } | { kind: 'error'; error: string } | { kind: 'ready'; bundle: ReplayBundle }

export function ReplayApp({ src, themeParam, follow = false }: { src: string; themeParam?: string | null; follow?: boolean }) {
  const [phase, setPhase] = useState<Phase>({ kind: 'loading' })
  const [following, setFollowing] = useState(true)

  useEffect(() => {
    let live = true
    applyTheme(getTheme(resolveThemeId({ themeParam: themeParam ?? null })))
    loadBundle(src).then((r) => { if (live) setPhase(r.ok ? { kind: 'ready', bundle: r.bundle } : { kind: 'error', error: r.error }) })
    return () => { live = false }
  }, [src, themeParam])

  const ready = phase.kind === 'ready'
  useEffect(() => {
    if (!follow || !ready) return
    let cancelled = false
    let noChange = 0
    let lastLen = -1
    const id = setInterval(async () => {
      const r = await loadBundle(src)
      if (cancelled || !r.ok) return                       // transient error: keep last, keep polling
      setPhase((p) => (p.kind === 'ready' ? { kind: 'ready', bundle: r.bundle } : p))
      if (isTerminal(r.bundle.statements)) { clearInterval(id); return }   // session ended
      noChange = r.bundle.statements.length > lastLen ? 0 : noChange + 1
      lastLen = r.bundle.statements.length
      if (noChange >= NO_CHANGE_CAP) clearInterval(id)     // abandoned: stop polling
    }, POLL_MS)
    return () => { cancelled = true; clearInterval(id) }
  }, [follow, ready, src])

  if (phase.kind === 'loading') return <div style={{ padding: 40, textAlign: 'center' }}>Loading replay…</div>
  if (phase.kind === 'error') return <div style={{ padding: 40, textAlign: 'center' }}><h1>Replay unavailable</h1><p>{phase.error}</p></div>

  const { runtime, statements, mouse } = phase.bundle
  const ended = isTerminal(statements)
  const timeline = reconstruct(statements)
  const recStart = findRecordingStartMs(statements) ?? timeline.startMs
  const cursorAt = buildCursor(mouse ?? [], recStart)
  return <ReplayView runtime={runtime} timeline={timeline} cursorAt={cursorAt}
    follow={follow ? { following, ended, onToggle: () => setFollowing((f) => !f) } : undefined} />
}
