import { ContentTextEditor, type ContentMap } from './ContentTextEditor'

export interface ContextBody { id: string; content: ContentMap; [k: string]: unknown }

export function ContextEditor({ context, locale, onChange }: { context: ContextBody; locale: string; onChange: (c: ContextBody) => void }) {
  return <ContentTextEditor content={context.content} locale={locale} label="Context text"
                            onChange={(c) => onChange({ ...context, content: c })} />
}
