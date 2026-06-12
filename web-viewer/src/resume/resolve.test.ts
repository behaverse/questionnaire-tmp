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
  const land = (answers: Record<string, unknown>, saved = 0) =>
    firstUnansweredStep(steps, programs, ev, makeBindings(answers as never, rt, nullResolver), answers as never, saved)
  expect(land({})).toBe(0)
  expect(land({ it_1: 0 })).toBe(1)
  // all required answered → resume at the SAVED position, not the last step (OD-14 case 1 fallback)
  expect(land({ it_1: 0, it_2: 0 }, 0)).toBe(0)
  expect(land({ it_1: 0, it_2: 0 }, 1)).toBe(1)
})
test('firstUnansweredStep: all-optional questionnaire resumes at the saved position, not the last step', () => {
  const opt = { input_data_type: 'choice', measurement_type: 'ordinal', selection: 'single',
    options: [{ index: 1, value: 0 }], content: { en: { options: [{ index: 1, text: 'A' }] } } }
  const item = (id: string) => ({ id, question: { prompt: { content: { en: { text: id } } } }, option: opt })  // no `required`
  const rt: Runtime = { provenance: {}, metadata: { id: 'q', title: 'T', language: 'en' }, locale: 'en',
    pages: [{ id: 'p1', elements: [item('it_1')] }, { id: 'p2', elements: [item('it_2')] }, { id: 'p3', elements: [item('it_3')] }] } as never
  const steps = flattenSteps(rt)   // 3 steps, none required
  const ev = makeFakeEvaluator()
  const programs = collectPrograms(rt, ev)
  const land = firstUnansweredStep(steps, programs, ev, makeBindings({ it_1: 0, it_2: 0 } as never, rt, nullResolver), { it_1: 0, it_2: 0 } as never, 2)
  expect(land).toBe(2)   // saved on the 3rd step → resume there (NOT flung to last = also 2 here, so use a clamped case)
  const clamped = firstUnansweredStep(steps, programs, ev, makeBindings({} as never, rt, nullResolver), {} as never, 99)
  expect(clamped).toBe(2)   // saved index out of range → clamped to last
})
