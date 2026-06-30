export type ButtonState = 'up' | 'left_down' | 'right_down' | 'middle_down'
export type MouseSample = { t: number; x: number; y: number; button_state: ButtonState }

const DOWN_BY_BUTTON: Record<number, ButtonState> = { 0: 'left_down', 1: 'middle_down', 2: 'right_down' }

/** Captures the participant's mouse as Schema-4b samples. mousemove is throttled to `sampleRateHz`;
 *  mousedown/up are always captured. `now()`/`target` are injected for tests. */
export class MouseCapture {
  private readonly hz: number
  private readonly maxSamples: number
  private readonly now: () => number
  private readonly target: EventTarget
  private rows: MouseSample[] = []
  private t0 = 0
  private lastAt = -Infinity
  private button: ButtonState = 'up'
  private active = false

  constructor(opts: { sampleRateHz?: number; maxSamples?: number; now?: () => number; target?: EventTarget } = {}) {
    this.hz = opts.sampleRateHz ?? 6
    this.maxSamples = opts.maxSamples ?? 50_000
    this.now = opts.now ?? (() => performance.now())
    this.target = opts.target ?? window
  }

  get sampleRateHz(): number { return this.hz }

  private onMove = (e: Event) => {
    const me = e as MouseEvent
    if (this.now() - this.lastAt < 1000 / this.hz) return
    this.push(me.clientX, me.clientY)
  }
  private onDown = (e: Event) => {
    const me = e as MouseEvent
    this.button = DOWN_BY_BUTTON[me.button] ?? 'left_down'
    this.push(me.clientX, me.clientY)
  }
  private onUp = (e: Event) => {
    const me = e as MouseEvent
    this.button = 'up'
    this.push(me.clientX, me.clientY)
  }

  private push(x: number, y: number): void {
    if (!this.active || this.rows.length >= this.maxSamples) return
    const t = this.now()
    this.lastAt = t
    this.rows.push({ t: (t - this.t0) / 1000, x: Math.round(x), y: Math.round(y), button_state: this.button })
  }

  start(): void {
    if (this.active) return
    this.active = true
    this.t0 = this.now()
    this.lastAt = -Infinity
    this.target.addEventListener('mousemove', this.onMove, true)
    this.target.addEventListener('mousedown', this.onDown, true)
    this.target.addEventListener('mouseup', this.onUp, true)
  }

  stop(): MouseSample[] {
    if (this.active) {
      this.active = false
      this.target.removeEventListener('mousemove', this.onMove, true)
      this.target.removeEventListener('mousedown', this.onDown, true)
      this.target.removeEventListener('mouseup', this.onUp, true)
    }
    return this.rows
  }
}
