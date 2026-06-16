import { useEffect, useMemo, useRef, useState } from 'react'
import { useEditorStore } from '../state/store'
import { resolveEntities, type FetchEntity } from './resolver'
import { makePoolFetcher } from '../pool/poolFetcher'
import { projectForPreview } from './project'
import type { EntityBody } from './resolve'
import { PreviewView } from './PreviewView'
import type { LogicRule, CrossQuestionValidationRule } from '../model/types'

const defaultPoolFetcher: FetchEntity = makePoolFetcher(() => useEditorStore.getState().pool)

export function PreviewPane({ fetchEntity = defaultPoolFetcher }: { fetchEntity?: FetchEntity }) {
  const { model, selection } = useEditorStore()
  const pool = useEditorStore((s) => s.pool)
  const [entityMap, setEntityMap] = useState<Map<string, EntityBody | null>>(new Map())
  const [resolving, setResolving] = useState(false)
  const cacheRef = useRef(new Map<string, EntityBody | null>())
  const prevPoolKeysRef = useRef<string[]>([])

  useEffect(() => {
    if (!model) return
    let ignore = false
    setResolving(true)
    const t = setTimeout(() => {
      const poolKeys = Object.keys(pool)
      for (const ref of new Set([...prevPoolKeysRef.current, ...poolKeys])) cacheRef.current.delete(ref) // pool entities re-resolve fresh; departed refs invalidated too
      prevPoolKeysRef.current = poolKeys
      resolveEntities(model, fetchEntity, cacheRef.current).then((m) => {
        if (ignore) return
        setEntityMap(new Map(m))
        setResolving(false)
      })
    }, 300)
    return () => { ignore = true; clearTimeout(t) }
  }, [model, pool, fetchEntity])

  const { runtime, problems } = useMemo(() => {
    if (!model) return { runtime: null, problems: [] }
    return projectForPreview(model, (ref) => entityMap.get(ref) ?? null)
  }, [model, entityMap])

  if (!model || !runtime) return <div className="p-6 text-slate-400">Nothing to preview.</div>
  const selectedPageId = (() => {
    if (selection && selection[0] === 'pages' && typeof selection[1] === 'number') return runtime.pages[selection[1] as number]?.id
    return runtime.pages[0]?.id
  })()
  return (
    <div className="flex h-full flex-col border-l border-slate-200">
      {resolving && <div className="bg-white px-3 py-1 text-xs text-slate-400">resolving…</div>}
      <PreviewView runtime={runtime} problems={problems}
        logic={(model.logic ?? []) as LogicRule[]} validation={(model.validation ?? []) as CrossQuestionValidationRule[]}
        initialLocale={String(model.metadata.language ?? 'en')} initialScope="page" selectedPageId={selectedPageId} compact />
    </div>
  )
}
