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

/** A read-only Library reference: shows the resolved content (greyed) when available, with the
 *  ref id + freshness + Edit beneath. Falls back to just the ref when content isn't resolved. */
function ReadOnlyRef({ refStr, content }: { refStr: string; content: string | null }) {
  return (
    <div className="mt-1 rounded border border-ed-border bg-ed-subtle px-3 py-2 text-sm">
      {content && <div className="text-ed-muted">{content}</div>}
      <div className={`flex flex-wrap items-center gap-2 text-[11px] text-ed-muted ${content ? 'mt-1.5' : ''}`}>
        <span className="font-mono">{refStr}</span>
        <UpgradeBadge refStr={refStr} />
        <ForkButton refStr={refStr} />
      </div>
    </div>
  )
}

export function ItemEditor({ path }: { path: NodePath }) {
  const { model, applyEdit, pool, upsertPoolEntity, removePoolEntity, openPicker } = useEditorStore()
  const resolved = useEditorStore((s) => s.resolved)
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

  // Resolved content (pool draft, else the preview-resolved Library body) for read-only refs.
  const localized = <T,>(c: Record<string, T> | undefined): T | undefined =>
    c ? (c[locale] ?? c[primaryLocale] ?? Object.values(c)[0]) : undefined
  const refText = (ref?: string): string | null => {
    if (!ref) return null
    const body = (pool[ref] ?? resolved[ref]) as { content?: Record<string, { text?: string }> } | null | undefined
    const t = (localized(body?.content)?.text ?? '').trim()
    return t || null
  }
  const optionSummary = (ref?: string): string | null => {
    if (!ref) return null
    const body = (pool[ref] ?? resolved[ref]) as { content?: Record<string, { label?: string; options?: { text?: string }[] }> } | null | undefined
    const loc = localized(body?.content)
    if (!loc) return null
    const opts = (loc.options ?? []).map((o) => o.text).filter(Boolean)
    return opts.length ? opts.join(' · ') : (loc.label ?? null)
  }

  const pickInto = (slotKey: 'prompt' | 'context' | 'instruction', etype: string, onCreate?: () => void) => {
    const prev = (question?.[slotKey] as { ref?: string } | undefined)?.ref
    openPicker(etype, (ref) => {
      applyEdit((m) => updateNodeProps(m, questionPath, { [slotKey]: { ref } }))
      if (prev && pool[prev]) removePoolEntity(prev) // drop the orphaned pool draft we replaced
    }, onCreate)
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
            <ReadOnlyRef refStr={promptRef} content={refText(promptRef)} />
          )}
        </div>
      )}
      {question && (
        <div className="mb-4 space-y-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-ed-muted">Context</span>
              {!ctxRef && <button aria-label="Add context" onClick={() => pickInto('context', 'context', addContext)} className="rounded border border-ed-border px-1.5 py-0.5 text-xs hover:bg-ed-subtle">+ Add</button>}
              {ctxRef && poolCtx && <button aria-label="Remove context" onClick={removeContext} className="rounded border border-ed-border px-1.5 py-0.5 text-xs hover:bg-ed-subtle">Remove</button>}
            </div>
            {ctxRef && (poolCtx
              ? <div className="mt-1"><ContextEditor context={poolCtx} locale={locale} primaryLocale={primaryLocale} onChange={(c) => upsertPoolEntity(ctxRef, c)} /></div>
              : <ReadOnlyRef refStr={ctxRef} content={refText(ctxRef)} />)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-ed-muted">Instruction</span>
              {!insRef && <button aria-label="Add instruction" onClick={() => pickInto('instruction', 'instruction', addInstruction)} className="rounded border border-ed-border px-1.5 py-0.5 text-xs hover:bg-ed-subtle">+ Add</button>}
              {insRef && poolIns && <button aria-label="Remove instruction" onClick={removeInstruction} className="rounded border border-ed-border px-1.5 py-0.5 text-xs hover:bg-ed-subtle">Remove</button>}
            </div>
            {insRef && (poolIns
              ? <div className="mt-1"><InstructionEditor instruction={poolIns} locale={locale} primaryLocale={primaryLocale} onChange={(i) => upsertPoolEntity(insRef, i)} /></div>
              : <ReadOnlyRef refStr={insRef} content={refText(insRef)} />)}
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
      ) : option && 'ref' in (option as object) ? (
        <ReadOnlyRef refStr={(option as { ref: string }).ref} content={optionSummary((option as { ref: string }).ref)} />
      ) : (
        <div className="mt-2 rounded border border-ed-border bg-ed-subtle px-3 py-2 text-sm text-ed-muted">No editable option.</div>
      )}
    </div>
  )
}
