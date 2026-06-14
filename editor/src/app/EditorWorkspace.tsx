import { StructureTree } from '../tree/StructureTree'
import { Canvas } from '../canvas/Canvas'
import { Inspector } from '../inspector/Inspector'

export function EditorWorkspace() {
  return (
    <div className="grid flex-1 grid-cols-[260px_1fr_320px] overflow-hidden">
      <StructureTree />
      <Canvas />
      <Inspector />
    </div>
  )
}
