export type ButtonState = 'up' | 'left_down' | 'right_down' | 'middle_down'
export type MouseSample = { t: number; x: number; y: number; button_state: ButtonState }
export type Point = { x: number; y: number }

/** Linear interpolation from `from` to `to`: `steps` hops ending at `to` (start excluded). */
export function interpolatePath(from: Point, to: Point, steps: number): Point[] {
  const n = Math.max(1, Math.floor(steps))
  const out: Point[] = []
  for (let i = 1; i <= n; i++) {
    const f = i / n
    out.push({ x: from.x + (to.x - from.x) * f, y: from.y + (to.y - from.y) * f })
  }
  return out
}

/** Records the bot's own pointer path as Schema-4b samples. `now()` returns ms; `t` is seconds
 *  since the first recorded sample. Coordinates are rounded to integers (Schema 4b requires int). */
export class MouseRecorder {
  private rows: MouseSample[] = []
  private t0: number | null = null
  constructor(private now: () => number) {}
  private push(p: Point, button_state: ButtonState): void {
    const ms = this.now()
    if (this.t0 === null) this.t0 = ms
    this.rows.push({ t: (ms - this.t0) / 1000, x: Math.round(p.x), y: Math.round(p.y), button_state })
  }
  moveThrough(points: Point[], button: ButtonState = 'up'): void {
    for (const p of points) this.push(p, button)
  }
  press(at: Point): void { this.push(at, 'left_down') }
  release(at: Point): void { this.push(at, 'up') }
  samples(): MouseSample[] { return [...this.rows] } // defensive copy: callers can't mutate internal state
}
