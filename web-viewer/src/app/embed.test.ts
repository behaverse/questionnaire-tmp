import { isFramed, postToHost, observeHeight } from './embed'

test('isFramed true only when parent differs from self', () => {
  expect(isFramed({ parent: {}, self: {} } as never)).toBe(true)
  const w = { self: {} } as { self: object; parent?: unknown }; w.parent = w
  expect(isFramed(w as never)).toBe(false)
})
test('postToHost posts to parent with the configured origin when framed', () => {
  const calls: unknown[][] = []
  const win = { parent: { postMessage: (...a: unknown[]) => calls.push(a) }, self: {} } as never
  postToHost(win, { type: 'behaverse:completed', sessionId: 's1' }, 'https://host.example')
  expect(calls[0]).toEqual([{ type: 'behaverse:completed', sessionId: 's1' }, 'https://host.example'])
})
test('postToHost no-ops when not framed', () => {
  const win = { self: {} } as { self: object; parent?: unknown }; win.parent = win
  expect(() => postToHost(win as never, { type: 'behaverse:loaded', sessionId: 's1' }, '*')).not.toThrow()
})
test('observeHeight reports content height changes via the injected observer', () => {
  const heights: number[] = []
  let cb: () => void = () => {}
  const FakeRO = class { constructor(c: () => void) { cb = c } observe() {} disconnect() {} } as unknown as typeof ResizeObserver
  const el = { scrollHeight: 420 } as HTMLElement
  const stop = observeHeight(el, (h) => heights.push(h), FakeRO)
  cb()
  expect(heights).toEqual([420])
  stop()
})
