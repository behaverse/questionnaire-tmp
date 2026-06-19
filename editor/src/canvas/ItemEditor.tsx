import { useEditorStore } from '../state/store'
import { getAtPath, type NodePath } from '../model/path'
import { updateNodeProps, unsetNodeProp } from '../model/tree'
import { OptionEditor } from '../option/OptionEditor'
import type { EditableOption } from '../option/ops'
import { PromptEditor, type PromptBody } from '../entity/PromptEditor'
import { ContextEditor, type ContextBody } from '../entity/ContextEditor'
import { InstructionEditor, type InstructionBody } from '../entity/InstructionEditor'
import { buildContext, buildInstruction } from '../pool/newEntities'
import { collectIds, draftVersion } from '../pool/mint'
import { UpgradeBadge } from '../library/UpgradeBadge'
import { ForkButton } from '../library/ForkButton'

export function ItemEditor({ path }: { path: NodePath }) {
  const { model, applyEdit, pool, upsertPoolEntity, removePoolEntity, openPicker } = useEditorStore()
  const editingLocale = useEditorStore((s) => s.editingLocale)
  if (!model) return null
  const node = getAtPath(model, path) as Record<string, unknown>
  const locale = editingLocale ?? String(model.metadata.language ?? 'en')
  const primaryLocale = String(model.metadata.language ?? 'en')

  // shared_option (section) or option (inline item)
  const optionKey = 'shared_option' in node ? 'shared_option' : 'option'
  const option = node[optionKey] as EditableOption | { ref: string } | undefined
  const promptRef = ((node.question as Record<string, unknown> | undefined)?.prompt as { ref?: string } | undefined)?.ref

  const isInlineOption = !!option && typeof option === 'object' && 'input_data_type' in option
  const poolPrompt = promptRef ? (pool[promptRef] as PromptBody | undefined) : undefined

  const question = node.question as Record<string, unknown> | undefined
  const questionPath = [...path, 'question']
  const ids = () => collectIds(model, pool)
  const dv = () => draftVersion(model.metadata.version as string | undefined)

  const ctxRef = (question?.context as { ref?: string } | undefined)?.ref
  const insRef = (question?.instruction as { ref?: string } | undefined)?.ref
  const poolCtx = ctxRef ? (pool[ctxRef] as ContextBody | undefined) : undefined
  const poolIns = insRef ? (pool[insRef] as InstructionBody | undefined) : undefined

  const pickInto = (slotKey: 'prompt' | 'context' | 'instruction', etype: string) => {
    const prev = (question?.[slotKey] as { ref?: string } | undefined)?.ref
    openPicker(etype, (ref) => {
      applyEdit((m) => updateNodeProps(m, questionPath, { [slotKey]: { ref } }))
      if (prev && pool[prev]) removePoolEntity(prev) // drop the orphaned pool draft we replaced
    })
  }
  const pickOption = () => {
    const prev = typeof option === 'object' && option && 'ref' in option ? (option as { ref: string }).ref : undefined
    openPicker('option', (ref) => {
      applyEdit((m) => updateNodeProps(m, path, { [optionKey]: { ref } }))
      if (prev && pool[prev]) removePoolEntity(prev)
    })
  }

  const addContext = () => { const { ref, body } = buildContext(ids(), dv(), locale); upsertPoolEntity(ref, body); applyEdit((m) => updateNodeProps(m, questionPath, { context: { ref } })) }
  const removeContext = () => { applyEdit((m) => unsetNodeProp(m, questionPath, 'context')); if (ctxRef) removePoolEntity(ctxRef) }
  const addInstruction = () => { const { ref, body } = buildInstruction(ids(), dv(), locale); upsertPoolEntity(ref, body); applyEdit((m) => updateNodeProps(m, questionPath, { instruction: { ref } })) }
  const removeInstruction = () => { applyEdit((m) => unsetNodeProp(m, questionPath, 'instruction')); if (insRef) removePoolEntity(insRef) }

  return (
    <div className="overflow-auto p-6">
      {promptRef && (
        <div className="mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-ed-muted">Question</span>
            <button aria-label="Pick prompt" onClick={() => pickInto('prompt', 'prompt')} className="rounded border border-ed-border px-1.5 py-0.5 text-xs hover:bg-ed-subtle">Pick</button>
          </div>
          {poolPrompt ? (
            <div className="mt-2">
              <PromptEditor prompt={poolPrompt} locale={locale} primaryLocale={primaryLocale} onChange={(p) => upsertPoolEntity(promptRef, p)} />
            </div>
          ) : (
            <div className="mt-1 flex items-center gap-2 rounded border border-ed-border bg-ed-subtle px-3 py-2 text-sm">
              <span className="text-ed-muted">◉</span><span className="font-mono">{promptRef}</span>
              <UpgradeBadge refStr={promptRef} />
              <span className="ml-auto"><ForkButton refStr={promptRef} /></span>
            </div>
          )}
        </div>
      )}
      {question && (
        <div className="mb-4 space-y-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-ed-muted">Context</span>
              {!ctxRef && <button aria-label="Add context" onClick={addContext} className="rounded border border-ed-border px-1.5 py-0.5 text-xs hover:bg-ed-subtle">+ Add</button>}
              {!ctxRef && <button aria-label="Pick context" onClick={() => pickInto('context', 'context')} className="rounded border border-ed-border px-1.5 py-0.5 text-xs hover:bg-ed-subtle">Pick</button>}
              {ctxRef && poolCtx && <button aria-label="Remove context" onClick={removeContext} className="rounded border border-ed-border px-1.5 py-0.5 text-xs hover:bg-ed-subtle">Remove</button>}
            </div>
            {ctxRef && (poolCtx
              ? <div className="mt-1"><ContextEditor context={poolCtx} locale={locale} primaryLocale={primaryLocale} onChange={(c) => upsertPoolEntity(ctxRef, c)} /></div>
              : <div className="mt-1 rounded border border-ed-border bg-ed-subtle px-3 py-2 text-sm"><span className="font-mono">{ctxRef}</span> <UpgradeBadge refStr={ctxRef} /> <ForkButton refStr={ctxRef} /></div>)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-ed-muted">Instruction</span>
              {!insRef && <button aria-label="Add instruction" onClick={addInstruction} className="rounded border border-ed-border px-1.5 py-0.5 text-xs hover:bg-ed-subtle">+ Add</button>}
              {!insRef && <button aria-label="Pick instruction" onClick={() => pickInto('instruction', 'instruction')} className="rounded border border-ed-border px-1.5 py-0.5 text-xs hover:bg-ed-subtle">Pick</button>}
              {insRef && poolIns && <button aria-label="Remove instruction" onClick={removeInstruction} className="rounded border border-ed-border px-1.5 py-0.5 text-xs hover:bg-ed-subtle">Remove</button>}
            </div>
            {insRef && (poolIns
              ? <div className="mt-1"><InstructionEditor instruction={poolIns} locale={locale} primaryLocale={primaryLocale} onChange={(i) => upsertPoolEntity(insRef, i)} /></div>
              : <div className="mt-1 rounded border border-ed-border bg-ed-subtle px-3 py-2 text-sm"><span className="font-mono">{insRef}</span> <UpgradeBadge refStr={insRef} /> <ForkButton refStr={insRef} /></div>)}
          </div>
        </div>
      )}
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-ed-muted">Option (Response)</span>
        {question && <button aria-label="Pick option" onClick={pickOption} className="rounded border border-ed-border px-1.5 py-0.5 text-xs hover:bg-ed-subtle">Pick</button>}
      </div>
      {isInlineOption ? (
        <div className="mt-2">
          <OptionEditor option={option as EditableOption} locale={locale}
                        onChange={(o) => applyEdit((m) => updateNodeProps(m, path, { [optionKey]: o }))} />
        </div>
      ) : (
        <div className="mt-2 rounded border border-ed-border bg-ed-subtle px-3 py-2 text-sm text-ed-muted">
          {option && 'ref' in (option as object) ? (
            <><span className="font-mono">{(option as { ref: string }).ref}</span> <UpgradeBadge refStr={(option as { ref: string }).ref} /> <ForkButton refStr={(option as { ref: string }).ref} /></>
          ) : 'No editable option.'}
        </div>
      )}
    </div>
  )
}
