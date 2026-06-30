export type ChoiceStrategy = 'random' | 'acquiescence' | 'straight_line' | 'extreme' | 'midpoint' | 'fixed'

export type Profile = {
  choice_strategy: ChoiceStrategy
  fixed?: Record<string, number | string>
  timing: { think_ms_min: number; think_ms_max: number }
  pointer: 'realistic' | 'minimal'
  text: string
}

export const PRESETS: Record<string, Profile> = {
  random: { choice_strategy: 'random', timing: { think_ms_min: 200, think_ms_max: 1200 }, pointer: 'realistic', text: 'No comment.' },
  acquiescence: { choice_strategy: 'acquiescence', timing: { think_ms_min: 200, think_ms_max: 900 }, pointer: 'realistic', text: 'Yes, I agree.' },
  straight_line: { choice_strategy: 'straight_line', timing: { think_ms_min: 50, think_ms_max: 200 }, pointer: 'minimal', text: 'n/a' },
  extreme: { choice_strategy: 'extreme', timing: { think_ms_min: 200, think_ms_max: 800 }, pointer: 'realistic', text: 'Strongly.' },
  midpoint: { choice_strategy: 'midpoint', timing: { think_ms_min: 200, think_ms_max: 800 }, pointer: 'realistic', text: 'Neutral.' },
}

/** mulberry32 — small, fast, seeded PRNG returning [0, 1). Pure: no Date/Math.random. */
export function makeRng(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function resolveProfile(name: string): Profile {
  const p = PRESETS[name]
  if (!p) throw new Error(`unknown profile: ${name} (known: ${Object.keys(PRESETS).join(', ')})`)
  return p
}
