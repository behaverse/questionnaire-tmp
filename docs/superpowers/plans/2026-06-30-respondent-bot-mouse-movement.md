# Respondent-bot mouse movement (SP1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The respondent-bot's realistic lane moves a real, visible cursor along a path to each control and clicks it, recording that motion as Schema-4b `{t,x,y,button_state}` samples in `trace.json`; `--direct` stays instant/no-movement.

**Architecture:** A new pure module `src/mouse.ts` (linear path generator + a `MouseRecorder`); `UiDriver` gains a `moveAndClick` used by the realistic lane (visible `page.mouse.move` path → real click), an injected `--show-cursor` overlay, and a `recorder`; `trace.ts` gains an optional `mouse` array; `cli.ts` gains `--show-cursor` and writes the path into the trace.

**Tech Stack:** Node + TypeScript (ESM), Vitest (unit), @playwright/test (e2e). Existing tool at `tools/respondent-bot/`.

## Global Constraints

- All changes under `tools/respondent-bot/`. Do NOT modify web-viewer/, viewer-service/, library/, questionnaire-harvester/.
- Schema 4b sample shape is FIXED: `{ t: number≥0 (seconds from recording start), x: integer, y: integer (viewport px), button_state: 'up'|'left_down'|'right_down'|'middle_down' }`, no other keys.
- Determinism in the pure module: NO `Date.now()`/`Math.random()` in `mouse.ts` — `MouseRecorder` takes an injected `now: () => number`. (`drivePlayer` supplies `() => Date.now()` at runtime; that is fine — it is not the pure module.)
- `--direct` lane does NOT move the mouse and records NO samples.
- Em-dashes with no surrounding spaces in prose/docs. Stage explicit paths only (never `git add -A`/`.`); run package commands from inside `tools/respondent-bot/`, git from the repo root.
- Branch: `work/respondent-bot-mouse` (already created). Finish by merging to master + push (no PRs).

---

### Task 1: Pure mouse path + recorder (`mouse.ts`)

**Files:**
- Create: `tools/respondent-bot/src/mouse.ts`
- Test: `tools/respondent-bot/src/mouse.test.ts`

**Interfaces:**
- Produces:
  - `type ButtonState = 'up'|'left_down'|'right_down'|'middle_down'`
  - `type MouseSample = { t: number; x: number; y: number; button_state: ButtonState }`
  - `type Point = { x: number; y: number }`
  - `interpolatePath(from: Point, to: Point, steps: number): Point[]` — `steps` hops ending at `to` (start excluded); `steps<1` clamps to 1.
  - `class MouseRecorder { constructor(now: () => number); moveThrough(points: Point[], button?: ButtonState): void; press(at: Point): void; release(at: Point): void; samples(): MouseSample[] }`

- [ ] **Step 1: Write the failing test** — `src/mouse.test.ts`

```ts
import { describe, expect, it } from 'vitest'
import { interpolatePath, MouseRecorder, type MouseSample } from './mouse'

const clock = (times: number[]) => { let i = 0; return () => times[Math.min(i++, times.length - 1)]! }

describe('interpolatePath', () => {
  it('returns `steps` points ending exactly at `to`', () => {
    const p = interpolatePath({ x: 0, y: 0 }, { x: 10, y: 0 }, 5)
    expect(p).toHaveLength(5)
    expect(p[4]).toEqual({ x: 10, y: 0 })
    expect(p[0]!.x).toBeGreaterThan(0)
    // monotonic in x
    for (let i = 1; i < p.length; i++) expect(p[i]!.x).toBeGreaterThanOrEqual(p[i - 1]!.x)
  })
  it('clamps steps below 1 to a single hop to `to`', () => {
    expect(interpolatePath({ x: 0, y: 0 }, { x: 4, y: 8 }, 0)).toEqual([{ x: 4, y: 8 }])
  })
})

describe('MouseRecorder', () => {
  it('records t relative to the first sample and rounds coords to integers', () => {
    const r = new MouseRecorder(clock([1000, 1100, 1200, 1300]))
    r.moveThrough([{ x: 0.4, y: 0.6 }, { x: 10.5, y: 20.2 }], 'up')
    r.press({ x: 10.5, y: 20.2 })
    r.release({ x: 10.5, y: 20.2 })
    expect(r.samples()).toEqual<MouseSample[]>([
      { t: 0, x: 0, y: 1, button_state: 'up' },
      { t: 0.1, x: 11, y: 20, button_state: 'up' },
      { t: 0.2, x: 11, y: 20, button_state: 'left_down' },
      { t: 0.3, x: 11, y: 20, button_state: 'up' },
    ])
  })
  it('every sample matches the Schema-4b shape', () => {
    const r = new MouseRecorder(clock([0, 1]))
    r.moveThrough([{ x: 1, y: 2 }], 'up')
    r.press({ x: 1, y: 2 })
    for (const s of r.samples()) {
      expect(Object.keys(s).sort()).toEqual(['button_state', 't', 'x', 'y'])
      expect(['up', 'left_down', 'right_down', 'middle_down']).toContain(s.button_state)
      expect(Number.isInteger(s.x) && Number.isInteger(s.y)).toBe(true)
      expect(s.t).toBeGreaterThanOrEqual(0)
    }
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd tools/respondent-bot && npx vitest run src/mouse.test.ts`
Expected: FAIL — cannot find `./mouse`.

- [ ] **Step 3: Write `src/mouse.ts`**

```ts
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
  samples(): MouseSample[] { return this.rows }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd tools/respondent-bot && npx vitest run src/mouse.test.ts`
Expected: PASS (4 assertions across 2 describes).

- [ ] **Step 5: Commit**

```bash
git add tools/respondent-bot/src/mouse.ts tools/respondent-bot/src/mouse.test.ts
git commit -m "feat(respondent-bot): pure mouse path generator + Schema-4b recorder"
```

---

### Task 2: Optional `mouse` array in the trace (`trace.ts`)

**Files:**
- Modify: `tools/respondent-bot/src/trace.ts`
- Test: `tools/respondent-bot/src/trace.test.ts` (add cases)

**Interfaces:**
- Consumes: `MouseSample` from `./mouse`.
- Produces: `Trace` gains optional `mouse?: MouseSample[]`; `buildTrace(deploymentId, sessionId, bodies, mouse?)` includes `mouse` only when a non-empty array is passed.

- [ ] **Step 1: Add the failing tests** — append these `describe` blocks to `src/trace.test.ts`

No new import is needed (the cases pass literal samples and reuse the already-imported `buildTrace`):

```ts
describe('buildTrace — mouse', () => {
  it('includes a non-empty mouse array when provided', () => {
    const t = buildTrace('dep', 'sess', [], [{ t: 0, x: 1, y: 2, button_state: 'up' }])
    expect(t.mouse).toEqual([{ t: 0, x: 1, y: 2, button_state: 'up' }])
  })
  it('omits the mouse key when no samples are passed', () => {
    expect('mouse' in buildTrace('dep', 'sess', [])).toBe(false)
    expect('mouse' in buildTrace('dep', 'sess', [], [])).toBe(false)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd tools/respondent-bot && npx vitest run src/trace.test.ts`
Expected: FAIL — `buildTrace` takes 3 args / `mouse` not on `Trace`.

- [ ] **Step 3: Edit `src/trace.ts`**

Replace the top two lines and `buildTrace`:

```ts
import type { MouseSample } from './mouse'

export type Statement = Record<string, unknown> & { verb?: string; timestamp?: string }
export type Trace = { deployment_id: string; session_id: string; statements: Statement[]; mouse?: MouseSample[] }
```

```ts
export function buildTrace(deploymentId: string, sessionId: string, bodies: unknown[], mouse?: MouseSample[]): Trace {
  const trace: Trace = { deployment_id: deploymentId, session_id: sessionId, statements: extractEventStatements(bodies) }
  if (mouse && mouse.length) trace.mouse = mouse
  return trace
}
```

(Leave `extractEventStatements` and `checkWellFormed` unchanged.)

- [ ] **Step 4: Run test to verify it passes**

Run: `cd tools/respondent-bot && npx vitest run src/trace.test.ts`
Expected: PASS (existing trace tests + the 2 new mouse cases).

- [ ] **Step 5: Commit**

```bash
git add tools/respondent-bot/src/trace.ts tools/respondent-bot/src/trace.test.ts
git commit -m "feat(respondent-bot): optional mouse path array in the trace"
```

---

### Task 3: Visible move-and-click in the realistic lane (`ui-driver.ts`) + e2e

This is the integration task: `UiDriver` moves a real cursor along a path then clicks (realistic lane), `--direct` stays instant, `drivePlayer` injects the `--show-cursor` overlay and returns the recorded samples. Verified by a new Playwright e2e.

**Files:**
- Modify: `tools/respondent-bot/src/ui-driver.ts`
- Test: `tools/respondent-bot/tests/e2e/mouse.spec.ts` (new)

**Interfaces:**
- Consumes: `interpolatePath`, `MouseRecorder`, `MouseSample`, `Point` from `./mouse`.
- Produces:
  - `UiDriver` constructor opts become `{ locale: string; direct?: boolean; recorder?: MouseRecorder }`.
  - `drivePlayer` opts gain `showCursor?: boolean`; its return type gains `mouseSamples: MouseSample[]`.

- [ ] **Step 1: Edit `ui-driver.ts` imports + constants**

At the top, add to the imports:
```ts
import { interpolatePath, MouseRecorder, type MouseSample, type Point } from './mouse'
```
After the existing `localeLabel` helper, add:
```ts
const MOVE_STEPS = 12 // pointer hops per move (visible, smooth-ish, cheap)

// Demo-only overlay: a cursor dot that follows real mouse events. pointer-events:none so it never
// intercepts clicks. Injected via addInitScript before navigation when --show-cursor is set.
const CURSOR_INIT_SCRIPT = `(() => {
  const make = () => {
    if (document.getElementById('__bot_cursor')) return
    const c = document.createElement('div')
    c.id = '__bot_cursor'
    c.style.cssText = 'position:fixed;left:0;top:0;width:22px;height:22px;margin:-11px 0 0 -11px;border:3px solid #e11d48;border-radius:50%;background:rgba(225,29,72,0.25);pointer-events:none;z-index:2147483647'
    document.body.appendChild(c)
  }
  const move = (e) => { const c = document.getElementById('__bot_cursor'); if (c) { c.style.left = e.clientX + 'px'; c.style.top = e.clientY + 'px' } }
  if (document.body) make(); else document.addEventListener('DOMContentLoaded', make)
  document.addEventListener('mousemove', move, true)
})()`
```

- [ ] **Step 2: Change the `UiDriver` opts type + add cursor position + `moveAndClick`**

Change the constructor signature:
```ts
  constructor(private page: Page, private opts: { locale: string; direct?: boolean; recorder?: MouseRecorder }) {}
  private pos: Point = { x: 0, y: 0 }

  /** Realistic actuation: move the cursor along a visible path to the target, then click it.
   *  Records the path + press/release as Schema-4b samples. Falls back to a plain click if the
   *  element has no layout box (no path recorded for that control). */
  private async moveAndClick(target: import('@playwright/test').Locator): Promise<void> {
    await target.scrollIntoViewIfNeeded().catch(() => {})
    const box = await target.boundingBox()
    if (!box) { await target.click(); return }
    const to: Point = { x: box.x + box.width / 2, y: box.y + box.height / 2 }
    for (const p of interpolatePath(this.pos, to, MOVE_STEPS)) {
      await this.page.mouse.move(p.x, p.y)
      this.opts.recorder?.moveThrough([p], 'up')
    }
    this.opts.recorder?.press(to)
    await target.click() // cursor is already at `to`; Playwright click adds actionability without a visible jump
    this.opts.recorder?.release(to)
    this.pos = to
  }
```

- [ ] **Step 3: Route choice/text/next through the lanes**

Replace the choice branch of `apply`:
```ts
    if (item.kind === 'choice' && decision.kind === 'choice') {
      const label = this.page.getByRole('radiogroup', { name: item.id }).locator('label').nth(decision.index)
      if (this.opts.direct) { await label.scrollIntoViewIfNeeded(); await label.click() }
      else await this.moveAndClick(label)
      return
    }
```
Replace the text branch of `apply`:
```ts
    if (item.kind === 'text' && decision.kind === 'text') {
      const tb = this.page.getByRole('textbox', { name: item.id })
      if (this.opts.direct) await tb.fill(decision.text)
      else { await this.moveAndClick(tb); await tb.type(decision.text, { delay: 15 }) }
      return
    }
```
(Leave the `number` branch — `fill` — and the final mismatch `throw` unchanged.)

Replace `next`:
```ts
  async next(): Promise<boolean> {
    const btn = this.page.getByRole('button', { name: localeLabel(NEXT_LABELS, this.opts.locale) })
    if (!(await btn.isVisible().catch(() => false))) return false // terminal / submitting screen
    if (this.opts.direct) await btn.click()
    else await this.moveAndClick(btn)
    return true
  }
```

- [ ] **Step 4: Wire `drivePlayer` (recorder + cursor + return samples)**

Change the `drivePlayer` signature + body. Replace the whole function with:
```ts
export async function drivePlayer(
  page: Page,
  opts: { playerBase: string; deploymentId: string; vsBaseUrl: string; locale: string; profile: Profile; seed: number; direct?: boolean; showCursor?: boolean },
): Promise<{ sessionId: string; eventBodies: unknown[]; finished: boolean; steps: number; mouseSamples: MouseSample[] }> {
  const eventBodies: unknown[] = []
  let sessionId = ''
  page.on('request', (req) => {
    if (req.method() !== 'POST') return
    if (/\/v1\/sessions\/[^/]+\/events$/.test(req.url())) {
      try { eventBodies.push(req.postDataJSON()) } catch { /* ignore non-JSON */ }
    }
  })
  page.on('response', async (res) => {
    if (res.request().method() === 'POST' && /\/v1\/sessions\/new$/.test(res.url())) {
      try { sessionId = String((await res.json()).session_id ?? '') } catch { /* ignore */ }
    }
  })

  const recorder = opts.direct ? undefined : new MouseRecorder(() => Date.now())
  if (opts.showCursor) await page.addInitScript(CURSOR_INIT_SCRIPT)

  await page.goto(playerUrl(opts.playerBase, { deploymentId: opts.deploymentId, vsBaseUrl: opts.vsBaseUrl, locale: opts.locale }))
  const driver = new UiDriver(page, { locale: opts.locale, direct: opts.direct, recorder })
  const sleep = (ms: number) => page.waitForTimeout(ms)
  const result = await runOnce(driver, opts.profile, { rng: makeRng(opts.seed), sleep })
  await page.waitForTimeout(300)
  await page.waitForLoadState('networkidle').catch(() => {})
  return { sessionId, eventBodies, finished: result.finished, steps: result.steps, mouseSamples: recorder?.samples() ?? [] }
}
```

(`runOnce`, `makeRng`, `playerUrl`, `Profile`, `Page` are already imported in the file — do not re-import.)

- [ ] **Step 5: Run the full unit suite + typecheck (no e2e yet)**

Run: `cd tools/respondent-bot && npx vitest run && npx tsc -p tsconfig.json --noEmit`
Expected: unit PASS (mouse + trace + profile + strategy + runner + cli), tsc clean. (The existing `smoke.spec.ts` is a Playwright file, not run by vitest; its `drivePlayer` destructuring still compiles because `mouseSamples` is additive.)

- [ ] **Step 6: Write the e2e** — `tests/e2e/mouse.spec.ts`

```ts
import { test, expect } from '@playwright/test'
import { readFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { drivePlayer } from '../../src/ui-driver'
import { buildTrace } from '../../src/trace'
import { resolveProfile } from '../../src/profile'

const mint = readFileSync(fileURLToPath(new URL('./fixtures/mint.json', import.meta.url)), 'utf8')

async function mockVs(page: import('@playwright/test').Page) {
  await page.route('**/v1/sessions/new', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: mint }))
  for (const ep of ['events', 'responses', 'complete', 'scorer_outputs']) {
    await page.route(`**/v1/sessions/*/${ep}`, (r) => r.fulfill({ status: 202, contentType: 'application/json', body: '{}' }))
  }
}

test('realistic lane moves a visible cursor and records a Schema-4b mouse path', async ({ page }) => {
  await mockVs(page)
  const res = await drivePlayer(page, {
    playerBase: 'http://localhost:5173/', deploymentId: 'dep_demo', vsBaseUrl: 'http://vs.mock',
    locale: 'en', profile: resolveProfile('acquiescence'), seed: 42, showCursor: true,
  })
  expect(res.finished).toBe(true)

  // the bot recorded a mouse path
  expect(res.mouseSamples.length).toBeGreaterThan(5)
  expect(res.mouseSamples.some((s) => s.button_state === 'left_down')).toBe(true) // a click happened
  const xs = new Set(res.mouseSamples.map((s) => s.x))
  expect(xs.size).toBeGreaterThan(1) // the cursor actually moved
  for (const s of res.mouseSamples) {
    expect(Object.keys(s).sort()).toEqual(['button_state', 't', 'x', 'y'])
    expect(Number.isInteger(s.x) && Number.isInteger(s.y)).toBe(true)
  }

  // the path lands in the trace
  const trace = buildTrace('dep_demo', res.sessionId, res.eventBodies, res.mouseSamples)
  expect(trace.mouse && trace.mouse.length).toBeGreaterThan(5)

  // the visible cursor overlay was injected
  expect(await page.locator('#__bot_cursor').count()).toBe(1)

  mkdirSync('tests/e2e/screenshots', { recursive: true })
  await page.screenshot({ path: 'tests/e2e/screenshots/respondent-bot-cursor.png', fullPage: true })
})

test('direct lane records no mouse samples', async ({ page }) => {
  await mockVs(page)
  const res = await drivePlayer(page, {
    playerBase: 'http://localhost:5173/', deploymentId: 'dep_demo', vsBaseUrl: 'http://vs.mock',
    locale: 'en', profile: resolveProfile('random'), seed: 7, direct: true,
  })
  expect(res.finished).toBe(true)
  expect(res.mouseSamples).toEqual([])
})
```

- [ ] **Step 7: Run the e2e (boots/reuses the web-viewer dev server)**

Run: `cd tools/respondent-bot && npx playwright test mouse.spec.ts --reporter=line`
Expected: 2 passed. `tests/e2e/screenshots/respondent-bot-cursor.png` written (the red cursor ring visible over a selected option).

If the `await target.click()` inside `moveAndClick` ever fails to register a selection (it should not — the cursor is already at the element centre), the fallback is to replace it with explicit `await this.page.mouse.down(); await this.page.mouse.up()` around the recorder press/release. The `mini` fixture is all radio items, so the primary path works.

- [ ] **Step 8: Run the existing smoke too (regression)**

Run: `cd tools/respondent-bot && npx playwright test smoke.spec.ts --reporter=line`
Expected: 2 passed (the realistic smoke now also moves the mouse; it still reaches finish + well-formed trace).

- [ ] **Step 9: Commit**

```bash
git add tools/respondent-bot/src/ui-driver.ts tools/respondent-bot/tests/e2e/mouse.spec.ts
git commit -m "feat(respondent-bot): visible move-and-click realistic lane + cursor overlay + e2e"
```

---

### Task 4: `--show-cursor` flag + write the path into `--trace` (`cli.ts`)

**Files:**
- Modify: `tools/respondent-bot/src/cli.ts`
- Test: `tools/respondent-bot/src/cli.test.ts` (add a case)

**Interfaces:**
- Consumes: `drivePlayer` returning `mouseSamples`; `buildTrace(dep, sid, bodies, mouse?)`.
- Produces: `CliOpts` gains `showCursor: boolean`; `--show-cursor` flag (default false).

- [ ] **Step 1: Add the failing test** — append to `src/cli.test.ts`

```ts
describe('parseArgs — show-cursor', () => {
  it('defaults showCursor to false', () => {
    expect(parseArgs(['--player', 'p', '--deployment', 'd']).showCursor).toBe(false)
  })
  it('sets showCursor when --show-cursor is present', () => {
    expect(parseArgs(['--player', 'p', '--deployment', 'd', '--show-cursor']).showCursor).toBe(true)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd tools/respondent-bot && npx vitest run src/cli.test.ts`
Expected: FAIL — `showCursor` is not on `CliOpts` / undefined.

- [ ] **Step 3: Edit `src/cli.ts`**

Add `showCursor` to the type:
```ts
export type CliOpts = {
  player: string; deployment: string; vsBaseUrl: string; profile: string
  seed: number; n: number; direct: boolean; locale: string; trace?: string; showCursor: boolean
}
```
Add to the `parseArgs` return object (next to `direct`):
```ts
    showCursor: argv.includes('--show-cursor'),
```
In `main`, pass it to `drivePlayer` and feed the samples into `buildTrace`:
```ts
        const res = await drivePlayer(page, {
          playerBase: opts.player, deploymentId: opts.deployment, vsBaseUrl: opts.vsBaseUrl,
          locale: opts.locale, profile, seed: opts.seed + i, direct: opts.direct, showCursor: opts.showCursor,
        })
        const trace = buildTrace(opts.deployment, res.sessionId, res.eventBodies, res.mouseSamples)
```
(Leave the rest of `main` unchanged.)

- [ ] **Step 4: Run test to verify it passes + typecheck**

Run: `cd tools/respondent-bot && npx vitest run src/cli.test.ts && npx tsc -p tsconfig.json --noEmit`
Expected: cli tests PASS; tsc clean.

- [ ] **Step 5: Commit**

```bash
git add tools/respondent-bot/src/cli.ts tools/respondent-bot/src/cli.test.ts
git commit -m "feat(respondent-bot): --show-cursor flag; write mouse path into the trace"
```

---

### Task 5: Docs

**Files:**
- Modify: `tools/respondent-bot/README.md`
- Modify: `tools/respondent-bot/HANDOFF.md`

**Interfaces:** none (docs only).

- [ ] **Step 1: Update `README.md`**

In the CLI-flags list add `--show-cursor` (default off; renders a visible cursor that follows the bot, for demos/headed runs). In the "Two interaction lanes" section, state accurately: the realistic (default) lane now **moves a real cursor along a path to each control then clicks** (visible with `--show-cursor`) and **records its own mouse path** into `trace.json` under a `mouse` array of Schema-4b samples (`{t,x,y,button_state}`); `--direct` does not move the mouse and records no samples. Add a one-line example:
```bash
npm start -- --player http://localhost:5173/ --deployment dep_abc --show-cursor --trace run.json
```
Note that the recorded path is the bot's own synthetic motion (SP1); capturing a real participant's mouse in the player is the SP2/SP3 track. Em-dashes with no surrounding spaces.

- [ ] **Step 2: Update `HANDOFF.md`**

Add `src/mouse.ts` (pure path generator + Schema-4b `MouseRecorder`) to the file map. Under "What's done" add the visible move-and-click realistic lane + `--show-cursor` + `trace.mouse` path. In "Deferred follow-ups" add: SP2 (player live mouse capture → `.jsonl.gz` + `bdm:recording_started/ended` + `recording_url`) and SP3 (VS recording upload/store + `channels.mouse` into the runtime); human-like paths (easing/curve/jitter, seeded) and slider drag-pathing. Em-dashes with no surrounding spaces.

- [ ] **Step 3: Commit**

```bash
git add tools/respondent-bot/README.md tools/respondent-bot/HANDOFF.md
git commit -m "docs(respondent-bot): mouse movement, --show-cursor, trace.mouse path"
```

---

## Self-Review

**Spec coverage:**
- Real pointer pathing realistic lane / `--direct` no movement — Task 3 (`moveAndClick`, lane split). ✅
- Visible cursor `--show-cursor` overlay — Task 3 (`CURSOR_INIT_SCRIPT` + `drivePlayer` inject) + Task 4 (flag). ✅
- Bot-side path log as Schema-4b samples in `trace.json` — Task 1 (`MouseRecorder`) + Task 2 (`trace.mouse`) + Task 4 (cli writes it). ✅
- Schema-4b sample shape exact — Task 1 (shape test) + Task 3 (e2e shape assertion). ✅
- `boundingBox` null fallback; direct records nothing — Task 3 (`moveAndClick` fallback; `recorder` undefined when direct). ✅
- Testing (pure unit + e2e visible/valid path) — Tasks 1, 2, 3. ✅

**Placeholder scan:** none.

**Type consistency:** `MouseSample`/`Point`/`MouseRecorder`/`interpolatePath` defined in Task 1 and consumed by Tasks 2-3 with matching names; `UiDriver` opts `{ locale, direct?, recorder? }` consistent between Task 3's constructor change and `drivePlayer`'s `new UiDriver(...)` call; `drivePlayer` return `{ ..., mouseSamples }` consistent with Task 4's `buildTrace(..., res.mouseSamples)` and the e2e's `res.mouseSamples`. `--show-cursor` → `showCursor` consistent across cli + drivePlayer. ✅
