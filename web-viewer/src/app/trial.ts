export type TrialTiming = { trialStart: string; responseAt: string; responseTimeS: number }
export type Attempt = { kind: 'first' } | { kind: 'unchanged' } | { kind: 'revision'; revises: number; revision: number }

export class TrialClock {
  private starts = new Map<number, number>()
  private lastAnswer = new Map<string, number>()
  private submitted = new Map<string, { value: string; responseId: number; revision: number }>()
  private messages = new Set<string>()
  private nextId = 1

  constructor(private now: () => number = Date.now) {}

  stepShown(stepIndex: number): void {
    this.starts.set(stepIndex, this.now())
  }
  answerChanged(key: string): void {
    this.lastAnswer.set(key, this.now())
  }
  timingFor(stepIndex: number, key: string): TrialTiming {
    const start = this.starts.get(stepIndex) ?? this.now()
    const at = this.lastAnswer.get(key) ?? this.now()
    return {
      trialStart: new Date(start).toISOString(),
      responseAt: new Date(at).toISOString(),
      responseTimeS: Math.max(0, (at - start) / 1000),
    }
  }
  allocateResponseId(): number {
    return this.nextId++
  }
  attemptFor(key: string, serialisedValue: string): Attempt {
    const prev = this.submitted.get(key)
    if (!prev) return { kind: 'first' }
    if (prev.value === serialisedValue) return { kind: 'unchanged' }
    return { kind: 'revision', revises: prev.responseId, revision: prev.revision + 1 }
  }
  recordSubmitted(key: string, serialisedValue: string, responseId: number): void {
    const prev = this.submitted.get(key)
    this.submitted.set(key, { value: serialisedValue, responseId, revision: (prev?.revision ?? 0) + 1 })
  }
  messageSubmitted(key: string): boolean {
    return this.messages.has(key)
  }
  markMessageSubmitted(key: string): void {
    this.messages.add(key)
  }
}
