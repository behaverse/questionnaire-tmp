import { useEffect, useMemo, useRef, useState } from 'react'
import { StepRenderer, type RendererStrings, type AnswerValue } from '@behaverse/questionnaire-renderer'
import '@behaverse/questionnaire-renderer/style.css'
import { useEditorStore } from '../state/store'
import { resolveEntities, type FetchEntity } from './resolver'
import { makePoolFetcher } from '../pool/poolFetcher'
import { projectForPreview } from './project'
import { flattenPage } from './flatten'
import { FRAMES, FRAME_LABELS, type FrameKey } from './frames'
import type { EntityBody } from './resolve'
import { useEvaluator } from '../logic/useEvaluator'
import { makeBindings, filterPageVisible } from '../logic/visibility'
import { applyPiping } from '../logic/piping'
import { collectPerQuestionErrors } from '../logic/validation'

const STRINGS: RendererStrings = { required: 'Required', unsupported: 'Unsupported element' }

const defaultPoolFetcher: FetchEntity = makePoolFetcher(() => useEditorStore.getState().pool)

export function PreviewPane({ fetchEntity = defaultPoolFetcher }: { fetchEntity?: FetchEntity }) {
  const { model, selection } = useEditorStore()
  const pool = useEditorStore((s) => s.pool)
  const [entityMap, setEntityMap] = useState<Map<string, EntityBody | null>>(new Map())
  const [resolving, setResolving] = useState(false)
  const [locale, setLocale] = useState<string>('en')
  const [device, setDevice] = useState<FrameKey>('desktop')
  const [scope, setScope] = useState<'page' | 'all'>('page')
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({})
  const evaluator = useEvaluator()
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

  useEffect(() => { if (model?.metadata.language) setLocale(String(model.metadata.language)) }, [model?.metadata.language])

  const { runtime, problems } = useMemo(() => {
    if (!model) return { runtime: null, problems: [] }
    return projectForPreview(model, (ref) => entityMap.get(ref) ?? null)
  }, [model, entityMap])

  if (!model || !runtime) return <div className="p-6 text-slate-400">Nothing to preview.</div>

  const locales = runtime.available_locales ?? [runtime.metadata.language]
  const selectedPageId = (() => {
    if (selection && selection[0] === 'pages' && typeof selection[1] === 'number') return runtime.pages[selection[1] as number]?.id
    return runtime.pages[0]?.id
  })()
  const pages = scope === 'all' ? runtime.pages : runtime.pages.filter((p) => p.id === selectedPageId)
  const bindings = makeBindings(answers as Record<string, unknown>, { score: () => null })
  const pipedPages = evaluator ? pages.map((p) => applyPiping(p, model.logic ?? [], evaluator, bindings, locale)) : pages
  const visiblePages = evaluator ? pipedPages.map((p) => filterPageVisible(p, evaluator, bindings, model.logic ?? [])) : pipedPages
  const verrors = collectPerQuestionErrors(visiblePages, answers)
  const errorMessages = Object.fromEntries(verrors.map((e) => [e.key, e.message]))
  const requiredErrorKeys = verrors.map((e) => e.key)
  const width = FRAMES[device]
  const onAnswer = (key: string, value: AnswerValue) => setAnswers((a) => ({ ...a, [key]: value }))

  return (
    <section aria-label="Preview" className="flex h-full flex-col overflow-hidden border-l border-slate-200">
      <div className="flex items-center gap-3 border-b border-slate-200 bg-white px-3 py-2 text-sm">
        <label className="flex items-center gap-1">Language
          <select aria-label="Preview language" value={locale} onChange={(e) => setLocale(e.target.value)}
                  className="rounded border border-slate-300 px-1 py-0.5">
            {locales.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
        </label>
        <label className="flex items-center gap-1">Device
          <select aria-label="Preview device" value={device} onChange={(e) => setDevice(e.target.value as FrameKey)}
                  className="rounded border border-slate-300 px-1 py-0.5">
            {(Object.keys(FRAMES) as FrameKey[]).map((k) => <option key={k} value={k}>{FRAME_LABELS[k]}</option>)}
          </select>
        </label>
        <label className="flex items-center gap-1">Scope
          <select aria-label="Preview scope" value={scope} onChange={(e) => setScope(e.target.value as 'page' | 'all')}
                  className="rounded border border-slate-300 px-1 py-0.5">
            <option value="page">Selected page</option>
            <option value="all">Whole questionnaire</option>
          </select>
        </label>
        {resolving && <span className="text-xs text-slate-400">resolving…</span>}
      </div>
      {problems.length > 0 && (
        <div className="border-b border-amber-200 bg-amber-50 px-3 py-1 text-xs text-amber-700">
          {problems.length} referenced {problems.length === 1 ? 'entity' : 'entities'} not loaded (showing placeholders).
        </div>
      )}
      <div className="flex-1 overflow-auto bg-slate-100 p-6">
        <div className="qv-theme mx-auto bg-white shadow-sm" style={{ width: width ?? '100%', maxWidth: '100%' }}>
          <div className="p-6">
            {visiblePages.map((page) => (
              <div key={page.id} className="mb-8">
                {scope === 'all' && page.title && <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">{page.title}</h2>}
                <StepRenderer elements={flattenPage(page)} locale={locale} answers={answers} onAnswer={onAnswer}
                              requiredErrors={requiredErrorKeys} errorMessages={errorMessages} strings={STRINGS} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
