import { ContentTextEditor, type ContentMap } from './ContentTextEditor'

export interface InstructionBody { id: string; dimension?: string; content: ContentMap; [k: string]: unknown }

export function InstructionEditor({ instruction, locale, onChange }: { instruction: InstructionBody; locale: string; onChange: (i: InstructionBody) => void }) {
  const setDim = (v: string) => { const next = { ...instruction }; if (v) next.dimension = v; else delete next.dimension; onChange(next) }
  return (
    <div className="space-y-2">
      <ContentTextEditor content={instruction.content} locale={locale} label="Instruction text"
                         onChange={(c) => onChange({ ...instruction, content: c })} />
      <label className="block text-sm">Dimension
        <input aria-label="Dimension" value={instruction.dimension ?? ''} onChange={(e) => setDim(e.target.value)}
               className="ml-1 rounded border border-slate-300 px-1 py-0.5" />
      </label>
    </div>
  )
}
