# Respondent-bot (#8) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A configurable CLI bot (`tools/respondent-bot/`) that drives a real web-viewer run end-to-end, choosing answers per a seeded trait model, and tees the emitted `bdm:` event statements into a portable `trace.json` for #7 replay.

**Architecture:** Standalone Node+TypeScript package. Pure trait model (`profile.ts` + `strategy.ts`) decides answers from a normalized `ItemView`; a `Driver` (Playwright `UiDriver` default, `DirectDriver` fast lane) reads controls off the rendered page by ARIA role and applies decisions; `runner.ts` orchestrates one run (consent → answer-each-step → finish); `trace.ts` flattens captured event POST bodies. The integration test route-mocks the Viewer Service so a real `?deployment=` **capture** pipeline runs fully offline and its event POSTs are observable.

**Tech Stack:** Node ≥20, TypeScript (ESM), Vitest (unit), @playwright/test (integration), tsx (run the CLI).

## Global Constraints

- **Home:** all new code under `tools/respondent-bot/`. Do not modify `web-viewer/`, `viewer-service/`, `questionnaire-harvester/`, or `library/`.
- **Branch:** `work/respondent-bot`. No PRs — merge to `master` + push. `git fetch origin` + ff/rebase before every push (shared checkout).
- **`bdm:` namespace:** the bot is a non-human actor; reuse the existing `bdm:Agent` actor concept. Do not introduce raw xAPI/Schema.org verbs. Trace statements are surfaced **as-is** from the player.
- **Determinism:** identical `--seed` + `--profile` ⇒ identical decisions. No `Date.now()`/`Math.random()` in `profile.ts`/`strategy.ts` — use the seeded RNG.
- **Copy:** em-dashes with no surrounding spaces; concise.
- **Player DOM contract (verified) the driver targets by ARIA role:**
  - choice + number-rating → `role="radiogroup"` containing `role="radio"` (document order = scale order; pick the index-th radio).
  - continuous number → `role="slider"` (`<input type=range>` with `min`/`max`).
  - unbounded number → `role="spinbutton"` (`<input type=number>`).
  - text → `role="textbox"`.
  - nav → `getByRole('button', { name: 'Next' })` / `'Back'`; consent → buttons `'I agree'` / `'I do not agree'`; finished → `<h1>` `'Thank you!'` (en) / `'Obrigado!'` (pt).
  - **Unsupported in v1** (fail loudly, never skip): `role="group"` checkbox multi-select + matrix.
- **Capture-pipeline endpoints to route-mock in the integration test** (`{vs}` = mocked base): `POST /v1/sessions/new` (mint), `POST /v1/sessions/{id}/events`, `POST /v1/sessions/{id}/responses`, `POST /v1/sessions/{id}/complete`, `POST /v1/sessions/{id}/scorer_outputs`. Only `?deployment=` runs use the real transport; `?fixture=`/`?preview=` use a stub transport that emits nothing over the network.

---

### Task 1: Scaffold package + seeded profile model

**Files:**
- Create: `tools/respondent-bot/package.json`
- Create: `tools/respondent-bot/tsconfig.json`
- Create: `tools/respondent-bot/vitest.config.ts`
- Create: `tools/respondent-bot/.gitignore`
- Create: `tools/respondent-bot/src/profile.ts`
- Test: `tools/respondent-bot/src/profile.test.ts`

**Interfaces:**
- Produces: `type ChoiceStrategy = 'random'|'acquiescence'|'straight_line'|'extreme'|'midpoint'|'fixed'`; `type Profile = { choice_strategy: ChoiceStrategy; fixed?: Record<string, number|string>; timing: { think_ms_min: number; think_ms_max: number }; pointer: 'realistic'|'minimal'; text: string }`; `PRESETS: Record<string, Profile>`; `makeRng(seed: number): () => number`; `resolveProfile(name: string): Profile`.

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "@behaverse/respondent-bot",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "bin": { "respondent-bot": "src/cli.ts" },
  "scripts": {
    "start": "tsx src/cli.ts",
    "test": "vitest run",
    "test:watch": "vitest",
    "e2e": "playwright test",
    "typecheck": "tsc -p tsconfig.json --noEmit"
  },
  "devDependencies": {
    "@playwright/test": "^1.49.0",
    "@types/node": "^25.9.3",
    "tsx": "^4.19.2",
    "typescript": "^5.7.2",
    "vitest": "^2.1.8"
  }
}
```

- [ ] **Step 2: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "lib": ["ES2022", "DOM"],
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "types": ["node"]
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Create `vitest.config.ts` and `.gitignore`**

`vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config'
// e2e specs run under Playwright, not Vitest.
export default defineConfig({ test: { include: ['src/**/*.test.ts'], exclude: ['tests/e2e/**'] } })
```

`.gitignore`:
```
node_modules/
test-results/
playwright-report/
*.trace.json
tests/e2e/screenshots/
```

- [ ] **Step 4: Install deps**

Run: `cd tools/respondent-bot && npm install`
Expected: `node_modules/` created; `@playwright/test`, `tsx`, `vitest` present. (Playwright chromium is already installed system-wide.)

- [ ] **Step 5: Write the failing test** — `src/profile.test.ts`

```ts
import { describe, expect, it } from 'vitest'
import { makeRng, resolveProfile, PRESETS } from './profile'

describe('makeRng', () => {
  it('is deterministic for a seed', () => {
    const a = makeRng(42); const b = makeRng(42)
    const seqA = [a(), a(), a()]; const seqB = [b(), b(), b()]
    expect(seqA).toEqual(seqB)
    expect(seqA.every((x) => x >= 0 && x < 1)).toBe(true)
  })
  it('differs across seeds', () => {
    expect(makeRng(1)()).not.toEqual(makeRng(2)())
  })
})

describe('resolveProfile', () => {
  it('returns a built-in preset', () => {
    expect(resolveProfile('acquiescence').choice_strategy).toBe('acquiescence')
  })
  it('throws on an unknown name, listing the known ones', () => {
    expect(() => resolveProfile('nope')).toThrow(/unknown profile.*random/)
  })
  it('every preset has timing + text', () => {
    for (const p of Object.values(PRESETS)) {
      expect(p.timing.think_ms_max).toBeGreaterThanOrEqual(p.timing.think_ms_min)
      expect(typeof p.text).toBe('string')
    }
  })
})
```

- [ ] **Step 6: Run test to verify it fails**

Run: `cd tools/respondent-bot && npx vitest run src/profile.test.ts`
Expected: FAIL — cannot find `./profile`.

- [ ] **Step 7: Write `src/profile.ts`**

```ts
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
```

- [ ] **Step 8: Run test to verify it passes**

Run: `cd tools/respondent-bot && npx vitest run src/profile.test.ts`
Expected: PASS (all cases).

- [ ] **Step 9: Commit**

```bash
git add tools/respondent-bot/package.json tools/respondent-bot/tsconfig.json tools/respondent-bot/vitest.config.ts tools/respondent-bot/.gitignore tools/respondent-bot/src/profile.ts tools/respondent-bot/src/profile.test.ts
git commit -m "feat(respondent-bot): scaffold package + seeded profile model"
```

---

### Task 2: Trait model — `decide()`

**Files:**
- Create: `tools/respondent-bot/src/strategy.ts`
- Test: `tools/respondent-bot/src/strategy.test.ts`

**Interfaces:**
- Consumes: `Profile`, `ChoiceStrategy` from `./profile`.
- Produces:
  - `type ItemView = { kind:'choice'; id:string; nOptions:number } | { kind:'number'; id:string; min:number; max:number; step:number } | { kind:'text'; id:string }`
  - `type Decision = { kind:'choice'; index:number } | { kind:'number'; value:number } | { kind:'text'; text:string }`
  - `decide(item: ItemView, profile: Profile, rng: () => number): Decision`
  - `thinkTime(profile: Profile, rng: () => number): number`

A single `strategyFraction()` in `[0,1]` drives both choice index (`round(frac*(nOptions-1))`) and number value (`min+frac*(max-min)`), so every strategy is one rule tested once.

- [ ] **Step 1: Write the failing test** — `src/strategy.test.ts`

```ts
import { describe, expect, it } from 'vitest'
import { makeRng } from './profile'
import { decide, thinkTime, type ItemView } from './strategy'
import type { Profile } from './profile'

const base: Profile = { choice_strategy: 'random', timing: { think_ms_min: 100, think_ms_max: 300 }, pointer: 'minimal', text: 'hi' }
const p = (s: Profile['choice_strategy'], extra: Partial<Profile> = {}): Profile => ({ ...base, choice_strategy: s, ...extra })
const choice = (n: number): ItemView => ({ kind: 'choice', id: 'it', nOptions: n })
const number = (min: number, max: number, step = 1): ItemView => ({ kind: 'number', id: 'it', min, max, step })

describe('decide — determinism', () => {
  it('same seed + profile ⇒ same decision', () => {
    const d1 = decide(choice(5), p('random'), makeRng(7))
    const d2 = decide(choice(5), p('random'), makeRng(7))
    expect(d1).toEqual(d2)
  })
})

describe('decide — choice strategies on a 5-point scale', () => {
  it('midpoint picks the centre', () => {
    expect(decide(choice(5), p('midpoint'), makeRng(1))).toEqual({ kind: 'choice', index: 2 })
  })
  it('straight_line always picks index 0 regardless of seed', () => {
    for (const s of [1, 2, 99]) expect(decide(choice(5), p('straight_line'), makeRng(s))).toEqual({ kind: 'choice', index: 0 })
  })
  it('extreme picks an endpoint', () => {
    for (const s of [1, 2, 3, 4, 5]) {
      const d = decide(choice(5), p('extreme'), makeRng(s))
      expect(d.kind === 'choice' && (d.index === 0 || d.index === 4)).toBe(true)
    }
  })
  it('acquiescence skews to the high end (above the midpoint)', () => {
    for (const s of [1, 2, 3, 4, 5, 6]) {
      const d = decide(choice(5), p('acquiescence'), makeRng(s))
      expect(d.kind === 'choice' && d.index >= 3).toBe(true)
    }
  })
  it('random stays in range', () => {
    for (const s of [1, 2, 3, 4, 5]) {
      const d = decide(choice(5), p('random'), makeRng(s))
      expect(d.kind === 'choice' && d.index >= 0 && d.index <= 4).toBe(true)
    }
  })
})

describe('decide — number scales', () => {
  it('midpoint of 0..100 (step 1) is 50', () => {
    expect(decide(number(0, 100), p('midpoint'), makeRng(1))).toEqual({ kind: 'number', value: 50 })
  })
  it('extreme of 1..7 is an endpoint', () => {
    const d = decide(number(1, 7), p('extreme'), makeRng(2))
    expect(d.kind === 'number' && (d.value === 1 || d.value === 7)).toBe(true)
  })
  it('snaps to the step grid', () => {
    const d = decide(number(0, 10, 2), p('random'), makeRng(3))
    expect(d.kind === 'number' && d.value % 2 === 0).toBe(true)
  })
})

describe('decide — text + fixed', () => {
  it('text uses the profile text', () => {
    expect(decide({ kind: 'text', id: 'q' }, p('random', { text: 'canned' }), makeRng(1))).toEqual({ kind: 'text', text: 'canned' })
  })
  it('fixed honours a per-id choice index', () => {
    expect(decide(choice(5), p('fixed', { fixed: { it: 4 } }), makeRng(1))).toEqual({ kind: 'choice', index: 4 })
  })
  it('fixed falls back to random for an unmapped id', () => {
    const d = decide(choice(5), p('fixed', { fixed: { other: 1 } }), makeRng(1))
    expect(d.kind === 'choice' && d.index >= 0 && d.index <= 4).toBe(true)
  })
  it('fixed text overrides the profile text by id', () => {
    expect(decide({ kind: 'text', id: 'q' }, p('fixed', { fixed: { q: 'mapped' }, text: 'default' }), makeRng(1))).toEqual({ kind: 'text', text: 'mapped' })
  })
})

describe('thinkTime', () => {
  it('stays within the profile window', () => {
    for (const s of [1, 2, 3]) {
      const t = thinkTime(base, makeRng(s))
      expect(t).toBeGreaterThanOrEqual(100)
      expect(t).toBeLessThanOrEqual(300)
    }
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd tools/respondent-bot && npx vitest run src/strategy.test.ts`
Expected: FAIL — cannot find `./strategy`.

- [ ] **Step 3: Write `src/strategy.ts`**

```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd tools/respondent-bot && npx vitest run src/strategy.test.ts`
Expected: PASS (all cases).

- [ ] **Step 5: Commit**

```bash
git add tools/respondent-bot/src/strategy.ts tools/respondent-bot/src/strategy.test.ts
git commit -m "feat(respondent-bot): seeded trait model (decide + thinkTime)"
```

---

### Task 3: Trace aggregation

**Files:**
- Create: `tools/respondent-bot/src/trace.ts`
- Test: `tools/respondent-bot/src/trace.test.ts`

**Interfaces:**
- Produces:
  - `type Statement = Record<string, unknown> & { verb?: string; timestamp?: string }`
  - `type Trace = { deployment_id: string; session_id: string; statements: Statement[] }`
  - `extractEventStatements(bodies: unknown[]): Statement[]` — flatten `{batch_id, events:[...]}` bodies in order, skipping non-list `events`.
  - `buildTrace(deploymentId: string, sessionId: string, bodies: unknown[]): Trace`
  - `checkWellFormed(statements: Statement[]): { ok: boolean; reason?: string }` — non-empty; every `verb` is a `bdm:` string; timestamps non-decreasing.

- [ ] **Step 1: Write the failing test** — `src/trace.test.ts`

```ts
import { describe, expect, it } from 'vitest'
import { buildTrace, checkWellFormed, extractEventStatements } from './trace'

const body = (events: unknown) => ({ batch_id: 'b', events })

describe('extractEventStatements', () => {
  it('flattens batches in order', () => {
    const s = extractEventStatements([body([{ verb: 'bdm:initialized' }]), body([{ verb: 'bdm:selected' }, { verb: 'bdm:submitted' }])])
    expect(s.map((x) => x.verb)).toEqual(['bdm:initialized', 'bdm:selected', 'bdm:submitted'])
  })
  it('skips a batch whose events is not a list', () => {
    expect(extractEventStatements([body(null), body([{ verb: 'bdm:started' }])])).toHaveLength(1)
  })
})

describe('buildTrace', () => {
  it('wraps statements with the ids', () => {
    const t = buildTrace('dep_1', 'sess_1', [body([{ verb: 'bdm:started', timestamp: '2026-06-30T00:00:00Z' }])])
    expect(t).toEqual({ deployment_id: 'dep_1', session_id: 'sess_1', statements: [{ verb: 'bdm:started', timestamp: '2026-06-30T00:00:00Z' }] })
  })
})

describe('checkWellFormed', () => {
  it('accepts an ordered bdm: stream', () => {
    expect(checkWellFormed([{ verb: 'bdm:started', timestamp: '2026-06-30T00:00:00Z' }, { verb: 'bdm:submitted', timestamp: '2026-06-30T00:00:01Z' }]).ok).toBe(true)
  })
  it('rejects an empty stream', () => {
    expect(checkWellFormed([])).toEqual({ ok: false, reason: 'empty' })
  })
  it('rejects a non-bdm verb', () => {
    expect(checkWellFormed([{ verb: 'http://adlnet.gov/answered' }]).ok).toBe(false)
  })
  it('rejects a regressed timestamp', () => {
    const r = checkWellFormed([{ verb: 'bdm:a', timestamp: '2026-06-30T00:00:02Z' }, { verb: 'bdm:b', timestamp: '2026-06-30T00:00:01Z' }])
    expect(r).toEqual({ ok: false, reason: 'timestamp regressed' })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd tools/respondent-bot && npx vitest run src/trace.test.ts`
Expected: FAIL — cannot find `./trace`.

- [ ] **Step 3: Write `src/trace.ts`**

```ts
export type Statement = Record<string, unknown> & { verb?: string; timestamp?: string }
export type Trace = { deployment_id: string; session_id: string; statements: Statement[] }

export function extractEventStatements(bodies: unknown[]): Statement[] {
  const out: Statement[] = []
  for (const b of bodies) {
    const evs = (b as { events?: unknown } | null)?.events
    if (Array.isArray(evs)) out.push(...(evs as Statement[]))
  }
  return out
}

export function buildTrace(deploymentId: string, sessionId: string, bodies: unknown[]): Trace {
  return { deployment_id: deploymentId, session_id: sessionId, statements: extractEventStatements(bodies) }
}

export function checkWellFormed(statements: Statement[]): { ok: boolean; reason?: string } {
  if (statements.length === 0) return { ok: false, reason: 'empty' }
  let prev = ''
  for (const s of statements) {
    if (typeof s.verb !== 'string' || !s.verb.startsWith('bdm:')) return { ok: false, reason: `bad verb ${String(s.verb)}` }
    const ts = String(s.timestamp ?? '')
    if (ts && prev && ts < prev) return { ok: false, reason: 'timestamp regressed' }
    if (ts) prev = ts
  }
  return { ok: true }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd tools/respondent-bot && npx vitest run src/trace.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add tools/respondent-bot/src/trace.ts tools/respondent-bot/src/trace.test.ts
git commit -m "feat(respondent-bot): trace aggregation + well-formedness check"
```

---

### Task 4: Driver interface, runner core, and the offline integration smoke

This is the assembly task: the `Driver` interface, the Playwright `UiDriver`, the driver-agnostic `runner`, the Playwright config, and one end-to-end smoke that route-mocks the VS, drives a real `?deployment=` capture run, captures the event POSTs, asserts a well-formed trace, writes `trace.json`, and screenshots the finished screen.

**Files:**
- Create: `tools/respondent-bot/src/driver.ts`
- Create: `tools/respondent-bot/src/ui-driver.ts`
- Create: `tools/respondent-bot/src/runner.ts`
- Test (runner unit): `tools/respondent-bot/src/runner.test.ts`
- Create: `tools/respondent-bot/playwright.config.ts`
- Create: `tools/respondent-bot/tests/e2e/fixtures/mint.json` (mocked mint body)
- Test (e2e): `tools/respondent-bot/tests/e2e/smoke.spec.ts`

**Interfaces:**
- Consumes: `decide`, `thinkTime`, `ItemView`, `Decision` from `./strategy`; `Profile`, `makeRng` from `./profile`; `buildTrace`, `checkWellFormed` from `./trace`.
- Produces:
  - `interface Driver { consentIfPresent(): Promise<boolean>; atFinish(): Promise<boolean>; readItems(): Promise<ItemView[]>; apply(item: ItemView, d: Decision): Promise<void>; next(): Promise<void> }`
  - `class UiDriver implements Driver` — `new UiDriver(page: Page, opts: { locale: string; direct?: boolean })`.
  - `runOnce(driver: Driver, profile: Profile, opts: { rng: () => number; sleep: (ms: number) => Promise<void>; maxSteps?: number }): Promise<{ steps: number; finished: boolean }>`
  - `playerUrl(base: string, p: { deploymentId: string; vsBaseUrl: string; locale: string }): string`
  - `drivePlayer(page: Page, opts: { playerBase: string; deploymentId: string; vsBaseUrl: string; locale: string; profile: Profile; seed: number; direct?: boolean }): Promise<{ sessionId: string; eventBodies: unknown[]; finished: boolean; steps: number }>`

- [ ] **Step 1: Write `src/driver.ts`** (interface + the driver-agnostic runner core)

```ts
import type { Decision, ItemView, Profile } from './strategy'
import { decide, thinkTime } from './strategy'

export interface Driver {
  /** Click "I agree" if a consent gate is showing; returns whether it acted. */
  consentIfPresent(): Promise<boolean>
  /** True once a finished / declined screen is shown. */
  atFinish(): Promise<boolean>
  /** Answerable controls on the current step, in document order ([] for message-only steps). */
  readItems(): Promise<ItemView[]>
  apply(item: ItemView, decision: Decision): Promise<void>
  next(): Promise<void>
}

/** One full run: consent → (answer every item on a step → think → Next) until finished. */
export async function runOnce(
  driver: Driver,
  profile: Profile,
  opts: { rng: () => number; sleep: (ms: number) => Promise<void>; maxSteps?: number },
): Promise<{ steps: number; finished: boolean }> {
  await driver.consentIfPresent()
  const max = opts.maxSteps ?? 300
  let steps = 0
  while (steps < max) {
    if (await driver.atFinish()) return { steps, finished: true }
    for (const item of await driver.readItems()) {
      await driver.apply(item, decide(item, profile, opts.rng))
    }
    await opts.sleep(thinkTime(profile, opts.rng))
    await driver.next()
    steps += 1
  }
  return { steps, finished: await driver.atFinish() }
}
```

- [ ] **Step 2: Write the failing runner unit test** — `src/runner.test.ts` (fake Driver, no browser)

```ts
import { describe, expect, it } from 'vitest'
import { runOnce, type Driver } from './driver'
import { makeRng, type Profile } from './profile'
import type { Decision, ItemView } from './strategy'

const profile: Profile = { choice_strategy: 'midpoint', timing: { think_ms_min: 0, think_ms_max: 0 }, pointer: 'minimal', text: 'x' }

/** A scripted driver: a list of steps, each a list of ItemViews; finishes after the last. */
class FakeDriver implements Driver {
  applied: Array<{ item: ItemView; decision: Decision }> = []
  private i = 0
  constructor(private steps: ItemView[][]) {}
  async consentIfPresent() { return false }
  async atFinish() { return this.i >= this.steps.length }
  async readItems() { return this.steps[this.i] ?? [] }
  async apply(item: ItemView, decision: Decision) { this.applied.push({ item, decision }) }
  async next() { this.i += 1 }
}

describe('runOnce', () => {
  const sleep = async () => {}
  it('answers every item on every step and stops at finish', async () => {
    const d = new FakeDriver([[{ kind: 'choice', id: 'a', nOptions: 5 }], [], [{ kind: 'text', id: 'b' }]])
    const r = await runOnce(d, profile, { rng: makeRng(1), sleep })
    expect(r.finished).toBe(true)
    expect(r.steps).toBe(3)
    expect(d.applied.map((x) => x.item.id)).toEqual(['a', 'b']) // the empty (message) step answers nothing
    expect(d.applied[0]?.decision).toEqual({ kind: 'choice', index: 2 })
  })
  it('respects maxSteps when finish never arrives', async () => {
    const never: Driver = { consentIfPresent: async () => false, atFinish: async () => false, readItems: async () => [], apply: async () => {}, next: async () => {} }
    const r = await runOnce(never, profile, { rng: makeRng(1), sleep, maxSteps: 4 })
    expect(r).toEqual({ steps: 4, finished: false })
  })
})
```

- [ ] **Step 3: Run runner unit test to verify it fails**

Run: `cd tools/respondent-bot && npx vitest run src/runner.test.ts`
Expected: FAIL — cannot find `./driver` exports (`runOnce`).

Note: Step 1 already wrote `driver.ts`; this step confirms the test imports compile and the assertions drive `runOnce`. If `driver.ts` is present the failure is only on `./runner` not existing yet — `runner.test.ts` imports only from `./driver` and `./profile`, so it should now FAIL only if `runOnce` logic is wrong. Run it; if it already PASSES, that is acceptable (the core is correct) — proceed.

- [ ] **Step 4: Write `src/ui-driver.ts`** (Playwright impl + URL builder + drivePlayer)

```ts
import type { Page } from '@playwright/test'
import type { Driver } from './driver'
import { runOnce } from './driver'
import type { Decision, ItemView, Profile } from './strategy'
import { makeRng } from './profile'

const FINISH_TITLES: Record<string, string[]> = {
  en: ['Thank you!', 'Already completed', 'You declined to take part'],
  pt: ['Obrigado!', 'Já concluído', 'Recusou a participação'],
}

export function playerUrl(base: string, p: { deploymentId: string; vsBaseUrl: string; locale: string }): string {
  const u = new URL(base)
  u.searchParams.set('deployment', p.deploymentId)
  u.searchParams.set('viewer_url', p.vsBaseUrl)
  u.searchParams.set('locale', p.locale)
  return u.toString()
}

export class UiDriver implements Driver {
  constructor(private page: Page, private opts: { locale: string; direct?: boolean }) {}

  async consentIfPresent(): Promise<boolean> {
    const agree = this.page.getByRole('button', { name: 'I agree' })
    if (await agree.isVisible().catch(() => false)) { await agree.click(); return true }
    return false
  }

  async atFinish(): Promise<boolean> {
    const titles = FINISH_TITLES[this.opts.locale.split('-')[0]] ?? FINISH_TITLES.en
    for (const name of titles) {
      if (await this.page.getByRole('heading', { name }).isVisible().catch(() => false)) return true
    }
    return false
  }

  async readItems(): Promise<ItemView[]> {
    const items: ItemView[] = []
    // choice + number-rating: any radiogroup → pick the index-th radio
    for (const rg of await this.page.getByRole('radiogroup').all()) {
      const n = await rg.getByRole('radio').count()
      if (n > 0) items.push({ kind: 'choice', id: (await rg.getAttribute('aria-label')) ?? `rg_${items.length}`, nOptions: n })
    }
    // continuous number
    for (const sl of await this.page.getByRole('slider').all()) {
      const min = Number((await sl.getAttribute('min')) ?? '0')
      const max = Number((await sl.getAttribute('max')) ?? '100')
      const step = Number((await sl.getAttribute('step')) ?? '1') || 1
      items.push({ kind: 'number', id: (await sl.getAttribute('aria-label')) ?? `sl_${items.length}`, min, max, step })
    }
    // unbounded number
    for (const sp of await this.page.getByRole('spinbutton').all()) {
      const min = Number((await sp.getAttribute('min')) ?? '0')
      const max = Number((await sp.getAttribute('max')) ?? '100')
      items.push({ kind: 'number', id: (await sp.getAttribute('aria-label')) ?? `sp_${items.length}`, min, max, step: 1 })
    }
    // free text
    for (const tb of await this.page.getByRole('textbox').all()) {
      items.push({ kind: 'text', id: (await tb.getAttribute('aria-label')) ?? `tb_${items.length}` })
    }
    // unsupported (fail loudly, never skip — a missed item corrupts the trace)
    const groups = await this.page.getByRole('group').count()
    if (groups > 0) throw new Error(`respondent-bot: unsupported control (checkbox/matrix group) on step — v1 supports radio/slider/number/text only`)
    return items
  }

  async apply(item: ItemView, decision: Decision): Promise<void> {
    if (item.kind === 'choice' && decision.kind === 'choice') {
      const radio = this.page.getByRole('radiogroup', { name: item.id }).getByRole('radio').nth(decision.index)
      if (this.opts.direct) await radio.check()
      else { await radio.scrollIntoViewIfNeeded(); await radio.hover(); await radio.click() }
      return
    }
    if (item.kind === 'number' && decision.kind === 'number') {
      const ctrl = this.page.getByRole('slider', { name: item.id }).or(this.page.getByRole('spinbutton', { name: item.id }))
      await ctrl.fill(String(decision.value))
      return
    }
    if (item.kind === 'text' && decision.kind === 'text') {
      const tb = this.page.getByRole('textbox', { name: item.id })
      if (this.opts.direct) await tb.fill(decision.text)
      else { await tb.click(); await tb.type(decision.text, { delay: 15 }) }
      return
    }
    throw new Error(`respondent-bot: decision/item kind mismatch (${item.kind} vs ${decision.kind})`)
  }

  async next(): Promise<void> {
    await this.page.getByRole('button', { name: 'Next' }).click()
  }
}

/** Set up event-POST + mint capture, drive one run, return the captured bodies. */
export async function drivePlayer(
  page: Page,
  opts: { playerBase: string; deploymentId: string; vsBaseUrl: string; locale: string; profile: Profile; seed: number; direct?: boolean },
): Promise<{ sessionId: string; eventBodies: unknown[]; finished: boolean; steps: number }> {
  const eventBodies: unknown[] = []
  let sessionId = ''
  page.on('request', (req) => {
    const url = req.url()
    if (req.method() !== 'POST') return
    if (/\/v1\/sessions\/[^/]+\/events$/.test(url)) {
      try { eventBodies.push(req.postDataJSON()) } catch { /* ignore non-JSON */ }
    }
  })
  page.on('response', async (res) => {
    if (res.request().method() === 'POST' && /\/v1\/sessions\/new$/.test(res.url())) {
      try { sessionId = String((await res.json()).session_id ?? '') } catch { /* ignore */ }
    }
  })

  await page.goto(playerUrl(opts.playerBase, opts))
  const driver = new UiDriver(page, { locale: opts.locale, direct: opts.direct })
  const sleep = (ms: number) => page.waitForTimeout(ms)
  const result = await runOnce(driver, opts.profile, { rng: makeRng(opts.seed), sleep })
  // let the final completed/submitted batch flush + POST
  await page.waitForTimeout(300)
  await page.waitForLoadState('networkidle').catch(() => {})
  return { sessionId, eventBodies, finished: result.finished, steps: result.steps }
}
```

- [ ] **Step 5: Create the mocked mint body** — `tests/e2e/fixtures/mint.json`

Build it from the player's `mini` runtime so the renderer accepts it. Generate the file:

Run:
```bash
cd tools/respondent-bot && node --input-type=module -e '
import { readFileSync, writeFileSync, mkdirSync } from "node:fs"
const runtime = JSON.parse(readFileSync("../../web-viewer/src/fixtures/mini.json","utf8"))
const body = { session_id: "sess_bot_1", session_token: "tok_bot_1", agent_id: "agent_bot", session_index: 1, runtime, theme: null, ephemeral: false, participant_sub: null, consent: null, confirmation_message: null, redirect_url: null }
mkdirSync("tests/e2e/fixtures",{recursive:true})
writeFileSync("tests/e2e/fixtures/mint.json", JSON.stringify(body, null, 2))
console.log("wrote mint.json with runtime", runtime.metadata?.id)
'
```
Expected: `wrote mint.json with runtime qst_mini`.

- [ ] **Step 6: Write `playwright.config.ts`** (boots the web-viewer dev server, which serves the renderer + capture pipeline)

```ts
import { defineConfig } from '@playwright/test'
export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60_000,
  use: { baseURL: 'http://localhost:5173', headless: true },
  webServer: {
    command: 'npm --prefix ../../web-viewer run dev',
    port: 5173,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
```

- [ ] **Step 7: Write the e2e smoke** — `tests/e2e/smoke.spec.ts`

```ts
import { test, expect } from '@playwright/test'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { drivePlayer } from '../../src/ui-driver'
import { buildTrace, checkWellFormed } from '../../src/trace'
import { resolveProfile } from '../../src/profile'

const mint = readFileSync(fileURLToPath(new URL('./fixtures/mint.json', import.meta.url)), 'utf8')
const VS = 'http://vs.mock'

/** Route-mock the capture-pipeline endpoints so a real ?deployment= run works fully offline. */
async function mockVs(page: import('@playwright/test').Page) {
  await page.route('**/v1/sessions/new', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: mint }))
  await page.route('**/v1/sessions/*/events', (r) => r.fulfill({ status: 202, contentType: 'application/json', body: '{}' }))
  await page.route('**/v1/sessions/*/responses', (r) => r.fulfill({ status: 202, contentType: 'application/json', body: '{}' }))
  await page.route('**/v1/sessions/*/complete', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '{}' }))
  await page.route('**/v1/sessions/*/scorer_outputs', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '{}' }))
}

test('bot drives a deployment run to finish and emits a well-formed bdm: trace', async ({ page }) => {
  await mockVs(page)
  const res = await drivePlayer(page, {
    playerBase: 'http://localhost:5173/', deploymentId: 'dep_demo', vsBaseUrl: VS, locale: 'en',
    profile: resolveProfile('acquiescence'), seed: 42,
  })

  expect(res.finished).toBe(true)
  expect(res.sessionId).toBe('sess_bot_1')

  const trace = buildTrace('dep_demo', res.sessionId, res.eventBodies)
  const verdict = checkWellFormed(trace.statements)
  expect(verdict).toEqual({ ok: true })
  // the run produced a real interaction stream: at minimum started → selected → submitted
  const verbs = new Set(trace.statements.map((s) => s.verb))
  expect(verbs.has('bdm:started')).toBe(true)
  expect(verbs.has('bdm:submitted')).toBe(true)

  mkdirSync('tests/e2e/screenshots', { recursive: true })
  writeFileSync('tests/e2e/screenshots/trace.json', JSON.stringify(trace, null, 2))
  await page.screenshot({ path: 'tests/e2e/screenshots/respondent-bot-finished.png', fullPage: true })
})

test('direct-mode run also finishes and emits a trace', async ({ page }) => {
  await mockVs(page)
  const res = await drivePlayer(page, {
    playerBase: 'http://localhost:5173/', deploymentId: 'dep_demo', vsBaseUrl: VS, locale: 'en',
    profile: resolveProfile('random'), seed: 7, direct: true,
  })
  expect(res.finished).toBe(true)
  expect(checkWellFormed(buildTrace('dep_demo', res.sessionId, res.eventBodies).statements).ok).toBe(true)
})
```

Note: the `direct` test is included here so Task 5 only adds the production `direct-driver` split if profiling shows the inline `direct` flag is insufficient; the `UiDriver`'s `direct` flag already covers the fast lane. (See Task 5.)

- [ ] **Step 8: Run the e2e to verify it fails, then passes**

Run: `cd tools/respondent-bot && npx playwright test`
Expected first run (before `ui-driver.ts` is correct): FAIL. After Steps 4-7 are in place: PASS — both tests green; `tests/e2e/screenshots/respondent-bot-finished.png` + `trace.json` written.

If the slider/number `fill` does not register a value (range inputs occasionally ignore `fill`), replace the number branch of `UiDriver.apply` with a keyboard nudge:
```ts
await ctrl.focus()
await ctrl.press('Home') // → min
for (let v = item.min; v < decision.value; v += item.step) await ctrl.press('ArrowRight')
```
The `mini` fixture is all choice items, so the smoke passes either way; use the keyboard form only if a slider instrument later fails.

- [ ] **Step 9: Run the full unit suite**

Run: `cd tools/respondent-bot && npx vitest run`
Expected: PASS (profile, strategy, trace, runner).

- [ ] **Step 10: Commit**

```bash
git add tools/respondent-bot/src/driver.ts tools/respondent-bot/src/ui-driver.ts tools/respondent-bot/src/runner.test.ts tools/respondent-bot/playwright.config.ts tools/respondent-bot/tests/e2e/fixtures/mint.json tools/respondent-bot/tests/e2e/smoke.spec.ts
git commit -m "feat(respondent-bot): Playwright UI driver + runner + offline capture smoke"
```

---

### Task 5: `--direct` confirmation + driver selection note

The fast lane is already implemented as the `UiDriver` `direct` flag (no pointer motion: `.check()`/`.fill()` instead of `hover`+`click`/`type`), and the second e2e test exercises it. This task makes the selection explicit and documents why there is no separate `DirectDriver` class.

**Files:**
- Modify: `tools/respondent-bot/src/ui-driver.ts` (add a short doc comment above `UiDriver`)

**Interfaces:**
- Consumes: existing `UiDriver`.
- Produces: no new exports.

- [ ] **Step 1: Add the doc comment**

Above `export class UiDriver` in `src/ui-driver.ts`, add:
```ts
/**
 * The one Playwright driver. `direct: false` (default) uses real pointer motion
 * (scroll → hover → click) and per-character typing for realistic traces; `direct: true`
 * is the fast lane (`.check()`/`.fill()`, no pointer path) for bulk fixture generation.
 * A separate DirectDriver class is intentionally avoided — the two lanes differ only in
 * how `apply()` actuates a control, not in what they read or decide.
 */
```

- [ ] **Step 2: Typecheck**

Run: `cd tools/respondent-bot && npx tsc -p tsconfig.json --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add tools/respondent-bot/src/ui-driver.ts
git commit -m "docs(respondent-bot): document the direct fast-lane (no separate DirectDriver)"
```

---

### Task 6: CLI

**Files:**
- Create: `tools/respondent-bot/src/cli.ts`
- Test: `tools/respondent-bot/src/cli.test.ts`

**Interfaces:**
- Consumes: `resolveProfile`, `Profile` from `./profile`; `drivePlayer` from `./ui-driver`; `buildTrace`, `checkWellFormed` from `./trace`.
- Produces: `parseArgs(argv: string[]): CliOpts`; `loadProfile(value: string): Profile` (preset name, or path to a JSON profile file for `fixed`); `main(argv: string[]): Promise<number>` (exit code). `CliOpts = { player: string; deployment: string; vsBaseUrl: string; profile: string; seed: number; n: number; direct: boolean; locale: string; trace?: string }`.

- [ ] **Step 1: Write the failing test** — `src/cli.test.ts` (parse + profile-loading only; the browser path is exercised manually + by the e2e)

```ts
import { describe, expect, it } from 'vitest'
import { writeFileSync, mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { parseArgs, loadProfile } from './cli'

describe('parseArgs', () => {
  it('parses the core flags with defaults', () => {
    const o = parseArgs(['--player', 'http://localhost:5173/', '--deployment', 'dep_1'])
    expect(o.player).toBe('http://localhost:5173/')
    expect(o.deployment).toBe('dep_1')
    expect(o.profile).toBe('random')
    expect(o.seed).toBe(1)
    expect(o.n).toBe(1)
    expect(o.direct).toBe(false)
    expect(o.locale).toBe('en')
  })
  it('parses seed, n, direct, trace, locale, viewer_url', () => {
    const o = parseArgs(['--player', 'p', '--deployment', 'd', '--profile', 'acquiescence', '--seed', '42', '--n', '5', '--direct', '--locale', 'pt', '--viewer-url', 'http://vs', '--trace', 'out.json'])
    expect(o).toMatchObject({ profile: 'acquiescence', seed: 42, n: 5, direct: true, locale: 'pt', vsBaseUrl: 'http://vs', trace: 'out.json' })
  })
  it('throws when required flags are missing', () => {
    expect(() => parseArgs(['--deployment', 'd'])).toThrow(/--player/)
    expect(() => parseArgs(['--player', 'p'])).toThrow(/--deployment/)
  })
})

describe('loadProfile', () => {
  it('resolves a built-in preset by name', () => {
    expect(loadProfile('midpoint').choice_strategy).toBe('midpoint')
  })
  it('loads a JSON profile file (for fixed maps)', () => {
    const dir = mkdtempSync(join(tmpdir(), 'rb-'))
    const path = join(dir, 'p.json')
    writeFileSync(path, JSON.stringify({ choice_strategy: 'fixed', fixed: { q1: 3 }, timing: { think_ms_min: 0, think_ms_max: 0 }, pointer: 'minimal', text: 'x' }))
    const p = loadProfile(path)
    expect(p.choice_strategy).toBe('fixed')
    expect(p.fixed).toEqual({ q1: 3 })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd tools/respondent-bot && npx vitest run src/cli.test.ts`
Expected: FAIL — cannot find `./cli`.

- [ ] **Step 3: Write `src/cli.ts`**

```ts
import { chromium } from '@playwright/test'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { resolveProfile, type Profile } from './profile'
import { drivePlayer } from './ui-driver'
import { buildTrace, checkWellFormed } from './trace'

export type CliOpts = {
  player: string; deployment: string; vsBaseUrl: string; profile: string
  seed: number; n: number; direct: boolean; locale: string; trace?: string
}

export function parseArgs(argv: string[]): CliOpts {
  const get = (flag: string): string | undefined => {
    const i = argv.indexOf(flag)
    return i >= 0 && i + 1 < argv.length ? argv[i + 1] : undefined
  }
  const player = get('--player')
  const deployment = get('--deployment')
  if (!player) throw new Error('missing --player <url>')
  if (!deployment) throw new Error('missing --deployment <id>')
  return {
    player, deployment,
    vsBaseUrl: get('--viewer-url') ?? 'http://localhost:8001',
    profile: get('--profile') ?? 'random',
    seed: Number(get('--seed') ?? '1'),
    n: Number(get('--n') ?? '1'),
    direct: argv.includes('--direct'),
    locale: get('--locale') ?? 'en',
    trace: get('--trace'),
  }
}

export function loadProfile(value: string): Profile {
  if (value.endsWith('.json') || existsSync(value)) return JSON.parse(readFileSync(value, 'utf8')) as Profile
  return resolveProfile(value)
}

export async function main(argv: string[]): Promise<number> {
  const opts = parseArgs(argv)
  const profile = loadProfile(opts.profile)
  const browser = await chromium.launch({ headless: true })
  let failures = 0
  try {
    for (let i = 0; i < opts.n; i++) {
      const page = await browser.newPage()
      try {
        const res = await drivePlayer(page, {
          playerBase: opts.player, deploymentId: opts.deployment, vsBaseUrl: opts.vsBaseUrl,
          locale: opts.locale, profile, seed: opts.seed + i, direct: opts.direct,
        })
        const trace = buildTrace(opts.deployment, res.sessionId, res.eventBodies)
        const verdict = checkWellFormed(trace.statements)
        const ok = res.finished && verdict.ok
        if (!ok) { failures++; console.error(`run ${i}: FAILED (finished=${res.finished}, trace=${verdict.reason ?? 'ok'})`) }
        else console.log(`run ${i}: ok — session=${res.sessionId} steps=${res.steps} statements=${trace.statements.length}`)
        if (opts.trace) {
          const path = opts.n > 1 ? opts.trace.replace(/\.json$/, `.${i}.json`) : opts.trace
          writeFileSync(path, JSON.stringify(trace, null, 2))
        }
      } catch (e) {
        failures++; console.error(`run ${i}: ERROR — ${(e as Error).message}`)
      } finally {
        await page.close()
      }
    }
  } finally {
    await browser.close()
  }
  return failures === 0 ? 0 : 1
}

// tsx entry
const isMain = process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop() ?? '')
if (isMain || import.meta.url === `file://${process.argv[1]}`) {
  main(process.argv.slice(2)).then((code) => process.exit(code)).catch((e) => { console.error(e); process.exit(1) })
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd tools/respondent-bot && npx vitest run src/cli.test.ts`
Expected: PASS.

- [ ] **Step 5: Typecheck the whole package**

Run: `cd tools/respondent-bot && npx tsc -p tsconfig.json --noEmit`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add tools/respondent-bot/src/cli.ts tools/respondent-bot/src/cli.test.ts
git commit -m "feat(respondent-bot): CLI (arg parse, profile load, --n loop, trace out, exit code)"
```

---

### Task 7: Docs + wiring into the monorepo

**Files:**
- Create: `tools/respondent-bot/README.md`
- Create: `tools/respondent-bot/HANDOFF.md`
- Modify: `HANDOFF.md` (root) — component index row + "Verifying the whole suite"
- Modify: `web-viewer/FOLLOWUPS.md` — mark **#8 Respondent-bot** done, point to the tool

**Interfaces:** none (docs only).

- [ ] **Step 1: Write `tools/respondent-bot/README.md`**

Cover: what it is (one-paragraph), install (`npm install`; chromium already installed), the trait presets table (random / acquiescence / straight_line / extreme / midpoint / fixed), the two interaction lanes (default UI vs `--direct`), seed determinism, and runnable examples:
```bash
# one acquiescent respondent against a local open deployment, save the trace
npm start -- --player http://localhost:5173/ --deployment dep_abc \
  --viewer-url http://localhost:8001 --profile acquiescence --seed 42 --trace run.json

# five random respondents (run.0.json … run.4.json)
npm start -- --player http://localhost:5173/ --deployment dep_abc --profile random --n 5 --trace run.json

# fast lane (no pointer motion)
npm start -- --player http://localhost:5173/ --deployment dep_abc --direct
```
Document the `trace.json` shape `{ deployment_id, session_id, statements: BdmEvent[] }` (the artifact #7 replays), that traces require a real `?deployment=` run (anonymous/open or `?invite=`), v1 control support (radio/number/text; checkbox/matrix unsupported → loud error), and the operational gotchas: the target deployment's origin must be in `VS_CORS_ORIGINS`, and a deployment must be open. Use em-dashes with no surrounding spaces.

- [ ] **Step 2: Write `tools/respondent-bot/HANDOFF.md`**

Run/test commands (`npm test`, `npm run e2e`, `npm start -- …`), the file map (`profile.ts` traits, `strategy.ts` decide, `driver.ts` interface+runner, `ui-driver.ts` Playwright, `trace.ts`, `cli.ts`), what's done, and the deferred follow-ups copied from the spec (authenticated-deployment runs; a real CI harness product; load/concurrency beyond `--n`; checkbox/matrix support; browserless `--direct` via renderer-as-lib). Branch `work/respondent-bot`.

- [ ] **Step 3: Add the root HANDOFF component-index row**

In `HANDOFF.md` (root), under the "Component index" table, add after the `questionnaire-harvester` row:
```markdown
| [tools/respondent-bot/](tools/respondent-bot/HANDOFF.md) | **Respondent-bot** — drives the player to auto-answer a deployment (trait model) + emit `bdm:` traces for replay (Node/Playwright) | ✅ | `work/respondent-bot` |
```

- [ ] **Step 4: Add the suite-verification lines**

In `HANDOFF.md` (root) "Verifying the whole suite" code block, add:
```bash
( cd tools/respondent-bot && npm test )                      # respondent-bot trait model + trace (unit)
( cd tools/respondent-bot && npm run e2e )                   # respondent-bot offline capture smoke (Playwright)
```

- [ ] **Step 5: Mark #8 done in `web-viewer/FOLLOWUPS.md`**

Replace the `**#8 Respondent-bot.**` bullet's lead with a DONE note:
```markdown
- ~~**#8 Respondent-bot.**~~ **DONE (2026-06-30)** — built as a standalone tool at
  `tools/respondent-bot/` (Node + Playwright). Seeded trait model (random / acquiescence /
  straight_line / extreme / midpoint / fixed), default real-pointer UI driver + `--direct`
  fast lane, and real `?deployment=` runs that tee the `bdm:` statements into a portable
  `trace.json` (the artifact #7 replays). See its README/HANDOFF. v1 targets anonymous-capable
  deployments; authenticated + checkbox/matrix controls are deferred.
```

- [ ] **Step 6: Commit**

```bash
git add tools/respondent-bot/README.md tools/respondent-bot/HANDOFF.md HANDOFF.md web-viewer/FOLLOWUPS.md
git commit -m "docs(respondent-bot): README + HANDOFF + monorepo wiring; mark #8 done"
```

- [ ] **Step 7: Show the owner the screenshot**

Open `tools/respondent-bot/tests/e2e/screenshots/respondent-bot-finished.png` (the bot reaching the finished screen) and the generated `trace.json`, and summarise: the bot completed a run, the statement count, and the verbs captured.

---

## Self-Review

**Spec coverage:**
- Data-generator core, real-deployment trace → outbox + `trace.json` — Task 4 (capture) + Task 6 (CLI write). ✅
- Playwright UI driver default + `--direct` fast lane — Task 4 (`UiDriver` both lanes) + Task 5 (doc). ✅
- Seeded declarative trait profile + presets (random/acquiescence/straight_line/extreme/midpoint/fixed) — Tasks 1-2. ✅
- ARIA-role control reading (radiogroup/slider/spinbutton/textbox), unsupported = loud error — Task 4 `readItems`. ✅
- Anonymous-capable deployments v1; authenticated deferred — README/HANDOFF (Task 7); no auth code added. ✅
- Smoke lane / fixture backend-free run — covered more strongly by the route-mocked offline capture smoke (Task 4), which the spec's "smoke lane" intent subsumes (it asserts a real, captured trace rather than only reaching finish). The `?fixture=` path remains available via the player but is not separately tested, since the route-mocked deployment run is a strictly stronger check. ✅
- Testing: strategy unit determinism, integration well-formed stream, trace shape — Tasks 2, 3, 4. ✅
- Error handling: unsupported control loud-fail, finish-timeout (`maxSteps`), `--n` continues + non-zero exit — Tasks 4, 6. ✅

**Placeholder scan:** no TBD/TODO; all steps carry concrete code or concrete doc instructions. ✅

**Type consistency:** `ItemView`/`Decision` defined in `strategy.ts` (Task 2), re-used by `driver.ts`/`ui-driver.ts` (Task 4); `Driver`/`runOnce` defined in `driver.ts` (Task 4 Step 1), consumed by `runner.test.ts` (Task 4 Step 2) and `ui-driver.ts`; `drivePlayer` signature identical in `ui-driver.ts` and its callers (`smoke.spec.ts`, `cli.ts`); `Profile`/`makeRng`/`resolveProfile` from `profile.ts` used consistently. ✅

**Note on Task 4 Step 3:** `driver.ts` (with `runOnce`) is authored in Step 1, so the `runner.test.ts` in Step 2 may pass immediately rather than fail-first. This is an acceptable TDD deviation for an assembly task — the test still gates the runner's correctness and is run before the Playwright integration.
