export type HostEvent =
  | { type: 'behaverse:loaded'; sessionId: string }
  | { type: 'behaverse:completed'; sessionId: string }
  | { type: 'behaverse:resize'; height: number }

type Win = { parent: unknown; self: unknown }

export function isFramed(win: Win = window as unknown as Win): boolean {
  // A top-level window is self-referential (parent === window). When embedded, the
  // parent is a different window. (Tests model the top-level case with `win.parent = win`.)
  return win.parent !== win.self && win.parent !== win
}

export function postToHost(win: Win, event: HostEvent, targetOrigin: string): void {
  if (!isFramed(win)) return
  ;(win.parent as { postMessage: (e: HostEvent, o: string) => void }).postMessage(event, targetOrigin)
}

/** Watch an element's height; report on change. Injectable ResizeObserver for tests. */
export function observeHeight(el: HTMLElement, onHeight: (h: number) => void, RO: typeof ResizeObserver = ResizeObserver): () => void {
  let last = -1
  const ro = new RO(() => {
    const h = el.scrollHeight
    if (h !== last) { last = h; onHeight(h) }
  })
  ro.observe(el)
  return () => ro.disconnect()
}
