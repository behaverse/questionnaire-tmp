import type { AnswerValue, Runtime } from '../renderer/types'
import type { MintErr } from './bootstrap'
import type { Theme } from './theme'
import { requiredUnanswered, type Step } from './steps'

export type SessionState = {
  phase: 'booting' | 'error' | 'ready' | 'finishing' | 'finished'
  session: { id: string; token: string } | null
  runtime: Runtime | null
  theme: Theme
  steps: Step[]
  stepIndex: number
  answers: Record<string, AnswerValue>
  stepErrors: string[]
  error: { kind: MintErr['kind']; code: string } | null
  submitError: boolean
}

export const initialState: SessionState = {
  phase: 'booting', session: null, runtime: null, theme: null,
  steps: [], stepIndex: 0, answers: {}, stepErrors: [], error: null,
  submitError: false,
}

export type Action =
  | { type: 'boot_success'; session: { id: string; token: string }; runtime: Runtime; theme: Theme; steps: Step[] }
  | { type: 'boot_error'; kind: MintErr['kind']; code: string }
  | { type: 'retry' }
  | { type: 'answer'; key: string; value: AnswerValue }
  | { type: 'next' }
  | { type: 'back' }
  | { type: 'submitted' }
  | { type: 'submit_failed' }
  | { type: 'submit_retry' }

export function reducer(state: SessionState, action: Action): SessionState {
  switch (action.type) {
    case 'boot_success':
      return { ...state, phase: 'ready', session: action.session, runtime: action.runtime, theme: action.theme, steps: action.steps, stepIndex: 0 }
    case 'boot_error':
      return { ...state, phase: 'error', error: { kind: action.kind, code: action.code } }
    case 'retry':
      return { ...initialState }
    case 'answer': {
      const answers = { ...state.answers, [action.key]: action.value }
      return { ...state, answers, stepErrors: state.stepErrors.filter((k) => k !== action.key) }
    }
    case 'next': {
      const step = state.steps[state.stepIndex]
      if (!step) return state
      const missing = requiredUnanswered(step, state.answers)
      if (missing.length > 0) return { ...state, stepErrors: missing }
      if (state.stepIndex >= state.steps.length - 1) return { ...state, phase: 'finishing', stepErrors: [] }
      return { ...state, stepIndex: state.stepIndex + 1, stepErrors: [] }
    }
    case 'back':
      return { ...state, stepIndex: Math.max(0, state.stepIndex - 1), stepErrors: [] }
    case 'submitted':
      return { ...state, phase: 'finished' }
    case 'submit_failed':
      return { ...state, submitError: true }
    case 'submit_retry':
      return { ...state, submitError: false }
  }
}
