import { useEffect, useState } from 'react'
import { applyTheme } from '../app/theme'
import { getTheme, resolveThemeId } from '../theme/registry'
import { reconstruct } from './reconstruct'
import { buildCursor, findRecordingStartMs } from './cursor'
import { loadBundle, type ReplayBundle } from './load'
import { ReplayView } from './ReplayView'

type Phase = { kind: 'loading' } | { kind: 'error'; error: string } | { kind: 'ready'; bundle: ReplayBundle }

export function ReplayApp({ src, themeParam }: { src: string; themeParam?: string | null }) {
  const [phase, setPhase] = useState<Phase>({ kind: 'loading' })
  useEffect(() => {
    let live = true
    applyTheme(getTheme(resolveThemeId({ themeParam: themeParam ?? null })))
    loadBundle(src).then((r) => { if (live) setPhase(r.ok ? { kind: 'ready', bundle: r.bundle } : { kind: 'error', error: r.error }) })
    return () => { live = false }
  }, [src, themeParam])

  if (phase.kind === 'loading') return <div style={{ padding: 40, textAlign: 'center' }}>Loading replay…</div>
  if (phase.kind === 'error') return <div style={{ padding: 40, textAlign: 'center' }}><h1>Replay unavailable</h1><p>{phase.error}</p></div>

  const { runtime, statements, mouse } = phase.bundle
  const timeline = reconstruct(statements)
  const recStart = findRecordingStartMs(statements) ?? timeline.startMs
  const cursorAt = buildCursor(mouse ?? [], recStart)
  return <ReplayView runtime={runtime} timeline={timeline} cursorAt={cursorAt} />
}
