import { useEffect, useMemo } from 'react'
import { StepRenderer } from '../renderer'
import type { AnswerValue, Runtime } from '../renderer/types'
import { flattenSteps, type Step } from '../app/steps'
import { useReplayClock } from './clock'
import type { RecAnswer, Timeline } from './reconstruct'

const SPEEDS = [0.5, 1, 2, 4]
const NOOP = () => {}
const fmt = (ms: number) => `${Math.floor(ms / 1000)}s`

/** Map a reconstructed answer to the renderer's AnswerValue using the element definition. */
function toAnswerValue(el: Step['elements'][number]['element'], a: RecAnswer): AnswerValue | undefined {
  const opt = (el as { option?: { input_data_type?: string; selection?: string; options?: { index: number; value: unknown }[] } }).option
  if (!opt) return undefined
  if (opt.input_data_type === 'choice' && opt.selection === 'multiple' && a.selectedIndices && a.selectedIndices.length) {
    const vals = a.selectedIndices
      .map((idx) => (opt.options ?? []).find((o) => o.index === idx)?.value)
      .filter((v) => v !== undefined)
    return vals as AnswerValue
  }
  if (opt.input_data_type === 'choice' && a.optionIndex != null) {
    const found = (opt.options ?? []).find((o) => o.index === a.optionIndex)
    if (found) return found.value as AnswerValue
  }
  if (a.numeric != null) return a.numeric as AnswerValue
  if (a.description != null) return a.description as AnswerValue
  return undefined
}

export function ReplayView({ runtime, timeline, cursorAt, follow }: {
  runtime: Runtime; timeline: Timeline; cursorAt: (absMs: number) => { x: number; y: number } | null
  follow?: { following: boolean; ended: boolean; onToggle: () => void }
}) {
  const steps = useMemo(() => flattenSteps(runtime), [runtime])
  const locale = runtime.locale ?? 'en'
  const clock = useReplayClock(timeline.durationMs)
  // live-tail: while following (and not ended), keep the view pinned to the latest event
  useEffect(() => {
    if (follow?.following && !follow.ended) clock.seek(timeline.durationMs)
  }, [follow?.following, follow?.ended, timeline.durationMs, clock.seek])
  const absMs = timeline.startMs + clock.offsetMs
  const state = timeline.stateAt(absMs)

  // find the step containing the current element (fallback: first step)
  const stepIdx = Math.max(0, steps.findIndex((s) => s.elements.some((e) => e.key === state.elementKey)))
  const step = steps[stepIdx] ?? steps[0]
  const answers: Record<string, AnswerValue> = {}
  if (step) for (const e of step.elements) {
    const a = state.answers[e.key]
    if (a) { const v = toAnswerValue(e.element, a); if (v !== undefined) answers[e.key] = v }
  }
  const cursor = cursorAt(absMs)

  return (
    <div className="replay" style={{ maxWidth: 720, margin: '0 auto', padding: 24 }}>
      <div style={{ position: 'relative' }}>
        <div style={{ pointerEvents: 'none' }} aria-label="replay surface">
          {step && <StepRenderer elements={step.elements} locale={locale} answers={answers} onAnswer={NOOP}
            requiredErrors={[]} strings={{ required: '', unsupported: 'unsupported' }} />}
        </div>
        {cursor && <div id="replay-cursor" style={{ position: 'fixed', left: cursor.x, top: cursor.y, width: 22, height: 22, margin: '-11px 0 0 -11px', border: '3px solid #e11d48', borderRadius: '50%', background: 'rgba(225,29,72,0.25)', pointerEvents: 'none', zIndex: 60 }} />}
      </div>

      <div className="replay-controls" style={{ marginTop: 24, display: 'flex', gap: 12, alignItems: 'center' }}>
        <button onClick={() => (clock.playing ? clock.pause() : clock.play())}>{clock.playing ? 'Pause' : 'Play'}</button>
        <input type="range" aria-label="timeline" min={0} max={timeline.durationMs} value={clock.offsetMs}
          onChange={(e) => clock.seek(Number(e.target.value))} style={{ flex: 1 }} />
        <span>{fmt(clock.offsetMs)} / {fmt(timeline.durationMs)}</span>
        <label>speed <select aria-label="speed" value={clock.speed} onChange={(e) => clock.setSpeed(Number(e.target.value))}>
          {SPEEDS.map((s) => <option key={s} value={s}>{s}×</option>)}
        </select></label>
        {follow && (
          <button onClick={follow.onToggle} disabled={follow.ended}
            style={{ color: follow.ended ? '#71717a' : follow.following ? '#e11d48' : '#a1a1aa', fontWeight: 600 }}>
            {follow.ended ? 'Ended' : follow.following ? '● LIVE' : 'Paused'}
          </button>
        )}
      </div>
    </div>
  )
}
