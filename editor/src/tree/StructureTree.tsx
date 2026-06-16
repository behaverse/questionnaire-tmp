import { DndContext, closestCenter, type DragEndEvent, PointerSensor, KeyboardSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy, sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useEditorStore } from '../state/store'
import { buildTreeRows, type TreeRow } from './treeModel'
import { reorder, createBlock } from '../model/tree'
import { pathKey } from '../model/path'
import type { Questionnaire } from '../model/types'

function nextBlockId(model: Questionnaire): string {
  const used = new Set<string>()
  JSON.stringify(model, (k, v) => { if (k === 'id' && typeof v === 'string') used.add(v); return v })
  let n = 1
  while (used.has(`blk_${n}`)) n++
  return `blk_${n}`
}

function Row({ row }: { row: TreeRow }) {
  const { selection, select } = useEditorStore()
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: row.key })
  const selected = selection && pathKey(selection) === row.key
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, paddingLeft: 8 + row.depth * 16 }}
      className={`flex cursor-pointer items-center gap-1 rounded px-2 py-1 text-sm ${selected ? 'bg-slate-200' : 'hover:bg-slate-100'}`}
      onClick={() => select(row.path)}
      {...attributes}
      {...listeners}
    >
      <span className="text-slate-400">{row.kind === 'block' ? '▣' : row.kind === 'page' ? '▤' : row.kind === 'section' ? '▦' : row.kind === 'message' ? '✉' : '◉'}</span>
      <span className="truncate">{row.label}</span>
    </div>
  )
}

export function StructureTree() {
  const { model, applyEdit, selection, select } = useEditorStore()
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )
  if (!model) return null
  const rows = buildTreeRows(model)

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e
    if (!over || active.id === over.id) return
    const from = rows.find((r) => r.key === active.id)
    const to = rows.find((r) => r.key === over.id)
    if (!from || !to) return
    const fromParent = pathKey(from.path.slice(0, -1))
    const toParent = pathKey(to.path.slice(0, -1))
    if (fromParent !== toParent) return
    const fromIdx = Number(from.path[from.path.length - 1])
    const toIdx = Number(to.path[to.path.length - 1])
    applyEdit((m) => reorder(m, from.path.slice(0, -1), fromIdx, toIdx))
  }

  return (
    <nav aria-label="Structure" className="h-full overflow-auto border-r border-slate-200 bg-slate-50 py-2">
      <div className="flex items-center justify-between px-2 pb-1">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Structure</span>
        <button
          onClick={() => { const id = nextBlockId(model!); applyEdit((m) => createBlock(m, { id, title: 'New block', page_ids: [] })) }}
          className="rounded border border-slate-300 px-1.5 py-0.5 text-xs hover:bg-slate-100"
        >+ Block</button>
      </div>
      <button
        onClick={() => select(null)}
        aria-label="Questionnaire settings"
        className={`flex w-full cursor-pointer items-center gap-1 px-2 py-1 text-left text-sm ${selection === null ? 'bg-slate-200 font-medium' : 'hover:bg-slate-100'}`}
      >
        <span className="text-slate-400">≡</span>
        <span className="truncate">{model.metadata.title ?? model.metadata.id}</span>
      </button>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={rows.map((r) => r.key)} strategy={verticalListSortingStrategy}>
          {rows.map((row) => <Row key={row.key} row={row} />)}
        </SortableContext>
      </DndContext>
    </nav>
  )
}
