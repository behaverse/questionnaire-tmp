export type Actor = { objectType: string; id: string; name?: string }
export type BdmEvent = {
  timestamp: string
  actor: Actor
  verb: string
  object: { objectType: string; id: string; name?: string }
  result?: { extensions: Record<string, unknown> }
  context?: { extensions: Record<string, unknown> }
}
export type EventContext = { sessionId: string; trialIndex?: string }

export const engineActor = (id: string): Actor => ({ objectType: 'bdm:Engine', id })
export const agentActor = (id: string): Actor => ({ objectType: 'bdm:Agent', id })

const ctxExt = (c: EventContext) => ({
  context: { extensions: { 'bdm:session_id': c.sessionId, ...(c.trialIndex ? { 'bdm:trial_index': c.trialIndex } : {}) } },
})
const runtimeObj = (sessionId: string) => ({ objectType: 'bdm:RuntimeInstance', id: sessionId })

export const ev = {
  initialized: (a: Actor, sid: string, ts: string): BdmEvent => ({ timestamp: ts, actor: a, verb: 'bdm:initialized', object: runtimeObj(sid), ...ctxExt({ sessionId: sid }) }),
  started: (a: Actor, sid: string, ts: string): BdmEvent => ({ timestamp: ts, actor: a, verb: 'bdm:started', object: runtimeObj(sid), ...ctxExt({ sessionId: sid }) }),
  trialStarted: (a: Actor, trialId: string, c: EventContext, ts: string): BdmEvent => ({ timestamp: ts, actor: a, verb: 'bdm:trial_started', object: { objectType: 'bdm:Trial', id: trialId }, ...ctxExt(c) }),
  presented: (a: Actor, stimulusId: string, name: string, c: EventContext, ts: string): BdmEvent => ({ timestamp: ts, actor: a, verb: 'bdm:presented', object: { objectType: 'bdm:Stimulus', id: stimulusId, ...(name ? { name } : {}) }, ...ctxExt(c) }),
  selected: (a: Actor, optionId: string, choiceText: string, c: EventContext, ts: string): BdmEvent => ({ timestamp: ts, actor: a, verb: 'bdm:selected', object: { objectType: 'bdm:Option', id: optionId, name: choiceText }, ...ctxExt(c) }),
  deselected: (a: Actor, optionId: string, choiceText: string, c: EventContext, ts: string): BdmEvent => ({ timestamp: ts, actor: a, verb: 'bdm:deselected', object: { objectType: 'bdm:Option', id: optionId, name: choiceText }, ...ctxExt(c) }),
  adjusted: (a: Actor, componentId: string, c: EventContext, ts: string): BdmEvent => ({ timestamp: ts, actor: a, verb: 'bdm:adjusted', object: { objectType: 'bdm:UIComponent', id: componentId }, ...ctxExt(c) }),
  typed: (a: Actor, componentId: string, c: EventContext, ts: string): BdmEvent => ({ timestamp: ts, actor: a, verb: 'bdm:typed', object: { objectType: 'bdm:UIComponent', id: componentId }, ...ctxExt(c) }),
  clicked: (a: Actor, buttonId: string, c: EventContext, ts: string): BdmEvent => ({ timestamp: ts, actor: a, verb: 'bdm:clicked', object: { objectType: 'bdm:UIComponent', id: buttonId }, ...ctxExt(c) }),
  navigated: (a: Actor, screenId: string, c: EventContext, ts: string): BdmEvent => ({ timestamp: ts, actor: a, verb: 'bdm:navigated', object: { objectType: 'bdm:Screen', id: screenId }, ...ctxExt(c) }),
  trialEnded: (a: Actor, trialId: string, resultExt: Record<string, unknown>, c: EventContext, ts: string): BdmEvent => ({ timestamp: ts, actor: a, verb: 'bdm:trial_ended', object: { objectType: 'bdm:Trial', id: trialId }, result: { extensions: resultExt }, ...ctxExt(c) }),
  completed: (a: Actor, sid: string, ts: string): BdmEvent => ({ timestamp: ts, actor: a, verb: 'bdm:completed', object: runtimeObj(sid), ...ctxExt({ sessionId: sid }) }),
  submitted: (a: Actor, sid: string, ts: string): BdmEvent => ({ timestamp: ts, actor: a, verb: 'bdm:submitted', object: runtimeObj(sid), ...ctxExt({ sessionId: sid }) }),
}

export class EventBatcher {
  private buf: BdmEvent[] = []
  private seq = 1
  private timer: ReturnType<typeof setTimeout> | null = null

  constructor(
    private sessionId: string,
    private onFlush: (batch: { batch_id: string; events: BdmEvent[] }) => void,
    private flushIntervalMs = 5_000,
    private maxEvents = 20,
  ) {}

  add(e: BdmEvent): void {
    this.buf.push(e)
    if (this.buf.length >= this.maxEvents) {
      this.flush()
    } else if (this.timer === null) {
      this.timer = setTimeout(() => this.flush(), this.flushIntervalMs)
    }
  }
  flush(): void {
    if (this.timer !== null) { clearTimeout(this.timer); this.timer = null }
    if (this.buf.length === 0) return
    this.onFlush({ batch_id: `${this.sessionId}:${this.seq++}`, events: this.buf.splice(0) })
  }
}
