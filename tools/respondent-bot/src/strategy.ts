import type { ChoiceStrategy, Profile } from './profile'

export type ItemView =
  | { kind: 'choice'; id: string; nOptions: number }
  | { kind: 'number'; id: string; min: number; max: number; step: number }
  | { kind: 'text'; id: string }

export type Decision =
  | { kind: 'choice'; index: number }
  | { kind: 'number'; value: number }
  | { kind: 'text'; text: string }

const clamp = (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, x))
const snap = (x: number, min: number, step: number) => (step > 0 ? min + Math.round((x - min) / step) * step : x)

/** Position on the scale in [0,1]; the single knob every non-fixed strategy turns. */
function strategyFraction(s: ChoiceStrategy, rng: () => number): number {
  switch (s) {
    case 'random': return rng()
    case 'acquiescence': return 0.7 + 0.3 * rng() // top third → above midpoint
    case 'straight_line': return 0 // same column every item
    case 'extreme': return rng() < 0.5 ? 0 : 1
    case 'midpoint': return 0.5
    case 'fixed': return rng() // fallback when the item is not in the fixed map
  }
}

export function decide(item: ItemView, profile: Profile, rng: () => number): Decision {
  if (item.kind === 'text') {
    const f = profile.fixed?.[item.id]
    return { kind: 'text', text: typeof f === 'string' ? f : profile.text }
  }
  const f = profile.fixed?.[item.id]
  if (profile.choice_strategy === 'fixed' && typeof f === 'number') {
    return item.kind === 'choice'
      ? { kind: 'choice', index: clamp(Math.round(f), 0, item.nOptions - 1) }
      : { kind: 'number', value: clamp(snap(f, item.min, item.step), item.min, item.max) }
  }
  const frac = strategyFraction(profile.choice_strategy, rng)
  if (item.kind === 'choice') {
    return { kind: 'choice', index: clamp(Math.round(frac * (item.nOptions - 1)), 0, item.nOptions - 1) }
  }
  const raw = item.min + frac * (item.max - item.min)
  return { kind: 'number', value: clamp(snap(raw, item.min, item.step), item.min, item.max) }
}

export function thinkTime(profile: Profile, rng: () => number): number {
  const { think_ms_min, think_ms_max } = profile.timing
  return Math.round(think_ms_min + rng() * (think_ms_max - think_ms_min))
}
