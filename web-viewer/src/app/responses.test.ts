// @vitest-environment node
import { readFileSync } from 'node:fs'
import Ajv2020 from 'ajv/dist/2020'
import addFormats from 'ajv-formats'
import { buildRuntimeIndex, buildItemRow, buildMessageRow, stimulusFor } from './responses'
import type { Runtime, ItemElement } from '../renderer/types'
import { makeFakeEvaluator } from '../logic/evaluator'

const schema = JSON.parse(readFileSync(new URL('../../../schemas/response/schema.json', import.meta.url), 'utf8'))
const ajv = new Ajv2020({ strict: false }); addFormats(ajv)
const validate = ajv.compile(schema)
const assertValid = (row: object) => {
  if (!validate(row)) throw new Error(JSON.stringify(validate.errors, null, 2))
}

const identity = { sessionId: '550e8400-e29b-41d4-a716-446655440000', agentId: 'agent_ab12', sessionIndex: 1, instrumentId: 'qst_mini', language: 'en' }
const opt = {
  id: 'opt_freq', input_data_type: 'choice', measurement_type: 'ordinal', selection: 'single',
  options: [{ index: 1, value: 0 }, { index: 2, value: 1 }],
  content: { en: { options: [{ index: 1, text: 'Not at all' }, { index: 2, text: 'Several days' }] } },
}
const item: ItemElement = {
  id: 'it_1',
  question: {
    context: { id: 'ctx_a', content: { en: { text: 'Over the last 2 weeks' } } },
    instruction: { id: 'ins_b', content: { en: { text: 'Pick one' } } },
    prompt: { id: 'pr_c', content: { en: { text: 'Little interest' } } },
  },
  option: opt,
}
const runtime: Runtime = {
  provenance: {}, metadata: { id: 'qst_mini', title: 'T', language: 'en' }, locale: 'en',
  blocks: [{ id: 'blk_main', page_ids: ['p1'] }] as never,
  pages: [
    { id: 'p1', elements: [{ id: 'msg_intro', content: { en: { text: 'Welcome' } } }, item] },
    { id: 'p2', elements: [{ id: 'sec_m', shared_option: opt, elements: [{ id: 'it_a', question: { prompt: { content: { en: { text: 'Row A' } } } }, option: opt }] }] },
  ],
}
const timing = { trialStart: '2026-06-12T10:00:00.000Z', responseAt: '2026-06-12T10:00:03.215Z', responseTimeS: 3.215 }

test('stimulusFor: canonical ctx+ins+pr order, composite type, joined description', () => {
  expect(stimulusFor(item, 'it_1', 'en')).toEqual({
    stimulus_id: 'ctx_a+ins_b+pr_c',
    stimulus_type: 'composite',
    stimulus_description: 'Over the last 2 weeks Pick one Little interest',
  })
  const promptOnly = { ...item, question: { prompt: item.question.prompt } }
  expect(stimulusFor(promptOnly, 'k', 'en').stimulus_type).toBe('text')
  expect(stimulusFor(promptOnly, 'k', 'en').stimulus_id).toBe('pr_c')
  expect(stimulusFor({ id: 'msg_intro', content: { en: { text: 'Welcome' } } }, 'msg_intro', 'en')).toEqual({
    stimulus_id: 'msg_intro', stimulus_type: 'instruction', stimulus_description: 'Welcome',
  })
})
test('buildRuntimeIndex: page/trial positions; matrix rows share the section trial_index with row metadata', () => {
  const idx = buildRuntimeIndex(runtime)
  expect(idx.get('msg_intro')).toMatchObject({ pageIndex: 1, pageId: 'p1', trialIndex: '1', timelineId: 'blk_main' })
  expect(idx.get('it_1')).toMatchObject({ pageIndex: 1, trialIndex: '2' })
  expect(idx.get('it_a')).toMatchObject({ pageIndex: 2, trialIndex: '1', sectionId: 'sec_m', rowIndex: 0 })
})
test('single-choice item row is Schema-5 valid with the full field mapping', () => {
  const idx = buildRuntimeIndex(runtime)
  const row = buildItemRow({ identity, index: idx.get('it_1')!, responseId: 3, timing }, item, 0, 'en')
  assertValid(row)
  expect(row).toMatchObject({
    response_id: 3, agent_id: 'agent_ab12', session_index: 1, session_id: identity.sessionId,
    instrument_id: 'qst_mini', language: 'en', multitask_type: '', transformation_name: 'identity',
    activity_index: 1, instrument_repetition: 0, timeline_id: 'blk_main',
    block_index: 1, block_name: 'p1', block_type: 'test', trial_index: '2',
    trial_start_datetime: timing.trialStart,
    stimulus_id: 'ctx_a+ins_b+pr_c', stimulus_type: 'composite',
    option_id: 'opt_freq', option_data_type: 'choice', measurement_type: 'ordinal', option_count: 2,
    response_option_index: 1, response_numeric: 0, response_description: 'Not at all',
    response_datetime: timing.responseAt, response_time: 3.215,
  })
})
test('attempt fields ride the x_ escape hatch and stay schema-valid', () => {
  const idx = buildRuntimeIndex(runtime)
  const row = buildItemRow({ identity, index: idx.get('it_1')!, responseId: 9, timing, attempt: { revises: 3, revision: 2 } }, item, 1, 'en')
  assertValid(row)
  expect(row).toMatchObject({ x_response_revises: 3, x_response_revision: 2, response_numeric: 1 })
})
test('multi-select, number, text mappings are schema-valid', () => {
  const idx = buildRuntimeIndex(runtime)
  const multi = { ...item, option: { ...opt, measurement_type: 'nominal', selection: 'multiple' } }
  const m = buildItemRow({ identity, index: idx.get('it_1')!, responseId: 1, timing }, multi, [0, 1], 'en')
  assertValid(m)
  expect(m).toMatchObject({ response_count: 2, response_description: 'Not at all; Several days' })
  expect(JSON.parse(m.additional_measures as string)).toEqual({ values: [0, 1], indices: [1, 2] })

  const num = { ...item, option: { id: 'opt_n', input_data_type: 'number', measurement_type: 'ratio' } }
  const n = buildItemRow({ identity, index: idx.get('it_1')!, responseId: 2, timing }, num, 7.5, 'en')
  assertValid(n)
  expect(n).toMatchObject({ response_numeric: 7.5, option_data_type: 'number' })
  expect(n.response_option_index).toBeUndefined()

  const txt = { ...item, option: { id: 'opt_t', input_data_type: 'text', measurement_type: 'nominal' } }
  const t = buildItemRow({ identity, index: idx.get('it_1')!, responseId: 4, timing }, txt, 'hello', 'en')
  assertValid(t)
  expect(t).toMatchObject({ response_description: 'hello' })
})
test('matrix row carries section metadata in additional_measures', () => {
  const idx = buildRuntimeIndex(runtime)
  const rowItem = (runtime.pages[1].elements[0] as { elements: ItemElement[] }).elements[0]
  const row = buildItemRow({ identity, index: idx.get('it_a')!, responseId: 5, timing }, rowItem, 1, 'en')
  assertValid(row)
  expect(JSON.parse(row.additional_measures as string)).toMatchObject({ section_id: 'sec_m', row_index: 0 })
})
test('message row: acknowledged trial with RT, no response_skipped (owner F3)', () => {
  const idx = buildRuntimeIndex(runtime)
  const row = buildMessageRow({ identity, index: idx.get('msg_intro')!, responseId: 1, timing }, runtime.pages[0].elements[0], 'en', 'click')
  assertValid(row)
  expect(row).toMatchObject({
    block_type: 'instruction', stimulus_type: 'instruction', stimulus_id: 'msg_intro',
    response_description: 'acknowledged', input_action_type: 'click', response_time: 3.215,
  })
  expect(row.response_skipped).toBeUndefined()
})
test('x_summary_rt off: timing fields without response_time', () => {
  const idx = buildRuntimeIndex(runtime)
  const noRt = { ...timing, responseTimeS: null }
  const row = buildItemRow({ identity, index: idx.get('it_1')!, responseId: 1, timing: noRt }, item, 0, 'en')
  assertValid(row)
  expect(row.response_time).toBeUndefined()
  expect(row.response_datetime).toBe(timing.responseAt)
})
test('buildItemRow includes post-reversal score and Solution correct when scoring is provided', () => {
  const ev = makeFakeEvaluator()
  const idx = buildRuntimeIndex(runtime)
  const revItem = { ...item,
    question: { ...item.question, prompt: { ...item.question.prompt, reversed: true } },
    option: { ...opt, options: [{ index: 1, value: 0 }, { index: 2, value: 6 }] },
    solution: { expected_response: 0 } }
  const row = buildItemRow(
    { identity, index: idx.get('it_1')!, responseId: 1, timing, scoring: { evaluator: ev } },
    revItem as never, 0, 'en')
  assertValid(row)
  expect(row.score).toBe(6)        // reversed 0 in 0..6 → 6 (Schema 5 `score` field)
  expect(row.correct).toBe(true)   // raw value 0 vs expected 0 → equals true (correct uses raw value)
})
test('no scoring context → no score/correct fields', () => {
  const idx = buildRuntimeIndex(runtime)
  const row = buildItemRow({ identity, index: idx.get('it_1')!, responseId: 1, timing }, item, 0, 'en')
  assertValid(row)
  expect(row.score).toBeUndefined()
  expect(row.correct).toBeUndefined()
})
