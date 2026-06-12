import type { AnswerValue, Runtime } from '../renderer/types'
import type { Bindings, ScoreResolver } from './types'

export function makeBindings(answers: Record<string, AnswerValue>, _runtime: Runtime, resolver: ScoreResolver): Bindings {
  return {
    var(id) {
      if (id in answers) return answers[id] as unknown
      const s = resolver.score(id)
      return s ?? null
    },
    score: (id) => resolver.score(id) ?? null,
  }
}
