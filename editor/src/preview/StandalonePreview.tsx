import { useEffect, useMemo, useState } from 'react'
import { parseBundle, readFileText } from '../persistence/file'
import { resolveEntities } from './resolver'
import { makePoolFetcher } from '../pool/poolFetcher'
import { projectForPreview } from './project'
import { PreviewView } from './PreviewView'
import type { Questionnaire, EntityBody, LogicRule, CrossQuestionValidationRule } from '../model/types'

type Bundle = { questionnaire: Questionnaire; entities: Record<string, EntityBody> }
const KEY = 'qv-preview-bundle'

export function StandalonePreview() {
  const [bundle, setBundle] = useState<Bundle | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [entityMap, setEntityMap] = useState<Map<string, EntityBody | null> | null>(null)

  useEffect(() => {
    const raw = sessionStorage.getItem(KEY)
    if (!raw) return
    try { setBundle(parseBundle(raw)) } catch (e) { setError(e instanceof Error ? e.message : 'Bad bundle') }
  }, [])

  useEffect(() => {
    if (!bundle) { setEntityMap(null); return }
    let ignore = false
    // Pool = the bundle's entities; no Library network in the standalone (lib resolves to null).
    const fetcher = makePoolFetcher(() => bundle.entities, async () => null)
    resolveEntities(bundle.questionnaire, fetcher).then((m) => { if (!ignore) setEntityMap(new Map(m)) })
    return () => { ignore = true }
  }, [bundle])

  const projected = useMemo(() => {
    if (!bundle || !entityMap) return null
    return projectForPreview(bundle.questionnaire, (ref) => entityMap.get(ref) ?? null)
  }, [bundle, entityMap])

  const onFile = async (file: File) => {
    setError(null)
    try { setBundle(parseBundle(await readFileText(file))) } catch (e) { setError(e instanceof Error ? e.message : 'Bad bundle'); setBundle(null) }
  }

  if (!bundle) {
    return (
      <div className="mx-auto max-w-md space-y-3 p-8 text-sm text-slate-600">
        <h1 className="text-base font-semibold text-slate-800">Questionnaire preview</h1>
        <p className="text-slate-500">Open a <code>.bundle.json</code> exported from the editor.</p>
        <label className="block">Load a bundle
          <input type="file" accept="application/json,.json" aria-label="Load a bundle"
                 onChange={(e) => { const f = e.target.files?.[0]; if (f) void onFile(f) }}
                 className="mt-1 block w-full text-sm" />
        </label>
        {error && <p className="text-red-600">{error}</p>}
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col">
      <header className="flex items-center gap-2 border-b border-slate-200 bg-white px-4 py-2 text-sm">
        <span className="font-medium text-slate-800">{String(bundle.questionnaire.metadata.title ?? bundle.questionnaire.metadata.id)}</span>
        <span className="text-xs text-slate-400">read-only preview — not a deployment</span>
      </header>
      {!projected ? (
        <div className="p-6 text-slate-400">Resolving…</div>
      ) : (
        <PreviewView runtime={projected.runtime} problems={projected.problems}
          logic={(bundle.questionnaire.logic ?? []) as LogicRule[]}
          validation={(bundle.questionnaire.validation ?? []) as CrossQuestionValidationRule[]} />
      )}
    </div>
  )
}
