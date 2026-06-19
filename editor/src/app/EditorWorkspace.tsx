import { useEffect, useState } from 'react'
import { useEditorStore } from '../state/store'
import { StructureTree } from '../tree/StructureTree'
import { Canvas } from '../canvas/Canvas'
import { Inspector } from '../inspector/Inspector'
import { PreviewPane } from '../preview/PreviewPane'

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))

function usePersistedWidth(key: string, initial: number): [number, (fn: (w: number) => number) => void] {
  const [w, setW] = useState<number>(() => {
    const s = Number(localStorage.getItem(key))
    return Number.isFinite(s) && s > 0 ? s : initial
  })
  useEffect(() => { try { localStorage.setItem(key, String(w)) } catch { /* ignore */ } }, [key, w])
  return [w, (fn) => setW((prev) => fn(prev))]
}

/** Thin draggable divider between panels. Reports the horizontal delta per move. */
function Resizer({ onDrag, label }: { onDrag: (dx: number) => void; label: string }) {
  const onPointerDown = (e: React.PointerEvent) => {
    e.preventDefault()
    let last = e.clientX
    const move = (ev: PointerEvent) => { onDrag(ev.clientX - last); last = ev.clientX }
    const up = () => {
      document.removeEventListener('pointermove', move)
      document.removeEventListener('pointerup', up)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
    document.addEventListener('pointermove', move)
    document.addEventListener('pointerup', up)
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }
  return (
    <div role="separator" aria-label={label} aria-orientation="vertical" onPointerDown={onPointerDown}
         className="cursor-col-resize bg-ed-border transition-colors hover:bg-ed-accent" />
  )
}

export function EditorWorkspace() {
  const previewOpen = useEditorStore((s) => s.previewOpen)
  const inspectorOpen = useEditorStore((s) => s.inspectorOpen)
  const [leftW, setLeftW] = usePersistedWidth('qv-left-w', 260)
  const [previewW, setPreviewW] = usePersistedWidth('qv-preview-w', 480)
  const [rightW, setRightW] = usePersistedWidth('qv-right-w', 320)

  // Columns are assembled from whichever panels are open (each open panel adds a 5px resizer).
  const cols = [
    `${leftW}px`, '5px', 'minmax(0,1fr)',
    ...(previewOpen ? ['5px', `${previewW}px`] : []),
    ...(inspectorOpen ? ['5px', `${rightW}px`] : []),
  ].join(' ')

  return (
    <div className="grid min-h-0 flex-1 overflow-hidden [&>*]:min-h-0" style={{ gridTemplateColumns: cols }}>
      <StructureTree />
      <Resizer label="Resize structure panel" onDrag={(dx) => setLeftW((w) => clamp(w + dx, 180, 520))} />
      <Canvas />
      {previewOpen && <Resizer label="Resize preview panel" onDrag={(dx) => setPreviewW((w) => clamp(w - dx, 300, 960))} />}
      {previewOpen && <PreviewPane />}
      {inspectorOpen && <Resizer label="Resize inspector panel" onDrag={(dx) => setRightW((w) => clamp(w - dx, 240, 600))} />}
      {inspectorOpen && <Inspector />}
    </div>
  )
}
