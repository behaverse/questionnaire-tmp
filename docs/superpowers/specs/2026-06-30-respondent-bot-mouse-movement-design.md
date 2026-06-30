# Respondent-bot mouse movement (SP1) — design

**Date:** 2026-06-30 · **Component:** `tools/respondent-bot/` only
**Context:** Owner wants the bot to visibly "respond using the mouse" and to record the mouse path
in the trace. That full feature decomposes into three sub-projects (SP1 here; SP3 = VS recording
store + `channels.mouse` plumbing; SP2 = player Schema-4b capture). SP1 is the contained, watchable
prerequisite — it makes the bot move a real, visible cursor and log its own path, entirely inside
the tool, no player/VS change, no deploy.

## Goal

The respondent-bot's realistic lane moves a **real, visible** cursor along a path to each control
and clicks it, and records that motion as **Schema-4b-shaped** mouse samples in `trace.json`. The
`--direct` lane stays instant/no-movement, so the two lanes are finally a true "with vs without
mouse" pair.

## Reuse (do not reinvent)

- Schema 4b mouse sample shape is fixed (`schemas/recordings/mouse/schema.json`, OD-20):
  `{ t: number≥0 (seconds from recording start), x: int, y: int (viewport px),
  button_state: 'up'|'left_down'|'right_down'|'middle_down' }`, `additionalProperties:false`.
  SP1 emits exactly this shape so SP2's player-captured recordings are byte-compatible.
- Existing `UiDriver` reads controls by ARIA role and clicks the wrapping `<label>` (radios are
  sr-only). SP1 changes only *how the click is actuated* in the realistic lane (move-then-click).

## Non-goals (SP1)

- No player or Viewer Service change; no `bdm:recording_started/ended`/`recording_url` events
  (those are SP2/SP3 — the bot just attaches a `mouse` sample array to its own trace).
- No human-like curved paths / overshoot / jitter (v1 is linear stepped movement; jitter is a
  follow-up).
- No real Schema-4b file upload (`.jsonl.gz`); samples are embedded as a JSON array in `trace.json`.
- `--direct` lane records nothing (it does not move the mouse).

## Architecture

Three units, one new file plus edits to three existing ones.

### New: `src/mouse.ts` (pure + a thin recorder)

```ts
export type ButtonState = 'up' | 'left_down' | 'right_down' | 'middle_down'
export type MouseSample = { t: number; x: number; y: number; button_state: ButtonState }
export type Point = { x: number; y: number }

// Linear interpolation A→B inclusive of B, `steps` intermediate hops (>=1). Pure.
export function interpolatePath(from: Point, to: Point, steps: number): Point[]

// Records the bot's own pointer path as Schema-4b samples. `now()` returns ms (injected for
// determinism); t is seconds since the first sample. Coordinates are rounded to integers.
export class MouseRecorder {
  constructor(now: () => number)
  samples(): MouseSample[]
  moveThrough(points: Point[], button: ButtonState): void  // one sample per point
  press(at: Point): void     // sample with 'left_down'
  release(at: Point): void    // sample with 'up'
}
```

- `interpolatePath` is fully unit-tested (endpoints, count, monotonic coordinates, `steps>=1`).
- `MouseRecorder` is unit-tested with a fake clock: t starts at 0, is non-decreasing, samples carry
  the right `button_state`, coordinates are integers — i.e. each sample validates against Schema 4b.

### Edit: `src/ui-driver.ts`

- Track cursor position: `private pos: Point = { x: 0, y: 0 }`.
- Constructor opts gain `recorder?: MouseRecorder; showCursor?: boolean` (in addition to
  `locale`, `direct`).
- `private async moveAndClick(target: Locator)`: `box = await target.boundingBox()`; if null, fall
  back to `target.click()` (no recorded path) and return. Else compute `to = centre(box)`,
  `pts = interpolatePath(this.pos, to, MOVE_STEPS)`; for each point `await page.mouse.move(px,py)`
  and `recorder?.moveThrough([pt],'up')` (sample the path); then `mouse.down()` +
  `recorder?.press(to)`, brief settle, `mouse.up()` + `recorder?.release(to)`; set `this.pos = to`.
- Realistic `apply` (choice/text) and `next()` use `moveAndClick` on the resolved label/button.
  `--direct` keeps the existing instant path (`.check()`/`.fill()`-style, no movement, no samples).
- Number (slider/spinbutton) `apply` keeps `fill` for now (no drag-pathing in v1; noted follow-up).

### Edit: `src/ui-driver.ts` — visible cursor overlay

A module-const `CURSOR_INIT_SCRIPT` (string) injected via `page.addInitScript` **before**
`page.goto` when `showCursor` is set. It appends a fixed-position `div#__bot_cursor` (a small ring/
dot, `pointer-events:none`, high z-index) and a `mousemove` listener that translates it to the
event coordinates — so it follows the Playwright-driven mouse in screenshots/video. Injection lives
in `drivePlayer` (it owns navigation).

### Edit: `src/trace.ts`

- `Trace` becomes `{ deployment_id; session_id; statements: Statement[]; mouse?: MouseSample[] }`.
- `buildTrace(deploymentId, sessionId, bodies, mouse?)` includes `mouse` only when a non-empty
  array is passed (keeps existing callers/tests valid — `mouse` is optional).

### Edit: `src/cli.ts` + `drivePlayer`

- `drivePlayer` opts gain `showCursor?`. It constructs a `MouseRecorder(() => Date.now())`, injects
  the cursor script when `showCursor`, passes the recorder to `UiDriver`, and after the run returns
  `{ ...existing, mouseSamples: recorder.samples() }`.
- `cli.ts`: add `--show-cursor` (default false) → `opts.showCursor`; build the trace with
  `buildTrace(dep, sid, eventBodies, mouseSamples)` so `--trace` output carries the path.

## Data flow

bot moves mouse (realistic lane) → Playwright dispatches real mousemove/down/up → (a) the player
DOM reacts (selection/click as before) and (b) `MouseRecorder` logs `{t,x,y,button_state}` per hop
→ `drivePlayer` returns the samples → `buildTrace` embeds them under `trace.mouse` → `--trace`
file. With `--show-cursor`, the injected overlay makes the motion visible in the recording.

## Error / edge handling

- `boundingBox()` null (element not laid out) → fall back to a plain `click()` (no path recorded for
  that control); the run still completes. Logged at debug, not fatal.
- `--direct` → recorder is not attached; `trace.mouse` is omitted (no movement happened).
- Coordinates rounded to integers (Schema 4b requires int x/y); `t` is seconds (float) from the
  first sample.
- The cursor overlay is demo-only and has `pointer-events:none`, so it never intercepts clicks.

## Testing

- **Unit (`mouse.test.ts`):** `interpolatePath` endpoints/count/monotonic; `MouseRecorder` with a
  fake clock — t starts at 0 and is non-decreasing, button_state transitions on press/release,
  integer coordinates, and every sample matches the Schema-4b shape (assert keys + enum).
- **Unit (`trace.test.ts`):** `buildTrace` includes `mouse` when passed, omits it otherwise (legacy
  callers unaffected).
- **e2e (`smoke.spec.ts` extension or new `mouse.spec.ts`):** a realistic run with `showCursor:true`
  + a recorder → `trace.mouse` is non-empty, contains at least one `left_down` (a click happened)
  and varying x/y (real movement), every sample is Schema-4b-valid, and `div#__bot_cursor` exists in
  the DOM. Save a screenshot showing the cursor for the owner.

## Follow-ups (out of SP1)

- SP3: Viewer Service recording upload/store endpoint + `channels.mouse` flowed into the runtime so
  the player knows to capture.
- SP2: player captures the live mouse channel, gzips JSONL, uploads, and emits the Schema-4a
  `bdm:recording_started/ended` + `recording_url` lifecycle — making it work for real participants.
- Human-like paths (easing/curves/overshoot/jitter, seeded), and slider drag-pathing.
