import { isItem, isSection } from '../renderer/guards'
import { elementKey, pageElementFallback, sectionChildFallback } from '../renderer/keys'
import { scoredValueFor } from '../logic/scoring'
import type { LogicEvaluator, EvalValue, ScoreResolver } from '../logic/types'
import type { AnswerValue, ItemElement, Runtime } from '../renderer/types'
import { compileScorer, type CompiledScorer } from './vendor/scorerHost'
import { fetchScorerWasm } from './fetch'
import type { PinnedScore } from './types'

export interface ScorerSet {
  compiled: Map<string, CompiledScorer>
  failures: Map<string, string>
}

/** Compile every distinct scorer referenced by the runtime. Never throws; failures recorded. */
export async function compileScorers(runtime: Runtime, fetchImpl: typeof fetch = fetch): Promise<ScorerSet> {
  const scores = (runtime.scores ?? []) as PinnedScore[]
  const refs = [...new Set(scores.map((s) => s.scorer))]
  const compiled = new Map<string, CompiledScorer>()
  const failures = new Map<string, string>()
  await Promise.all(refs.map(async (ref) => {
    const pinned = scores.find((s) => s.scorer === ref)!
    try {
      const bytes = await fetchScorerWasm(pinned.impl, fetchImpl)
      const inst = await compileScorer(bytes)
      if (inst.abiVersion() !== 1) throw new Error(`unsupported ABI ${inst.abiVersion()}`)
      compiled.set(ref, inst)
    } catch (e) {
      failures.set(ref, e instanceof Error ? e.message : String(e))
    }
  }))
  return { compiled, failures }
}

type InputEntry = {
  promptId: string
  option: Record<string, unknown>
  prompt: { reversed?: boolean } | undefined
}

function buildScoreInputIndex(runtime: Runtime): Map<string, InputEntry> {
  const map = new Map<string, InputEntry>()
  const add = (key: string, el: ItemElement) => {
    const promptId = el.question.prompt?.id
    if (promptId) {
      map.set(key, {
        promptId,
        option: el.option as Record<string, unknown>,
        prompt: el.question.prompt as { reversed?: boolean },
      })
    }
  }
  runtime.pages.forEach((page) => {
    page.elements.forEach((el, i) => {
      const key = elementKey(el, pageElementFallback(page.id, i))
      if (isSection(el)) {
        el.elements.forEach((c, j) => {
          if (isItem(c)) add(elementKey(c, sectionChildFallback(key, j)), c)
        })
      } else if (isItem(el)) {
        add(key, el)
      }
    })
  })
  return map
}

function assembleInputs(
  answers: Record<string, AnswerValue>,
  index: Map<string, InputEntry>,
  ev: LogicEvaluator,
): { scored_responses: Record<string, AnswerValue> } {
  const scored_responses: Record<string, AnswerValue> = {}
  for (const [key, { promptId, option, prompt }] of index) {
    const v = answers[key]
    if (v === undefined || v === null) continue
    scored_responses[promptId] = scoredValueFor(option, prompt, v, ev)
  }
  return { scored_responses }
}

function jsonPointer(obj: unknown, pointer: string): unknown {
  if (pointer === '') return obj
  const parts = pointer
    .split('/')
    .slice(1)
    .map((p) => p.replace(/~1/g, '/').replace(/~0/g, '~'))
  let cur: unknown = obj
  for (const part of parts) {
    if (cur === null || typeof cur !== 'object') return undefined
    cur = (cur as Record<string, unknown>)[part]
  }
  return cur
}

export interface ScoreCache {
  refresh(answers: Record<string, AnswerValue>, ev: LogicEvaluator): void
  resolver: ScoreResolver
  scorerOutputs(): Record<string, unknown>
}

export function makeScoreCache(set: ScorerSet, runtime: Runtime): ScoreCache {
  const scores = (runtime.scores ?? []) as PinnedScore[]
  const index = buildScoreInputIndex(runtime)
  const outputs = new Map<string, unknown>()
  return {
    refresh(answers, ev) {
      const input = assembleInputs(answers, index, ev)
      for (const [ref, inst] of set.compiled) {
        const r = inst.run(input)
        if (r.ok) outputs.set(ref, r.output)
        else outputs.delete(ref)
      }
    },
    resolver: {
      score(id: string): EvalValue {
        const pinned = scores.find((s) => s.id === id)
        if (!pinned) return null
        const output = outputs.get(pinned.scorer)
        if (output === undefined) return null
        const v = jsonPointer(output, pinned.path)
        if (typeof v === 'number' || typeof v === 'string' || typeof v === 'boolean') return v
        return null
      },
    },
    scorerOutputs() {
      return Object.fromEntries(outputs)
    },
  }
}
