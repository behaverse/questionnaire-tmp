import { TrialClock } from './trial'

test('step timing: start on show, responseAt = last answer change, RT in seconds', () => {
  let t = 1_000_000
  const clock = new TrialClock(() => t)
  clock.stepShown(0)
  t += 3_215
  clock.answerChanged('it_1')
  t += 2_000
  const timing = clock.timingFor(0, 'it_1')
  expect(timing.responseTimeS).toBeCloseTo(3.215)
  expect(timing.trialStart).toBe(new Date(1_000_000).toISOString())
  expect(timing.responseAt).toBe(new Date(1_003_215).toISOString())
})
test('message timing: no answer event → responseAt = query time (the advance)', () => {
  let t = 50_000
  const clock = new TrialClock(() => t)
  clock.stepShown(2)
  t += 5_000
  const timing = clock.timingFor(2, 'msg_intro')
  expect(timing.responseTimeS).toBeCloseTo(5)
  expect(timing.responseAt).toBe(new Date(55_000).toISOString())
})
test('re-showing a step restarts its trial clock (new attempt timing)', () => {
  let t = 0
  const clock = new TrialClock(() => t)
  clock.stepShown(1); t += 1_000
  clock.stepShown(1); t += 500
  expect(clock.timingFor(1, 'k').responseTimeS).toBeCloseTo(0.5)
})
test('response ids are monotonic from 1', () => {
  const clock = new TrialClock(() => 0)
  expect(clock.allocateResponseId()).toBe(1)
  expect(clock.allocateResponseId()).toBe(2)
})
test('attempt tracking: first submit, unchanged skip, changed → revision chain', () => {
  const clock = new TrialClock(() => 0)
  expect(clock.attemptFor('it_1', '0')).toEqual({ kind: 'first' })
  clock.recordSubmitted('it_1', '0', 7)
  expect(clock.attemptFor('it_1', '0')).toEqual({ kind: 'unchanged' })
  expect(clock.attemptFor('it_1', '1')).toEqual({ kind: 'revision', revises: 7, revision: 2 })
  clock.recordSubmitted('it_1', '1', 9)
  expect(clock.attemptFor('it_1', '2')).toEqual({ kind: 'revision', revises: 9, revision: 3 })
})
test('message once-only tracking', () => {
  const clock = new TrialClock(() => 0)
  expect(clock.messageSubmitted('m1')).toBe(false)
  clock.markMessageSubmitted('m1')
  expect(clock.messageSubmitted('m1')).toBe(true)
})
