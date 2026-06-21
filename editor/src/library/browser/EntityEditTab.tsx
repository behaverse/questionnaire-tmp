import { PromptEditor, type PromptBody } from '../../entity/PromptEditor'
import { ContextEditor, type ContextBody } from '../../entity/ContextEditor'
import { InstructionEditor, type InstructionBody } from '../../entity/InstructionEditor'
import { MessageEditor, type MessageBody } from '../../entity/MessageEditor'
import { OptionEditor } from '../../option/OptionEditor'
import type { EditableOption } from '../../option/ops'

type Body = Record<string, unknown>

export function EntityEditTab({ type, body, locale, primaryLocale, editable, onChange }: {
  type: string
  body: Body
  locale: string
  primaryLocale?: string
  editable: boolean
  onChange: (next: Body) => void
}) {
  const change = (next: unknown) => onChange(next as Body)
  let editor: React.ReactNode
  switch (type) {
    case 'prompt':
      editor = <PromptEditor prompt={body as unknown as PromptBody} locale={locale} primaryLocale={primaryLocale} showStatus={false} onChange={change} />; break
    case 'option':
      editor = <OptionEditor option={body as unknown as EditableOption} locale={locale} showStatus={false} onChange={change} />; break
    case 'context':
      editor = <ContextEditor context={body as unknown as ContextBody} locale={locale} primaryLocale={primaryLocale} showStatus={false} onChange={change} />; break
    case 'instruction':
      editor = <InstructionEditor instruction={body as unknown as InstructionBody} locale={locale} primaryLocale={primaryLocale} showStatus={false} onChange={change} />; break
    case 'message':
      editor = <MessageEditor message={body as unknown as MessageBody} locale={locale} primaryLocale={primaryLocale} showStatus={false} onChange={change} />; break
    default:
      return <div className="rounded-md bg-ed-subtle px-3 py-2 text-sm text-ed-muted">Editing not supported yet for <span className="font-mono">{type}</span> — inspect (and, soon, translate) only.</div>
  }
  // disabled fieldset locks every descendant control when not editable (lock-on-complete)
  return <fieldset disabled={!editable} className="m-0 min-w-0 border-0 p-0">{editor}</fieldset>
}
