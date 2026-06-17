import { useEditorStore } from '../state/store'
import { getAtPath, type NodePath } from '../model/path'
import { MessageEditor, type MessageBody } from '../entity/MessageEditor'
import { UpgradeBadge } from '../library/UpgradeBadge'
import { ForkButton } from '../library/ForkButton'

export function MessagePane({ path }: { path: NodePath }) {
  const { model, pool, upsertPoolEntity } = useEditorStore()
  const editingLocale = useEditorStore((s) => s.editingLocale)
  if (!model) return null
  const ref = (getAtPath(model, path) as { ref?: string } | undefined)?.ref
  const message = ref ? (pool[ref] as MessageBody | undefined) : undefined
  const locale = editingLocale ?? String(model.metadata.language ?? 'en')
  return (
    <div className="overflow-auto p-6">
      <span className="text-xs font-medium text-ed-muted">Message</span>
      {ref && message ? (
        <div className="mt-2"><MessageEditor message={message} locale={locale} onChange={(m) => upsertPoolEntity(ref, m)} /></div>
      ) : (
        <div className="mt-2 rounded border border-ed-border bg-ed-subtle px-3 py-2 text-sm">
          <span className="font-mono">{ref}</span> {ref && <UpgradeBadge refStr={ref} />} {ref && <ForkButton refStr={ref} />}
        </div>
      )}
    </div>
  )
}
