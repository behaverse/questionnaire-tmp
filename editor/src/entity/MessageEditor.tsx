import { ContentTextEditor, type ContentMap } from './ContentTextEditor'

export interface MessageBody { id: string; type: string[]; content: ContentMap; [k: string]: unknown }

export function MessageEditor({ message, locale, primaryLocale, onChange }: { message: MessageBody; locale: string; primaryLocale?: string; onChange: (m: MessageBody) => void }) {
  const setType = (v: string) => onChange({ ...message, type: v.split(',').map((t) => t.trim()).filter(Boolean) })
  return (
    <div className="space-y-2">
      <label className="block text-sm">Type (comma-separated)
        <input aria-label="Type" value={(message.type ?? []).join(', ')} onChange={(e) => setType(e.target.value)}
               className="mt-1 w-full rounded border border-ed-border px-2 py-1" />
      </label>
      <ContentTextEditor content={message.content} locale={locale} label="Message text" primaryLocale={primaryLocale}
                         onChange={(c) => onChange({ ...message, content: c })} />
    </div>
  )
}
