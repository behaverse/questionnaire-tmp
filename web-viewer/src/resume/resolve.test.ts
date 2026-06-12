import { resolveResume, firstUnansweredStep } from './resolve'
import { makeFakeStore } from './store'
import { collectPrograms } from '../logic/compile'
import { makeFakeEvaluator } from '../logic/evaluator'
import { makeBindings } from '../logic/bindings'
import { nullResolver } from '../logic/scoring'
import { flattenSteps } from '../app/steps'
import type { ResumeRecord } from './types'
import type { Runtime } from '../renderer/types'

const rec = (over: Partial<ResumeRecord> = {}): ResumeRecord => ({
  deploymentId: 'dpl_1', sessionId: 's1', token: 't1', lastActiveLocale: 'en',
  answers: {}, stepIndex: 0, visited: [], updatedAt: 'x', ...over,
})

test('no stored record → fresh', async () => {
  const out = await resolveResume('http://vs:9', 'dpl_1', makeFakeStore(), {
    getSession: async () => ({ kind: 'ok', status: 'in_progress', lastActiveLocale: 'en', agentId: 'agent_z', sessionIndex: 1 }),
    getRuntime: async () => ({}) as Runtime,
  })
  expect(out).toEqual({ kind: 'fresh' })
})
test('in_progress → resume with runtime + record', async () => {
  const store = makeFakeStore([rec()])
  const rt = { metadata: { id: 'q' } } as Runtime
  const out = await resolveResume('http://vs:9', 'dpl_1', store, {
    getSession: async () => ({ kind: 'ok', status: 'in_progress', lastActiveLocale: 'pt', agentId: 'agent_z', sessionIndex: 1 }),
    getRuntime: async () => rt,
  })
  expect(out).toEqual({ kind: 'resume', record: { ...rec(), lastActiveLocale: 'pt', agentId: 'agent_z', sessionIndex: 1 }, runtime: rt })
})
test('submitted → completed (store cleared)', async () => {
  const store = makeFakeStore([rec()])
  const out = await resolveResume('http://vs:9', 'dpl_1', store, {
    getSession: async () => ({ kind: 'ok', status: 'submitted', lastActiveLocale: 'en', agentId: 'agent_z', sessionIndex: 1 }),
    getRuntime: async () => null,
  })
  expect(out).toEqual({ kind: 'completed' })
  expect(await store.get('dpl_1')).toBeNull()
})
test('ephemeral 409 → ephemeral_cleared (store cleared)', async () => {
  const store = makeFakeStore([rec()])
  const out = await resolveResume('http://vs:9', 'dpl_1', store, {
    getSession: async () => ({ kind: 'ephemeral' }), getRuntime: async () => null,
  })
  expect(out).toEqual({ kind: 'ephemeral_cleared' })
  expect(await store.get('dpl_1')).toBeNull()
})
test('invalid token → fresh (store cleared)', async () => {
  const store = makeFakeStore([rec()])
  const out = await resolveResume('http://vs:9', 'dpl_1', store, {
    getSession: async () => ({ kind: 'invalid' }), getRuntime: async () => null,
  })
  expect(out).toEqual({ kind: 'fresh' })
  expect(await store.get('dpl_1')).toBeNull()
})
test('network error → retry (record kept)', async () => {
  const store = makeFakeStore([rec()])
  const out = await resolveResume('http://vs:9', 'dpl_1', store, {
    getSession: async () => ({ kind: 'network' }), getRuntime: async () => null,
  })
  expect(out).toEqual({ kind: 'retry' })
  expect(await store.get('dpl_1')).not.toBeNull()
})
test('firstUnansweredStep lands on the first required+visible+unanswered step', () => {
  const opt = { input_data_type: 'choice', measurement_type: 'ordinal', selection: 'single',
    options: [{ index: 1, value: 0 }], content: { en: { options: [{ index: 1, text: 'A' }] } } }
  const item = (id: string, required = true) => ({ id, question: { prompt: { content: { en: { text: id } } } }, option: opt, required })
  const rt: Runtime = { provenance: {}, metadata: { id: 'q', title: 'T', language: 'en' }, locale: 'en',
    pages: [{ id: 'p1', elements: [item('it_1'), item('it_2')] }] } as never
  const steps = flattenSteps(rt)   // focus mode → 2 steps
  const ev = makeFakeEvaluator()
  const programs = collectPrograms(rt, ev)
  const land = (answers: Record<string, unknown>) =>
    firstUnansweredStep(steps, programs, ev, makeBindings(answers as never, rt, nullResolver), answers as never)
  expect(land({})).toBe(0)
  expect(land({ it_1: 0 })).toBe(1)
  expect(land({ it_1: 0, it_2: 0 })).toBe(1)   // all answered → last step index (steps.length-1 = 1)
})
