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

  const locales = runtime.available_locales ?? [runtime.metadata.language]
  const pageId = selectedPageId ?? runtime.pages[0]?.id
  const pages = scope === 'all' ? runtime.pages : runtime.pages.filter((p) => p.id === pageId)
  const bindings = makeBindings(answers as Record<string, unknown>, { score: () => null })
  const pipedPages = evaluator ? pages.map((p) => applyPiping(p, logic, evaluator, bindings, locale)) : pages
  const visiblePages = evaluator ? pipedPages.map((p) => filterPageVisible(p, evaluator, bindings, logic)) : pipedPages
  const verrors = collectPerQuestionErrors(visiblePages, answers)
  const cqErrors = evaluator ? collectCrossQuestionErrors(validation, evaluator, bindings) : []
  const allErrors = [...verrors, ...cqErrors]
  const errorMessages = Object.fromEntries(allErrors.map((e) => [e.key, e.message]))
  const requiredErrorKeys = allErrors.map((e) => e.key)
  const width = FRAMES[device]
  const onAnswer = (key: string, value: AnswerValue) => setAnswers((a) => ({ ...a, [key]: value }))

  // Scroll the selected structure-tree element into view in the preview (page scope only).
  const scrollRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (scope !== 'page' || selectedElementIndex == null) return
    const items = scrollRef.current?.querySelectorAll<HTMLElement>('.space-y-10 > *')
    const el = items?.[selectedElementIndex]
    if (!el) return
    el.scrollIntoView({ block: 'start', behavior: 'smooth' })
    el.animate([{ backgroundColor: 'rgba(99,102,241,0.12)' }, { backgroundColor: 'transparent' }], { duration: 900 })
  }, [selectedElementIndex, scope, pageId])

  return (
    <section aria-label="Preview" className="flex h-full flex-col overflow-hidden">
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
      </div>
      {problems.length > 0 && (
        <div className="border-b border-amber-200 bg-amber-50 px-3 py-1 text-xs text-amber-700">
          {problems.length} referenced {problems.length === 1 ? 'entity' : 'entities'} not loaded (showing placeholders).
        </div>
      )}
      <div ref={scrollRef} className="flex-1 overflow-auto bg-slate-100 p-6">
        <div className={`qv-theme mx-auto bg-white shadow-sm ${compact ? 'qv-compact' : ''}`}
             style={{ width: width ?? '100%', maxWidth: '100%', ...(compact ? { zoom: 0.6 } : {}) }}>
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
