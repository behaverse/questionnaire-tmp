import { useEditorStore } from '../state/store'
import { getAtPath, type NodePath } from '../model/path'
import { updateNodeProps } from '../model/tree'
import { OptionEditor } from '../option/OptionEditor'
import type { EditableOption } from '../option/ops'
import { PromptEditor, type PromptBody } from '../entity/PromptEditor'

export function ItemEditor({ path }: { path: NodePath }) {
  const { model, applyEdit, pool, upsertPoolEntity } = useEditorStore()
  if (!model) return null
  const node = getAtPath(model, path) as Record<string, unknown>
  const locale = String(model.metadata.language ?? 'en')

  // shared_option (section) or option (inline item)
  const optionKey = 'shared_option' in node ? 'shared_option' : 'option'
  const option = node[optionKey] as EditableOption | { ref: string } | undefined
  const promptRef = ((node.question as Record<string, unknown> | undefined)?.prompt as { ref?: string } | undefined)?.ref

  const isInlineOption = !!option && typeof option === 'object' && 'input_data_type' in option
  const poolPrompt = promptRef ? (pool[promptRef] as PromptBody | undefined) : undefined

  return (
    <div className="overflow-auto p-6">
      {promptRef && (
        <div className="mb-4">
          <span className="text-xs font-medium uppercase tracking-wide text-slate-400">Question</span>
          {poolPrompt ? (
            <div className="mt-2">
              <PromptEditor prompt={poolPrompt} locale={locale} onChange={(p) => upsertPoolEntity(promptRef, p)} />
            </div>
          ) : (
            <div className="mt-1 flex items-center gap-2 rounded border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
              <span className="text-slate-400">◉</span><span className="font-mono">{promptRef}</span>
              <span className="ml-auto text-xs text-slate-400">fork to edit (ED-C4)</span>
            </div>
          )}
        </div>
      )}
      <span className="text-xs font-medium uppercase tracking-wide text-slate-400">Response (Option)</span>
      {isInlineOption ? (
        <div className="mt-2">
          <OptionEditor option={option as EditableOption} locale={locale}
                        onChange={(o) => applyEdit((m) => updateNodeProps(m, path, { [optionKey]: o }))} />
        </div>
      ) : (
        <div className="mt-2 rounded border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500">
          {option && 'ref' in (option as object) ? `Referenced option ${(option as { ref: string }).ref} — pick/fork in ED-C3/C4.` : 'No editable option.'}
        </div>
      )}
    </div>
  )
}
