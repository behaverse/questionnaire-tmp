// @vitest-environment node
import { readFileSync } from 'node:fs'
import Ajv2020 from 'ajv/dist/2020'
import addFormats from 'ajv-formats'
import { EventBatcher, agentActor, engineActor, ev } from './events'

const schema = JSON.parse(readFileSync(new URL('../../../schemas/events/schema.json', import.meta.url), 'utf8'))
const ajv = new Ajv2020({ strict: false }); addFormats(ajv)
const validate = ajv.compile(schema)

const ts = '2026-06-12T10:00:00.000Z'
const ctx = { sessionId: 's1', trialIndex: '2' }

test('builders produce schema-valid events with bdm context extensions', () => {
  const engine = engineActor('behaverse-web-viewer@v26.0611')
  const agent = agentActor('agent_ab12')
  const events = [
    ev.initialized(engine, 's1', ts),
    ev.started(engine, 's1', ts),
    ev.trialStarted(engine, 'trial_it_1', ctx, ts),
    ev.presented(engine, 'ctx_a+ins_b+pr_c', 'Little interest', ctx, ts),
    ev.selected(agent, 'opt_freq', 'Not at all', ctx, ts),
    ev.deselected(agent, 'opt_freq', 'Not at all', ctx, ts),
    ev.adjusted(agent, 'it_num', ctx, ts),
    ev.typed(agent, 'it_text', ctx, ts),
    ev.clicked(agent, 'next_button', ctx, ts),
    ev.navigated(agent, 'step_1', ctx, ts),
    ev.trialEnded(engine, 'trial_it_1', { 'bdm:response_id': 3, 'bdm:response_numeric': 0, 'bdm:response_time': 3.215 }, ctx, ts),
    ev.completed(engine, 's1', ts),
    ev.submitted(engine, 's1', ts),
  ]
  for (const e of events) {
    if (!validate(e)) throw new Error(JSON.stringify(validate.errors))
  }
  expect(events[2].context?.extensions?.['bdm:session_id']).toBe('s1')
  expect(events[2].context?.extensions?.['bdm:trial_index']).toBe('2')
  expect(events[10].result?.extensions?.['bdm:response_time']).toBeCloseTo(3.215)
})
test('batcher flushes at 20 events or 5 s, batch ids sequence, batch is schema-valid', () => {
  vi.useFakeTimers()
  const flushed: object[] = []
  const b = new EventBatcher('s1', (batch) => flushed.push(batch))
  const e = ev.started(engineActor('v@1'), 's1', ts)
  for (let i = 0; i < 20; i++) b.add(e)
  expect(flushed).toHaveLength(1)
  expect((flushed[0] as { batch_id: string }).batch_id).toBe('s1:1')
  if (!validate(flushed[0])) throw new Error(JSON.stringify(validate.errors))
  b.add(e)
  vi.advanceTimersByTime(5_000)
  expect(flushed).toHaveLength(2)
  expect((flushed[1] as { batch_id: string }).batch_id).toBe('s1:2')
  expect((flushed[1] as { events: unknown[] }).events).toHaveLength(1)
  b.flush()
  expect(flushed).toHaveLength(2)
  vi.useRealTimers()
})
test('consented + consent_declined build runtime-instance events', () => {
  const a = engineActor('web@v1')
  const c = ev.consented(a, 's1', '2026-01-01T00:00:00Z')
  expect(c.verb).toBe('bdm:consented')
  expect(c.object).toEqual({ objectType: 'bdm:RuntimeInstance', id: 's1' })
  expect(c.context?.extensions['bdm:session_id']).toBe('s1')
  const d = ev.consentDeclined(a, 's1', '2026-01-01T00:00:00Z')
  expect(d.verb).toBe('bdm:consent_declined')
  expect(d.object).toEqual({ objectType: 'bdm:RuntimeInstance', id: 's1' })
})

it('recordingStarted carries modality/sample_rate/scope on a bdm:Recording', () => {
  const e = ev.recordingStarted(engineActor('eng'), 'recording_mouse_s1', 's1',
    { modality: 'mouse', sampleRate: 6, scope: 'runtime' }, '2026-06-30T00:00:00.000Z')
  expect(e.verb).toBe('bdm:recording_started')
  expect(e.object).toEqual({ objectType: 'bdm:Recording', id: 'recording_mouse_s1' })
  expect(e.result!.extensions).toEqual({
    'bdm:recording_modality': 'mouse', 'bdm:sample_rate': 6, 'bdm:recording_scope': 'runtime' })
  expect(e.context!.extensions['bdm:session_id']).toBe('s1')
})

it('recordingEnded carries recording_url + sample_count', () => {
  const e = ev.recordingEnded(engineActor('eng'), 'recording_mouse_s1', 's1',
    { url: 'http://vs/v1/deployments/dep/recordings', sampleCount: 42 }, '2026-06-30T00:00:01.000Z')
  expect(e.verb).toBe('bdm:recording_ended')
  expect(e.result!.extensions).toEqual({
    'bdm:recording_url': 'http://vs/v1/deployments/dep/recordings', 'bdm:sample_count': 42 })
})

it('selected/deselected carry bdm:option_index when given, and omit it when not', () => {
  const a = agentActor('ag')
  const c = { sessionId: 's1' }
  const withIdx = ev.selected(a, 'opt', 'Alpha', c, 't', 2)
  expect(withIdx.result?.extensions['bdm:option_index']).toBe(2)
  const noIdx = ev.selected(a, 'opt', 'Alpha', c, 't')
  expect(noIdx.result).toBeUndefined()
  expect(ev.deselected(a, 'opt', 'Alpha', c, 't', 3).result?.extensions['bdm:option_index']).toBe(3)
})
