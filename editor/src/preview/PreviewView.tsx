import { useEffect, useRef, useState } from 'react'
import { StepRenderer, type RendererStrings, type AnswerValue } from '@behaverse/questionnaire-renderer'
import '@behaverse/questionnaire-renderer/style.css'
import type { Runtime } from '@behaverse/questionnaire-renderer'
import { flattenPage } from './flatten'
import { FRAMES, FRAME_LABELS, type FrameKey } from './frames'
import type { RefProblem } from './resolve'
import { useEvaluator } from '../logic/useEvaluator'
import { makeBindings, filterPageVisible } from '../logic/visibility'
import { applyPiping } from '../logic/piping'
import { collectPerQuestionErrors, collectCrossQuestionErrors } from '../logic/validation'
import type { LogicRule, CrossQuestionValidationRule } from '../model/types'
import { useScoreCache } from './useScoreCache'
import { useEditorStore } from '../state/store'
import { isKnownScorer } from '../logic/scorers/registry'
import type { EvalValue } from '../logic/types'

const STRINGS: RendererStrings = { required: 'Required', unsupported: 'Unsupported element' }

export function PreviewView({ runtime, problems, logic, validation, initialLocale, initialScope = 'all', selectedPageId, selectedElementIndex, compact = false }: {
  runtime: Runtime
  problems: RefProblem[]
  logic: LogicRule[]
  validation: CrossQuestionValidationRule[]
  initialLocale?: string
  initialScope?: 'page' | 'all'
  selectedPageId?: string
  /** Top-level element index (within the shown page) to scroll into view — driven by
   *  the editor's structure-tree selection. Only honored in 'page' scope. */
  selectedElementIndex?: number
  /** In-editor inline pane: scale the focus-mode content down + separate stacked items.
   *  The standalone full-page preview leaves this off for WYSIWYG fidelity. */
  compact?: boolean
}) {
  const [locale, setLocale] = useState<string>(initialLocale ?? String(runtime.metadata.language ?? 'en'))
  const [device, setDevice] = useState<FrameKey>('desktop')
  const [scope, setScope] = useState<'page' | 'all'>(initialScope)
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({})
  const evaluator = useEvaluator()
  const cache = useScoreCache(runtime)
  const setPreviewScores = useEditorStore((s) => s.setPreviewScores)
  const model = useEditorStore((s) => s.model)

  // refresh BEFORE bindings so score() is current in this render
  if (cache && evaluator) cache.refresh(answers as Record<string, never>, evaluator)
  const scoreResolver = cache?.resolver ?? { score: () => null }

  // publish computed scores + unavailable list to the store
  useEffect(() => {
    // Derive unavailable from the authored model's scores (not the projected runtime),
    // because the preview projection drops unknown scorers from runtime.scores.
    const unavailable = [...new Set(((model?.scores ?? []) as { scorer: string }[])
      .map((s) => s.scorer).filter((ref) => !isKnownScorer(ref)))]
    if (!cache || !evaluator) {
      if (unavailable.length > 0) {
        setPreviewScores({ values: {}, unavailable })
      }
      return
    }
    const values: Record<string, EvalValue> = {}
    for (const s of runtime.scores ?? []) values[s.id] = cache.resolver.score(s.id)
    setPreviewScores({ values, unavailable })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cache, answers, evaluator, model])

  // clear on unmount
  useEffect(() => () => setPreviewScores(null), [setPreviewScores])

  const locales = runtime.available_locales ?? [runtime.metadata.language]
  const pageId = selectedPageId ?? runtime.pages[0]?.id
  const pages = scope === 'all' ? runtime.pages : runtime.pages.filter((p) => p.id === pageId)
  const bindings = makeBindings(answers as Record<string, unknown>, scoreResolver)
  const pipedPages = evaluator ? pages.map((p) => applyPiping(p, logic, evaluator, bindings, locale)) : pages
  const visiblePages = evaluator ? pipedPages.map((p) => filterPageVisible(p, evaluator, bindings, logic)) : pipedPages
  const verrors = collectPerQuestionErrors(visiblePages, answers)
  const cqErrors = evaluator ? collectCrossQuestionErrors(validation, evaluator, bindings) : []
  const allErrors = [...verrors, ...cqErrors]
  const errorMessages = Object.fromEntries(allErrors.map((e) => [e.key, e.message]))
  const requiredErrorKeys = allErrors.map((e) => e.key)
  const width = FRAMES[device]
  const onAnswer = (key: string, value: AnswerValue) => setAnswers((a) => ({ ...a, [key]: value }))

  // Scroll the selected structure-tree element into view — WITHIN the preview's own scroll
  // container only. (el.scrollIntoView() would also scroll ancestor/window scroll ranges,
  // which under the root's overflow:hidden quirk pushes the whole app — incl. the topbar —
  // off-screen. Scrolling the container directly never touches the window.)
  const scrollRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (scope !== 'page' || selectedElementIndex == null) return
    const el = scrollRef.current?.querySelectorAll<HTMLElement>('.space-y-10 > *')[selectedElementIndex]
    if (!el) return
    // Native scrollIntoView is zoom-aware (handles the qv-theme zoom correctly), but it also
    // scrolls ancestor scroll ranges — incl. the document root, which under overflow:hidden has
    // a phantom range and would push the topbar off-screen. So undo any window scroll afterwards.
    el.scrollIntoView({ block: 'start' })
    if (window.scrollY !== 0 || document.documentElement.scrollTop !== 0) window.scrollTo(0, 0)
    el.animate([{ backgroundColor: 'rgba(99,102,241,0.12)' }, { backgroundColor: 'transparent' }], { duration: 900 })
  }, [selectedElementIndex, scope, pageId])

  return (
    <section aria-label="Preview" className="flex h-full flex-col overflow-hidden">
      <div className="flex flex-wrap items-center gap-3 border-b border-ed-border bg-ed-panel px-3 py-2 text-sm">
        <span className="font-semibold text-ed-text">Preview</span>
        <label className="flex items-center gap-1">Language
          <select aria-label="Preview language" value={locale} onChange={(e) => setLocale(e.target.value)}
                  className="rounded border border-ed-border-strong px-1 py-0.5">
            {locales.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
        </label>
        <label className="flex items-center gap-1">Device
          <select aria-label="Preview device" value={device} onChange={(e) => setDevice(e.target.value as FrameKey)}
                  className="rounded border border-ed-border-strong px-1 py-0.5">
            {(Object.keys(FRAMES) as FrameKey[]).map((k) => <option key={k} value={k}>{FRAME_LABELS[k]}</option>)}
          </select>
        </label>
        <label className="flex items-center gap-1">Scope
          <select aria-label="Preview scope" value={scope} onChange={(e) => setScope(e.target.value as 'page' | 'all')}
                  className="rounded border border-ed-border-strong px-1 py-0.5">
            <option value="page">Selected page</option>
            <option value="all">Whole questionnaire</option>
          </select>
        </label>
      </div>
      {problems.length > 0 && (
        <div className="border-b border-amber-200 bg-amber-50 px-3 py-1 text-xs text-amber-700">
          {problems.length} referenced {problems.length === 1 ? 'entity' : 'entities'} not loaded (showing placeholders).
        </div>
      )}
      <div ref={scrollRef} className="flex-1 overflow-auto bg-ed-subtle p-6" style={{ scrollPaddingTop: '1.5rem' }}>
        <div className={`qv-theme mx-auto bg-white shadow-sm ${compact ? 'qv-compact' : ''}`}
             style={{ width: width ?? '100%', maxWidth: '100%', ...(compact ? { zoom: 0.6 } : {}) }}>
          <div className="p-6 pb-32">
            {visiblePages.map((page) => (
              <div key={page.id} className="mb-8">
                {scope === 'all' && page.title && <h2 className="mb-4 text-sm font-semibold text-ed-muted">{page.title}</h2>}
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
