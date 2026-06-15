import type { Score } from '../model/types'
import type { RuleIssue } from './ruleOps'

const ID_RE = /^[a-z][a-z0-9_]*$/
const SCORER_RE = /^scr_[a-z0-9_]+@v\d{2}\.\d{4}$/
const POINTER_RE = /^(\/[^/]*)+$/

export function newScore(existing: Score[]): Score {
  const ids = new Set(existing.map((s) => s.id))
  let n = 1
  while (ids.has(`score_${n}`)) n++
  return { id: `score_${n}`, scorer: '', path: '' }
}

export function summarizeScore(score: Score): string {
  return `${score.id || '?'}: ${score.scorer || '(no scorer)'} → ${score.path || '(no path)'}`
}

export function validateScore(score: Score, allScores: Score[]): { errors: RuleIssue[] } {
  const errors: RuleIssue[] = []
  if (!score.id) errors.push({ field: 'id', message: 'Id required', level: 'error' })
  else if (!ID_RE.test(score.id)) errors.push({ field: 'id', message: 'Id must be lowercase letters/digits/underscore', level: 'error' })
  else if (allScores.filter((s) => s.id === score.id).length > 1) errors.push({ field: 'id', message: `Duplicate id: ${score.id}`, level: 'warning' })
  if (!score.scorer) errors.push({ field: 'scorer', message: 'Choose or enter a scorer', level: 'error' })
  else if (!SCORER_RE.test(score.scorer)) errors.push({ field: 'scorer', message: 'Must be scr_…@vYY.MMDD', level: 'error' })
  if (!score.path) errors.push({ field: 'path', message: 'Path required', level: 'error' })
  else if (!POINTER_RE.test(score.path)) errors.push({ field: 'path', message: 'Must be a JSON Pointer (e.g. /total)', level: 'error' })
  return { errors }
}
