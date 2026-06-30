# Web viewer replay (#7, RP1) — design

**Date:** 2026-07-01 · **Component:** `web-viewer/` (the player) only
**Owner request:** `my_comments.md` — "replay feature: given the event data, replay how a person
responded to a questionnaire." Paired track with #8 (the respondent-bot, which produces the
`trace.json` that RP1 replays).

## Context

The player emits a rich ordered `bdm:` event stream. Verified: `trial_ended` events carry the
committed answer in `result.extensions` — `bdm:response_option_index`, `bdm:response_numeric`,
`bdm:response_description`, `bdm:response_time`, plus revision info — and `trial_started`/`presented`
mark position, `selected`/`clicked`/`navigated` mark interaction. So a run is **fully reconstructable
from the ordered statements + the questionnaire runtime**, with no Schema-5 responses needed. The
respondent-bot's `trace.json` (`{deployment_id, session_id, statements, mouse?}`) already contains
the statements + the mouse path.

## Goal (RP1)

An embedded `?replay=<src>` mode in the player that loads a **replay bundle**, reconstructs the run,
and plays it back through the existing renderer with a timeline scrubber, play/pause, speed control,
and a mouse-cursor overlay animated from the recording. Fully offline (file-based), demoable with a
bot trace.

## Decisions (resolved)

1. **Home:** embedded in the player (a `?replay=` mode), reusing the renderer + theme. ✅
2. **Source (RP1):** a `trace.json`-style file bundle first; live researcher-gated loading is RP2/RP3. ✅
3. **Playback:** full — scrub + play/pause + speed (0.5/1/2/4×) + mouse-cursor overlay. ✅

## Reuse (no renderer change)

- `StepRenderer` (`src/renderer`) is a controlled component (`answers` + `onAnswer`). Passing the
  reconstructed `answers` + a no-op `onAnswer` + `requiredErrors: []` renders the participant's state
  read-only; wrapping it in `pointer-events:none` blocks interaction. No renderer modification.
- `applyTheme` / theme resolution (`src/app/theme.ts`) is reused by the replay shell.
- The `Runtime`/`MouseSample`/`BdmEvent` types already exist (`renderer/types`, `app/mouseCapture`,
  `app/events`).

## Replay bundle

`?replay=<src>` fetches a JSON bundle:
```ts
type ReplayBundle = { runtime: Runtime; statements: BdmEvent[]; mouse?: MouseSample[] }
```
The bot's `trace.json` has `statements`+`mouse` but **not** `runtime`; RP1 consumes a bundle that
pairs a runtime with them. For the demo/tests a bundle is built from a player fixture runtime + a bot
trace; producing a bundle from a live session (runtime via VS + statements via the researcher read) is
RP2/RP3.

## Architecture / units (all new, `web-viewer/src/replay/`)

| Unit | File | Responsibility | Deps |
|---|---|---|---|
| Reconstruct | `reconstruct.ts` | pure: statements → a `Timeline` (`stateAt(absMs)`, start/end, event list) | BdmEvent (no runtime) |
| Cursor | `cursor.ts` | pure: mouse samples + recording-start alignment → `cursorAt(absMs)` | MouseSample |
| Clock | `useReplayClock.ts` | hook: play/pause/speed/scrub → current absolute time | — |
| View | `ReplayView.tsx` | render the reconstructed step read-only via `StepRenderer` + controls + cursor overlay | renderer, reconstruct, cursor, clock |
| Load | `load.ts` | fetch + validate a `ReplayBundle` from `?replay=<src>` | — |
| Shell | `ReplayApp.tsx` | top-level: load bundle, apply theme, handle loading/error, mount `ReplayView` | load, theme, ReplayView |
| Wiring | `bootstrap.ts` + `main.tsx` | `Params.replay`; mount `ReplayApp` (no session) when `?replay=` present | — |

### `reconstruct.ts` (pure, runtime-agnostic)

```ts
type RecAnswer = { optionIndex?: number; numeric?: number; description?: string }
type ReplayState = { elementKey: string | null; answers: Record<string, RecAnswer> }
type TimelineEvent = { absMs: number; verb: string; elementKey: string | null }
type Timeline = {
  startMs: number; endMs: number; durationMs: number
  events: TimelineEvent[]
  stateAt(absMs: number): ReplayState
}
function reconstruct(statements: BdmEvent[]): Timeline
```
- Parse each statement `timestamp` → absolute ms; `startMs`/`endMs` = first/last. `elementKey` from
  `trial_started`/`presented`/`trial_ended` object ids (the player uses `trial_<key>`; strip the
  prefix). `stateAt(absMs)` folds statements with `absMs ≤ t`: the current `elementKey` = the latest
  `trial_started`/`presented`; `answers[key]` = the latest `trial_ended`'s reconstructed
  `{optionIndex?, numeric?, description?}` from its `result.extensions`. Runtime-agnostic — it never
  resolves an option *value*; that mapping lives in `ReplayView` (which holds the runtime). This keeps
  `reconstruct` trivially unit-testable from a crafted statement array.

### `cursor.ts` (pure)

```ts
function buildCursor(mouse: MouseSample[], recordingStartMs: number): (absMs: number) => { x: number; y: number } | null
```
- Mouse `t` is seconds from recording start; absolute sample time = `recordingStartMs + t*1000`.
  `recordingStartMs` = the `bdm:recording_started` statement's timestamp (fallback: timeline start).
  `cursorAt(absMs)` linearly interpolates `{x,y}` between the bracketing samples; returns `null`
  before the first / after the last sample (cursor hidden).

### `ReplayView.tsx`

- Given the `runtime` + `Timeline` + cursor fn + current `absMs` (from `useReplayClock`): find the
  runtime step containing `state.elementKey` (build the same flattened steps the runner uses), map each
  `RecAnswer` → the renderer's `AnswerValue` using that step's element definitions
  (`optionIndex` → the option's value; `numeric` → the number; `description` → the text), and render the
  step via `StepRenderer` inside a `pointer-events:none` wrapper with a no-op `onAnswer`.
- Overlays a cursor dot at `cursorAt(absMs)` (hidden when null).
- Controls bar: play/pause toggle, a `<input type=range>` scrubber over `0..durationMs`, a speed
  selector (0.5/1/2/4×), and an elapsed/total readout. The step list / current-event label is a small
  panel driven by `Timeline.events`.

## Data flow

`?replay=<src>` → `load.ts` fetches `ReplayBundle` → `ReplayApp` applies theme + `reconstruct(statements)`
+ `buildCursor(mouse, recStartMs)` → `useReplayClock` advances `absMs` at the chosen speed (or via the
scrubber) → `ReplayView` renders `stateAt(absMs)` through the renderer + positions the cursor.

## Error / edge handling

- Missing/invalid `?replay=` src or unfetchable/!-JSON bundle → a clear error screen (no crash).
- Bundle missing `runtime` or `statements` → error screen ("not a replay bundle").
- No `mouse` array → no cursor overlay (replay still plays).
- `state.elementKey` not found in the runtime (stale/foreign trace) → render an empty step + a notice;
  keep playing.
- Empty statements → a zero-length timeline with an explanatory message.
- Scrubbing past the end pins at `endMs`; play auto-pauses at the end.

## Testing (Vitest + jsdom — the player's stack)

- **`reconstruct.test.ts`** (pure): a crafted statement stream → correct `startMs`/`endMs`/`durationMs`;
  `stateAt` returns the right `elementKey` over time and the right `answers` (option index / numeric /
  description) once each `trial_ended` passes; a later `trial_ended` (revision) overrides an earlier one.
- **`cursor.test.ts`** (pure): interpolation between samples; alignment to `recordingStartMs`; `null`
  before first / after last.
- **`ReplayView.test.tsx`** (jsdom): given a fixture runtime + a small reconstructed state, the
  selected option renders as chosen; the scrubber/clock advancing changes the rendered answer; the
  cursor dot appears when a sample exists; the surface is non-interactive (`pointer-events:none`).
- **Playwright demo** (capstone, shown to the owner, not committed): replay a real bot `trace.json`
  paired with the `mini` fixture runtime, scrub + play, cursor moving — a screenshot/video artifact.

## Follow-ups (RP2/RP3 + later)

- **RP2** (`viewer-service/`): researcher reads — `GET /v1/deployments/{id}/events` + per-session
  event/response/recording reads — so a live participant's run can be loaded (researcher-gated).
- **RP3** (`web-viewer/`): a live loader — `?replay=<deployment>/<session>` builds a bundle from the
  RP2 reads + the runtime, reusing the RP1 engine.
- Live `selected`/`deselected` highlighting before commit (richer "watching them choose"); piping/logic
  re-evaluation during replay; revision diffing UI; export a replay as video.
