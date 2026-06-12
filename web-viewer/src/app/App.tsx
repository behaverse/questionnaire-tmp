import { useEffect, useReducer, useRef } from 'react'
import { StepRenderer } from '../renderer'
import type { AnswerValue, Runtime } from '../renderer/types'
import { mintSession, parseParams } from './bootstrap'
import { ErrorScreen } from './chrome/ErrorScreen'
import { NavButtons } from './chrome/NavButtons'
import { ProgressBar } from './chrome/ProgressBar'
import { StepTransition } from './chrome/StepTransition'
import { t } from './chrome/strings'
import { initialState, reducer } from './session'
import { flattenSteps, isSingleChoiceItem, presentationMode } from './steps'
import { applyTheme } from './theme'
import type { Theme } from './theme'

const FIXTURES: Record<string, () => Promise<{ default: unknown }>> = {
  mini: () => import('../fixtures/mini.json'),
  matrix: () => import('../fixtures/matrix.json'),
  widgets: () => import('../fixtures/widgets.json'),
}
const AUTO_ADVANCE_MS = 400

export function App() {
  const [state, dispatch] = useReducer(reducer, initialState)
  const autoTimer = useRef<number | null>(null)
  const bootStarted = useRef(false)
  const stepContainer = useRef<HTMLDivElement | null>(null)
  const params = parseParams(window.location.search)
  const locale = state.runtime?.locale ?? params.locale ?? 'en'

  useEffect(() => {
    if (state.phase !== 'booting') return
    if (bootStarted.current) return
    bootStarted.current = true
    async function boot() {
      if (import.meta.env.DEV && params.fixture && FIXTURES[params.fixture]) {
        const runtime = (await FIXTURES[params.fixture]()).default as Runtime
        dispatch({ type: 'boot_success', session: { id: 'fixture', token: 'fixture' }, runtime, theme: null, steps: flattenSteps(runtime) })
        return
      }
      if (!params.deploymentId) {
        dispatch({ type: 'boot_error', kind: 'invalid_link', code: 'missing_deployment_param' })
        return
      }
      const res = await mintSession(params.vsBaseUrl, params.deploymentId, params.locale)
      if (res.ok) {
        applyTheme(res.theme as Theme)
        dispatch({ type: 'boot_success', session: { id: res.session_id, token: res.session_token }, runtime: res.runtime, theme: res.theme as Theme, steps: flattenSteps(res.runtime) })
        document.title = res.runtime.metadata.title
        document.documentElement.lang = res.runtime.locale ?? 'en'
      } else {
        dispatch({ type: 'boot_error', kind: res.kind, code: res.code })
      }
    }
    void boot()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.phase])

  useEffect(() => {
    if (state.phase !== 'ready') return
    function onKey(e: KeyboardEvent) {
      if (e.key !== 'Enter' || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLButtonElement) return
      clearAuto()
      dispatch({ type: 'next' })
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.phase])

  // I1: focus the incoming step heading after StepTransition's 200ms swap
  useEffect(() => {
    if (state.phase !== 'ready') return
    const timer = window.setTimeout(() => {
      const heading = stepContainer.current?.querySelector<HTMLElement>('h2[tabindex="-1"]')
      heading?.focus()
    }, 250)
    return () => window.clearTimeout(timer)
  }, [state.phase, state.stepIndex])

  // I1: on gating failure, focus the first failing widget
  useEffect(() => {
    if (state.stepErrors.length === 0) return
    const widget = stepContainer.current?.querySelector<HTMLElement>('input, [role="radiogroup"] input')
    widget?.focus()
  }, [state.stepErrors])

  // minor: unmount cleanup for the auto-advance timer
  useEffect(() => () => clearAuto(), [])

  function clearAuto() {
    if (autoTimer.current !== null) { window.clearTimeout(autoTimer.current); autoTimer.current = null }
  }

  function handleAnswer(key: string, value: AnswerValue) {
    dispatch({ type: 'answer', key, value })
    const step = state.steps[state.stepIndex]
    const focus = state.runtime ? presentationMode(state.runtime) === 'focus' : false
    const autoOn = state.runtime?.style?.x_auto_advance !== false
    if (focus && autoOn && step && isSingleChoiceItem(step)) {
      clearAuto()
      autoTimer.current = window.setTimeout(() => dispatch({ type: 'next' }), AUTO_ADVANCE_MS)
    }
  }

  if (state.phase === 'booting') return <main className="min-h-screen font-theme" aria-busy="true" />
  if (state.phase === 'error' && state.error) {
    return <ErrorScreen locale={locale} kind={state.error.kind} code={state.error.code} onRetry={() => { bootStarted.current = false; dispatch({ type: 'retry' }) }} />
  }
  if (state.phase === 'finished') {
    return (
      <main className="min-h-screen grid place-items-center px-6 font-theme text-center">
        <div className="qv-step-enter max-w-md space-y-3">
          <h1 className="text-3xl font-semibold">{t(locale, 'finished_title')}</h1>
          <p className="text-lg text-slate-600">{t(locale, 'finished_body')}</p>
        </div>
      </main>
    )
  }

  const step = state.steps[state.stepIndex]
  if (!step) return null
  const keyHints = isSingleChoiceItem(step)
  return (
    <main className="min-h-screen font-theme">
      <ProgressBar locale={locale} current={state.stepIndex + 1} total={state.steps.length} />
      <div ref={stepContainer} className="mx-auto flex min-h-screen w-full max-w-2xl flex-col justify-center px-6 py-24">
        <StepTransition stepKey={state.stepIndex}>
          <StepRenderer
            elements={step.elements}
            locale={locale}
            answers={state.answers}
            onAnswer={handleAnswer}
            requiredErrors={state.stepErrors}
            keyHints={keyHints}
            strings={{ required: t(locale, 'required_error'), unsupported: t(locale, 'unsupported') }}
          />
          <NavButtons
            locale={locale}
            canBack={state.stepIndex > 0}
            onBack={() => { clearAuto(); dispatch({ type: 'back' }) }}
            onNext={() => { clearAuto(); dispatch({ type: 'next' }) }}
          />
        </StepTransition>
      </div>
    </main>
  )
}
