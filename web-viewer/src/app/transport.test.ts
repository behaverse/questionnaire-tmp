// @vitest-environment node
import { SubmissionQueue } from './transport'

const opts = (fetchImpl: typeof fetch) => ({ vsBaseUrl: 'http://vs:9', sessionId: 's1', token: 't1', fetchImpl })
const ok202 = () => new Response('{"enqueued":1}', { status: 202 })

test('serial delivery in order with bearer auth', async () => {
  const calls: [string, RequestInit][] = []
  const fetchMock = vi.fn(async (url: string, init: RequestInit) => { calls.push([url, init]); return ok202() })
  const q = new SubmissionQueue(opts(fetchMock as never))
  q.enqueue('responses', { a: 1 })
  q.enqueue('events', { b: 2 })
  await q.idle()
  expect(calls.map(([u]) => u)).toEqual([
    'http://vs:9/v1/sessions/s1/responses',
    'http://vs:9/v1/sessions/s1/events',
  ])
  expect((calls[0][1].headers as Record<string, string>).authorization).toBe('Bearer t1')
  expect(JSON.parse(calls[0][1].body as string)).toEqual({ a: 1 })
})
test('5xx retries with exponential backoff until success', async () => {
  vi.useFakeTimers()
  const fetchMock = vi.fn()
    .mockResolvedValueOnce(new Response('{}', { status: 503 }))
    .mockResolvedValueOnce(new Response('{}', { status: 503 }))
    .mockResolvedValue(ok202())
  const q = new SubmissionQueue(opts(fetchMock as never))
  q.enqueue('responses', { a: 1 })
  await vi.advanceTimersByTimeAsync(1_000)
  await vi.advanceTimersByTimeAsync(2_000)
  await q.idle()
  expect(fetchMock).toHaveBeenCalledTimes(3)
  expect(q.pendingCount).toBe(0)
  vi.useRealTimers()
})
test('422 drops the payload and continues (logged, not retried)', async () => {
  const err = vi.spyOn(console, 'error').mockImplementation(() => {})
  const fetchMock = vi.fn()
    .mockResolvedValueOnce(new Response('{"error":{"code":"invalid_submission"}}', { status: 422 }))
    .mockResolvedValue(ok202())
  const q = new SubmissionQueue(opts(fetchMock as never))
  q.enqueue('responses', { bad: true })
  q.enqueue('events', { good: true })
  await q.idle()
  expect(fetchMock).toHaveBeenCalledTimes(2)
  expect(err).toHaveBeenCalled()
  err.mockRestore()
})
test('flushKeepalive fires remaining items with keepalive and empties the queue', async () => {
  vi.useFakeTimers()
  const fetchMock = vi.fn().mockResolvedValue(new Response('{}', { status: 503 }))
  const q = new SubmissionQueue(opts(fetchMock as never))
  q.enqueue('responses', { a: 1 })
  await vi.advanceTimersByTimeAsync(0)
  fetchMock.mockClear()
  fetchMock.mockResolvedValue(ok202())
  q.flushKeepalive()
  expect(fetchMock).toHaveBeenCalledTimes(1)
  expect((fetchMock.mock.calls[0][1] as RequestInit).keepalive).toBe(true)
  expect(q.pendingCount).toBe(0)
  vi.useRealTimers()
})
