import type { AnswerValue, Runtime } from '../renderer/types'
import type { MintErr } from './bootstrap'
import type { Theme } from './theme'
import { requiredUnanswered, type Step } from './steps'

// auth_required is intercepted in App.tsx (→ LoginView) before any boot_error dispatch
type ErrorKind = Exclude<MintErr['kind'], 'auth_required'>

export type SessionState = {
  phase: 'booting' | 'error' | 'ready' | 'finishing' | 'finished' | 'completed'
  session: { id: string; token: string } | null
  runtime: Runtime | null
  theme: Theme
  steps: Step[]
  stepIndex: number
  visited: number[]
  answers: Record<string, AnswerValue>
  stepErrors: string[]
  validationErrors: { key: string; message: string }[]
  error: { kind: ErrorKind; code: string } | null
  submitError: boolean
}

export const initialState: SessionState = {
  phase: 'booting', session: null, runtime: null, theme: null,
  steps: [], stepIndex: 0, visited: [], answers: {}, stepErrors: [], validationErrors: [], error: null,
  submitError: false,
}

export type Action =
  | { type: 'boot_success'; session: { id: string; token: string }; runtime: Runtime; theme: Theme; steps: Step[] }
  | { type: 'boot_error'; kind: ErrorKind; code: string }
  | { type: 'retry' }
  | { type: 'answer'; key: string; value: AnswerValue }
  | { type: 'next' }
  | { type: 'goto'; index: number | null }
  | { type: 'validation_errors'; errors: { key: string; message: string }[] }
  | { type: 'back' }
  | { type: 'submitted' }
  | { type: 'submit_failed' }
  | { type: 'submit_retry' }
  | { type: 'rehydrate'; session: { id: string; token: string }; runtime: Runtime; theme: Theme; steps: Step[]; answers: Record<string, AnswerValue>; stepIndex: number; visited: number[] }
  | { type: 'set_runtime'; runtime: Runtime; steps: Step[] }
  | { type: 'completed' }

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
      return { ...state, answers, stepErrors: state.stepErrors.filter((k) => k !== action.key), validationErrors: state.validationErrors.filter((e) => e.key !== action.key) }
    }
    case 'next': {
      // deprecated by WV-D goto (kept working for the no-pipeline/required-gating safety branch)
      const step = state.steps[state.stepIndex]
      if (!step) return state
      const missing = requiredUnanswered(step, state.answers)
      if (missing.length > 0) return { ...state, stepErrors: missing }
      if (state.stepIndex >= state.steps.length - 1) return { ...state, phase: 'finishing', stepErrors: [] }
      return { ...state, stepIndex: state.stepIndex + 1, stepErrors: [] }
    }
    case 'goto':
      if (action.index === null) return { ...state, phase: 'finishing', stepErrors: [], validationErrors: [] }
      return { ...state, visited: [...state.visited, state.stepIndex], stepIndex: action.index, stepErrors: [], validationErrors: [] }
    case 'validation_errors':
      return { ...state, validationErrors: action.errors }
    case 'back': {
      const prev = state.visited[state.visited.length - 1] ?? 0
      return { ...state, stepIndex: prev, visited: state.visited.slice(0, -1), stepErrors: [], validationErrors: [] }
    }
    case 'submitted':
      return { ...state, phase: 'finished' }
    case 'submit_failed':
      return { ...state, submitError: true }
    case 'submit_retry':
      return { ...state, submitError: false }
    case 'rehydrate':
      return { ...state, phase: 'ready', session: action.session, runtime: action.runtime, theme: action.theme,
               steps: action.steps, answers: action.answers, stepIndex: action.stepIndex, visited: action.visited,
               stepErrors: [], validationErrors: [] }
    case 'set_runtime':
      return { ...state, runtime: action.runtime, steps: action.steps }
    case 'completed':
      return { ...state, phase: 'completed' }
  }
}
