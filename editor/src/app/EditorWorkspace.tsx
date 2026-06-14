import { useEditorStore } from '../state/store'
import { StructureTree } from '../tree/StructureTree'
import { Canvas } from '../canvas/Canvas'
import { Inspector } from '../inspector/Inspector'
import { PreviewPane } from '../preview/PreviewPane'

export function EditorWorkspace() {
  const previewOpen = useEditorStore((s) => s.previewOpen)
  const center = previewOpen ? 'grid-cols-[260px_1fr_1fr_320px]' : 'grid-cols-[260px_1fr_320px]'
  return (
    <div className={`grid flex-1 overflow-hidden ${center}`}>
      <StructureTree />
      <Canvas />
      {previewOpen && <PreviewPane />}
      <Inspector />
    </div>
  )
}
