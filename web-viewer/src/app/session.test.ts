import { initialState, reducer } from './session'
import { flattenSteps } from './steps'
import type { Runtime } from '../renderer/types'

const opt = {
  input_data_type: 'choice', measurement_type: 'ordinal', selection: 'single',
  options: [{ index: 1, value: 0 }],
  content: { en: { options: [{ index: 1, text: 'A' }] } },
}
const runtime: Runtime = {
  provenance: {}, metadata: { id: 'qst_x', title: 'T', language: 'en' }, locale: 'en',
  pages: [
    { id: 'p1', elements: [{ id: 'it_1', question: { prompt: { content: { en: { text: 'Q1' } } } }, option: opt, required: true }] },
    { id: 'p2', elements: [{ id: 'it_2', question: { prompt: { content: { en: { text: 'Q2' } } } }, option: opt }] },
  ],
}
const booted = reducer(initialState, {
  type: 'boot_success',
  session: { id: 's1', token: 't1' }, runtime, theme: null, steps: flattenSteps(runtime),
})

test('boot_success → ready at step 0', () => {
  expect(booted.phase).toBe('ready')
  expect(booted.stepIndex).toBe(0)
})
test('next blocked by required gating, records stepErrors', () => {
  const s = reducer(booted, { type: 'next' })
  expect(s.stepIndex).toBe(0)
  expect(s.stepErrors).toEqual(['it_1'])
})
test('answer clears that error; next then advances', () => {
  let s = reducer(booted, { type: 'next' })
  s = reducer(s, { type: 'answer', key: 'it_1', value: 0 })
  expect(s.stepErrors).toEqual([])
  s = reducer(s, { type: 'next' })
  expect(s.stepIndex).toBe(1)
})
test('next past the last step → finishing', () => {
  let s = reducer(booted, { type: 'answer', key: 'it_1', value: 0 })
  s = reducer(s, { type: 'next' })
  s = reducer(s, { type: 'next' })
  expect(s.phase).toBe('finishing')
})
test('submitted / submit_failed / submit_retry drive the finishing machine', () => {
  let s = reducer(booted, { type: 'answer', key: 'it_1', value: 0 })
  s = reducer(s, { type: 'next' }); s = reducer(s, { type: 'next' })
  expect(s.phase).toBe('finishing')
  expect(s.submitError).toBe(false)
  expect(reducer(s, { type: 'submitted' }).phase).toBe('finished')
  const failed = reducer(s, { type: 'submit_failed' })
  expect(failed.phase).toBe('finishing')
  expect(failed.submitError).toBe(true)
  expect(reducer(failed, { type: 'submit_retry' }).submitError).toBe(false)
})
test('back preserves answers and never goes below 0', () => {
  let s = reducer(booted, { type: 'answer', key: 'it_1', value: 0 })
  s = reducer(s, { type: 'next' })
  s = reducer(s, { type: 'back' })
  expect(s.stepIndex).toBe(0)
  expect(s.answers).toEqual({ it_1: 0 })
  expect(reducer(s, { type: 'back' }).stepIndex).toBe(0)
})
test('boot_error → error phase with kind/code', () => {
  const s = reducer(initialState, { type: 'boot_error', kind: 'closed', code: 'gone' })
  expect(s.phase).toBe('error')
  expect(s.error).toEqual({ kind: 'closed', code: 'gone' })
})
test('goto pushes current index to visited and sets target; back pops it', () => {
  let s = reducer(booted, { type: 'goto', index: 3 })
  expect(s.stepIndex).toBe(3); expect(s.visited).toEqual([0])
  s = reducer(s, { type: 'goto', index: 5 }); expect(s.visited).toEqual([0, 3])
  s = reducer(s, { type: 'back' }); expect(s.stepIndex).toBe(3); expect(s.visited).toEqual([0])
})
test('goto with index null → finishing', () => {
  expect(reducer(booted, { type: 'goto', index: null }).phase).toBe('finishing')
})
test('validation_errors sets the channel; answering a key clears its error', () => {
  let s = reducer(booted, { type: 'validation_errors', errors: [{ key: 'it_1', message: 'bad' }] })
  expect(s.validationErrors).toEqual([{ key: 'it_1', message: 'bad' }])
  s = reducer(s, { type: 'answer', key: 'it_1', value: 0 })
  expect(s.validationErrors).toEqual([])
})
