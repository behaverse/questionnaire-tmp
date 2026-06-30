import type { AnswerValue } from '../renderer/types'
import type { LogicEvaluator, ScoreResolver } from './types'

/** F1: external Scorer execution deferred — every score is unavailable (null → sentinel-false branching). */
export const nullResolver: ScoreResolver = { score: () => null }

export function scoredValueFor(option: Record<string, unknown>, prompt: { reversed?: boolean } | undefined, value: AnswerValue, ev: LogicEvaluator): AnswerValue {
  if (!prompt?.reversed || typeof value !== 'number') return value
  // Discrete (choice) options carry their bounds as option.options[].value; numeric scales
  // (number.interval/ratio sliders & rating buttons) carry them as option.min/max instead.
  const opts = (option.options as { value: number | string }[] | undefined) ?? []
  const nums = opts.map((o) => o.value).filter((v): v is number => typeof v === 'number')
  let min: number, max: number
  if (nums.length > 0) {
    min = Math.min(...nums)
    max = Math.max(...nums)
  } else if (typeof option.min === 'number' && typeof option.max === 'number') {
    min = option.min
    max = option.max
  } else {
    return value
  }
  return ev.reversedValue(value, min, max)
}

export function comparatorFor(option: { input_data_type?: string; selection?: string }): 'equals' | 'set_equals' | 'matches_regex' {
  if (option.input_data_type === 'text') return 'matches_regex'
  if (option.input_data_type === 'choice' && option.selection === 'multiple') return 'set_equals'
  return 'equals'
}

export function solutionCorrect(item: { option?: Record<string, unknown>; solution?: { expected_response?: unknown } }, value: AnswerValue, ev: LogicEvaluator): boolean | null {
  if (!item.solution || item.solution.expected_response === undefined) return null
  const cmp = comparatorFor((item.option ?? {}) as never)
  return ev.compareSolution(cmp, value, item.solution.expected_response)
}
