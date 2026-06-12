import { useEffect, useReducer, useRef } from 'react'
import { StepRenderer } from '../renderer'
import { isItem } from '../renderer/guards'
import { mergeOptions } from '../renderer/merge'
import type { AnswerValue, Runtime } from '../renderer/types'
import { completeSession, mintSession, parseParams, VIEWER_ID, VIEWER_VERSION } from './bootstrap'
import { ErrorScreen } from './chrome/ErrorScreen'
import { NavButtons } from './chrome/NavButtons'
import { ProgressBar } from './chrome/ProgressBar'
import { StepTransition } from './chrome/StepTransition'
import { t } from './chrome/strings'
import { agentActor, engineActor, ev, EventBatcher } from './events'
import { buildItemRow, buildMessageRow, buildRuntimeIndex, stimulusFor } from './responses'
import type { ElementIndex, SessionIdentity } from './responses'
import { initialState, reducer } from './session'
import { flattenSteps, isSingleChoiceItem, presentationMode, requiredUnanswered, stepEntries } from './steps'
import { applyTheme } from './theme'
import type { Theme } from './theme'
import { SubmissionQueue } from './transport'
import { TrialClock } from './trial'

const FIXTURES: Record<string, () => Promise<{ default: unknown }>> = {
  mini: () => import('../fixtures/mini.json'),
  matrix: () => import('../fixtures/matrix.json'),
  widgets: () => import('../fixtures/widgets.json'),
}
const AUTO_ADVANCE_MS = 400

type Pipeline = {
  identity: SessionIdentity
  index: Map<string, ElementIndex>
  clock: TrialClock
  queue: SubmissionQueue
  batcher: EventBatcher
  engine: ReturnType<typeof engineActor>
  agent: ReturnType<typeof agentActor>
  summaryRt: boolean
}

export function App() {
  const [state, dispatch] = useReducer(reducer, initialState)
  const stateRef = useRef(state)
  stateRef.current = state
  const autoTimer = useRef<number | null>(null)
  const bootStarted = useRef(false)
  const stepContainer = useRef<HTMLDivElement | null>(null)
  const pipeline = useRef<Pipeline | null>(null)
  const params = parseParams(window.location.search)
  const locale = state.runtime?.locale ?? params.locale ?? 'en'

  const nowIso = () => new Date().toISOString()

  function buildPipeline(
    sessionId: string,
    token: string,
    agentId: string,
    sessionIndex: number,
    runtime: Runtime,
    fetchImpl?: typeof fetch,
  ) {
    const identity: SessionIdentity = {
      sessionId,
      agentId,
      sessionIndex,
      instrumentId: runtime.metadata.id,
      language: runtime.locale ?? 'en',
    }
    const queue = new SubmissionQueue({
      vsBaseUrl: params.vsBaseUrl,
      sessionId,
      token,
      ...(fetchImpl ? { fetchImpl } : {}),
    })
    const batcher = new EventBatcher(sessionId, (batch) => queue.enqueue('events', batch))
    pipeline.current = {
      identity,
      index: buildRuntimeIndex(runtime),
      clock: new TrialClock(),
      queue,
      batcher,
      engine: engineActor(`${VIEWER_ID}@${VIEWER_VERSION}`),
      agent: agentActor(agentId),
      summaryRt: (runtime.style as Record<string, unknown> | undefined)?.x_summary_rt !== false,
    }
    batcher.add(ev.initialized(pipeline.current.engine, sessionId, nowIso()))
    batcher.add(ev.started(pipeline.current.engine, sessionId, nowIso()))
  }

  useEffect(() => {
    if (state.phase !== 'booting') return
    if (bootStarted.current) return
    bootStarted.current = true
    async function boot() {
      if (import.meta.env.DEV && params.fixture && FIXTURES[params.fixture]) {
        const runtime = (await FIXTURES[params.fixture]()).default as Runtime
        buildPipeline('fixture', 'fixture', 'agent_fixture', 1, runtime, async () => new Response('{}', { status: 202 }))
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
        buildPipeline(res.session_id, res.session_token, res.agent_id, res.session_index, res.runtime)
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
      advance('key')
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

  // Step-shown effect: emit trialStarted + presented events for each entry on the current step
  useEffect(() => {
    const p = pipeline.current
    if (state.phase !== 'ready' || !p) return
    p.clock.stepShown(state.stepIndex)
    const step = state.steps[state.stepIndex]
    if (!step) return
    for (const entry of stepEntries(step)) {
      const c = { sessionId: p.identity.sessionId, trialIndex: p.index.get(entry.key)?.trialIndex }
      p.batcher.add(ev.trialStarted(p.engine, `trial_${entry.key}`, c, nowIso()))
      const stim = stimulusFor(entry.element, entry.key, locale)
      p.batcher.add(ev.presented(p.engine, stim.stimulus_id, stim.stimulus_description.slice(0, 120), c, nowIso()))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.phase, state.stepIndex])

  // Finishing effect: flush queue, call complete, transition to finished
  useEffect(() => {
    const p = pipeline.current
    if (state.phase !== 'finishing' || !p || state.submitError) return
    let cancelled = false
    const token = state.session?.token ?? ''
    async function finish(pl: Pipeline) {
      pl.batcher.add(ev.completed(pl.engine, pl.identity.sessionId, nowIso()))
      pl.batcher.flush()
      const timeout = new Promise<'timeout'>((r) => window.setTimeout(() => r('timeout'), 10_000))
      const outcome = await Promise.race([pl.queue.idle().then(() => 'idle' as const), timeout])
      if (cancelled) return
      if (outcome === 'timeout') { dispatch({ type: 'submit_failed' }); return }
      const ok = pl.identity.sessionId === 'fixture' || (await completeSession(params.vsBaseUrl, pl.identity.sessionId, token))
      if (cancelled) return
      if (!ok) { dispatch({ type: 'submit_failed' }); return }
      pl.batcher.add(ev.submitted(pl.engine, pl.identity.sessionId, nowIso()))
      pl.batcher.flush()
      dispatch({ type: 'submitted' })
    }
    void finish(p)
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.phase, state.submitError])

  // pagehide flush
  useEffect(() => {
    function onHide() {
      const p = pipeline.current
      if (!p) return
      p.batcher.flush()
      p.queue.flushKeepalive()
    }
    function onVisibility() {
      if (document.visibilityState === 'hidden') onHide()
    }
    window.addEventListener('pagehide', onHide)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      window.removeEventListener('pagehide', onHide)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  // minor: unmount cleanup for the auto-advance timer
  useEffect(() => () => clearAuto(), [])

  function clearAuto() {
    if (autoTimer.current !== null) { window.clearTimeout(autoTimer.current); autoTimer.current = null }
  }

  function handleAnswer(key: string, value: AnswerValue) {
    const p = pipeline.current
    if (p) {
      p.clock.answerChanged(key)
      const step = state.steps[state.stepIndex]
      const entry = step ? stepEntries(step).find((e) => e.key === key) : undefined
      if (entry && isItem(entry.element) && entry.element.option.input_data_type === 'choice') {
        const c = { sessionId: p.identity.sessionId, trialIndex: p.index.get(key)?.trialIndex }
        const opt = entry.element.option
        let choices: { value: number | string; text: string }[] = []
        try { choices = mergeOptions(opt, locale) } catch { /* missing locale texts: events carry raw values */ }
        const textFor = (v: unknown) => choices.find((ch) => ch.value === v)?.text ?? String(v)
        const prev = state.answers[key]
        if (Array.isArray(value)) {
          const prevArr = Array.isArray(prev) ? prev : []
          const added = value.find((v) => !prevArr.includes(v))
          const removed = prevArr.find((v) => !value.includes(v))
          if (added !== undefined) p.batcher.add(ev.selected(p.agent, opt.id ?? key, textFor(added), c, nowIso()))
          if (removed !== undefined) p.batcher.add(ev.deselected(p.agent, opt.id ?? key, textFor(removed), c, nowIso()))
        } else if (value !== null) {
          p.batcher.add(ev.selected(p.agent, opt.id ?? key, textFor(value), c, nowIso()))
        }
      }
    }

    dispatch({ type: 'answer', key, value })
    const step = state.steps[state.stepIndex]
    const focus = state.runtime ? presentationMode(state.runtime) === 'focus' : false
    const autoOn = state.runtime?.style?.x_auto_advance !== false
    if (focus && autoOn && step && isSingleChoiceItem(step)) {
      clearAuto()
      autoTimer.current = window.setTimeout(() => advance('auto'), AUTO_ADVANCE_MS)
    }
  }

  function advance(source: 'click' | 'key' | 'auto') {
    clearAuto()
    const p = pipeline.current
    // Always read from stateRef so timer callbacks (auto) see the latest answers
    const s = stateRef.current
    const step = s.steps[s.stepIndex]
    if (!p || !step || requiredUnanswered(step, s.answers).length > 0) {
      dispatch({ type: 'next' })            // reducer applies gating / no-op safety
      return
    }
    if (source !== 'auto') p.batcher.add(ev.clicked(p.agent, 'next_button', { sessionId: p.identity.sessionId }, nowIso()))
    for (const entry of stepEntries(step)) {
      const index = p.index.get(entry.key)
      if (!index) continue
      const timing0 = p.clock.timingFor(s.stepIndex, entry.key)
      const timing = { ...timing0, responseTimeS: p.summaryRt ? timing0.responseTimeS : null }
      const c = { sessionId: p.identity.sessionId, trialIndex: index.trialIndex }
      if (entry.kind === 'message') {
        if (p.clock.messageSubmitted(entry.key)) continue
        const responseId = p.clock.allocateResponseId()
        const row = buildMessageRow({ identity: p.identity, index, responseId, timing }, entry.element, locale, source === 'key' ? 'key' : 'click')
        p.queue.enqueue('responses', { session_id: p.identity.sessionId, responses: [row] })
        p.clock.markMessageSubmitted(entry.key)
        p.batcher.add(ev.trialEnded(p.engine, `trial_${entry.key}`, {
          'bdm:response_id': responseId, 'bdm:response_description': 'acknowledged',
          ...(timing.responseTimeS !== null ? { 'bdm:response_time': timing.responseTimeS } : {}),
        }, c, nowIso()))
        continue
      }
      if (!isItem(entry.element)) continue
      const answer = s.answers[entry.key] ?? null
      const serialised = JSON.stringify(answer)
      const attempt = p.clock.attemptFor(entry.key, serialised)
      if (attempt.kind === 'unchanged') continue
      if (answer === null && attempt.kind === 'first') continue       // untouched optional question → no row in WV-B
      const responseId = p.clock.allocateResponseId()
      const row = buildItemRow(
        { identity: p.identity, index, responseId, timing, ...(attempt.kind === 'revision' ? { attempt: { revises: attempt.revises, revision: attempt.revision } } : {}) },
        entry.element, answer, locale,
      )
      if (entry.element.option.input_data_type === 'number') p.batcher.add(ev.adjusted(p.agent, entry.key, c, nowIso()))
      if (entry.element.option.input_data_type === 'text') p.batcher.add(ev.typed(p.agent, entry.key, c, nowIso()))
      p.queue.enqueue('responses', { session_id: p.identity.sessionId, responses: [row] })
      p.clock.recordSubmitted(entry.key, serialised, responseId)
      p.batcher.add(ev.trialEnded(p.engine, `trial_${entry.key}`, {
        'bdm:response_id': responseId,
        ...(row.response_description !== undefined ? { 'bdm:response_description': row.response_description } : {}),
        ...(row.response_numeric !== undefined ? { 'bdm:response_numeric': row.response_numeric } : {}),
        ...(row.response_option_index !== undefined ? { 'bdm:response_option_index': row.response_option_index } : {}),
        ...(timing.responseTimeS !== null ? { 'bdm:response_time': timing.responseTimeS } : {}),
      }, c, nowIso()))
    }
    dispatch({ type: 'next' })
  }

  if (state.phase === 'booting') return <main className="min-h-screen font-theme" aria-busy="true" />
  if (state.phase === 'finishing') {
    return (
      <main className="min-h-screen grid place-items-center px-6 font-theme text-center">
        <div className="max-w-md space-y-4">
          {state.submitError ? (
            <>
              <h1 className="text-2xl font-semibold">{t(locale, 'submit_failed_title')}</h1>
              <p className="text-slate-600">{t(locale, 'submit_failed_body')}</p>
              <button onClick={() => dispatch({ type: 'submit_retry' })} className="rounded-lg bg-primary px-5 py-2.5 text-white font-medium">
                {t(locale, 'retry')}
              </button>
            </>
          ) : (
            <p aria-live="polite" className="text-lg text-slate-600">{t(locale, 'submitting')}</p>
          )}
        </div>
      </main>
    )
  }
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
            onBack={() => {
              clearAuto()
              const p = pipeline.current
              if (p) {
                p.batcher.add(ev.clicked(p.agent, 'back_button', { sessionId: p.identity.sessionId }, nowIso()))
                p.batcher.add(ev.navigated(p.agent, `step_${state.stepIndex - 1}`, { sessionId: p.identity.sessionId }, nowIso()))
              }
              dispatch({ type: 'back' })
            }}
            onNext={() => advance('click')}
          />
        </StepTransition>
      </div>
    </main>
  )
}
