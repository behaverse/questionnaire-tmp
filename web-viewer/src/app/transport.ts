export type SubmissionKind = 'responses' | 'events' | 'recordings'
type QueueItem = { kind: SubmissionKind; payload: object }
type Options = {
  vsBaseUrl: string
  sessionId: string
  token: string
  fetchImpl?: typeof fetch
  maxBackoffMs?: number
}

export class SubmissionQueue {
  private q: QueueItem[] = []
  private inFlight = false
  private failures = 0
  private idleResolvers: (() => void)[] = []
  private fetchImpl: typeof fetch
  private maxBackoffMs: number

  constructor(private opts: Options) {
    this.fetchImpl = opts.fetchImpl ?? fetch.bind(globalThis)
    this.maxBackoffMs = opts.maxBackoffMs ?? 30_000
  }

  get pendingCount(): number {
    return this.q.length + (this.inFlight ? 1 : 0)
  }
  enqueue(kind: SubmissionKind, payload: object): void {
    this.q.push({ kind, payload })
    void this.pump()
  }
  idle(): Promise<void> {
    if (this.pendingCount === 0) return Promise.resolve()
    return new Promise((resolve) => this.idleResolvers.push(resolve))
  }
  /** Best-effort final flush (pagehide): fire everything with keepalive, optimistically clear. */
  flushKeepalive(): void {
    for (const item of this.q.splice(0)) {
      void this.fetchImpl(this.url(item.kind), this.init(item.payload, true)).catch(() => {})
    }
    this.settleIdle()
  }

  private url(kind: SubmissionKind): string {
    return `${this.opts.vsBaseUrl}/v1/sessions/${this.opts.sessionId}/${kind}`
  }
  private init(payload: object, keepalive = false): RequestInit {
    return {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${this.opts.token}` },
      body: JSON.stringify(payload),
      ...(keepalive ? { keepalive: true } : {}),
    }
  }
  private settleIdle(): void {
    if (this.pendingCount > 0) return
    for (const r of this.idleResolvers.splice(0)) r()
  }
  private async pump(): Promise<void> {
    if (this.inFlight) return
    const item = this.q[0]
    if (!item) { this.settleIdle(); return }
    this.inFlight = true
    let outcome: 'done' | 'retry' = 'retry'
    try {
      const r = await this.fetchImpl(this.url(item.kind), this.init(item.payload))
      if (r.status === 422) {
        console.error('web-viewer: submission rejected by VS (dropped)', await r.text().catch(() => ''))
        outcome = 'done'
      } else if (r.ok) {
        outcome = 'done'
      }
    } catch {
      outcome = 'retry'
    }
    this.inFlight = false
    if (outcome === 'done') {
      this.q.shift()
      this.failures = 0
      this.settleIdle()
      void this.pump()
    } else {
      this.failures += 1
      const delay = Math.min(1_000 * 2 ** (this.failures - 1), this.maxBackoffMs)
      setTimeout(() => void this.pump(), delay)
    }
  }
}
