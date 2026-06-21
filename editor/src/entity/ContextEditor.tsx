import { ContentTextEditor, type ContentMap } from './ContentTextEditor'

export interface ContextBody { id: string; content: ContentMap; [k: string]: unknown }

export function ContextEditor({ context, locale, primaryLocale, showStatus = true, onChange }: { context: ContextBody; locale: string; primaryLocale?: string; showStatus?: boolean; onChange: (c: ContextBody) => void }) {
  return <ContentTextEditor content={context.content} locale={locale} label="Context text" primaryLocale={primaryLocale}
                            showStatus={showStatus} onChange={(c) => onChange({ ...context, content: c })} />
}
