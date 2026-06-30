# Web viewer live mouse capture (SP2) — design

**Date:** 2026-06-30 · **Component:** `web-viewer/` (the player) only
**Context:** Final sub-project of the mouse-tracking track. SP1 (merged) = the bot records its own
path. SP3 (merged) = the Viewer Service stores recordings (`POST /v1/sessions/{id}/recordings`) and
the mint now returns `deployment.channels`. SP2 makes the **player capture a real participant's
mouse** when the deployment opts in, and upload it through the SP3 endpoint — so the feature works
for humans, not just the bot.

## Goal

On a real `?deployment=` run whose deployment has `channels.mouse` enabled, the player samples the
participant's mouse as Schema-4b `{t,x,y,button_state}` records, uploads them once at finish to the
SP3 recordings endpoint, and brackets the capture with `bdm:recording_started`/`bdm:recording_ended`
events (the latter carrying a `recording_url` to where the recording can be read).

## Reuse (verified — no schema change)

- Schema 4a already defines the verbs `bdm:recording_started`/`bdm:recording_ended`, the object
  `bdm:Recording`, and the extensions `bdm:recording_modality`, `bdm:sample_rate`,
  `bdm:recording_scope`, `bdm:recording_url` (see `schemas/events/examples/kitchensink_event_batch.json`).
- SP3 endpoint `POST /v1/sessions/{id}/recordings` accepts `{channel, samples}` and stores verbatim;
  the mint returns `channels`.
- The player's `SubmissionQueue` builds `url(kind) = ${vs}/v1/sessions/${id}/${kind}`, so adding
  `'recordings'` to `SubmissionKind` makes the queue POST to `/recordings` with its existing
  retry/backoff/keepalive — no new transport.
- The Schema-4b sample shape mirrors SP1's `mouse.ts` (the player gets its own small capture module;
  the two packages don't share code).

## Decisions (resolved)

1. **Sample rate:** configurable, **default 6 Hz** (a `mousemove` sample at most every ~167 ms);
   every `mousedown`/`mouseup` transition is captured immediately regardless of the throttle. Source:
   a `?mouse_hz=<n>` URL param, falling back to 6. (Deployment-level rate config — extending
   `channels` — is a noted follow-up.) ✅
2. **Upload timing:** accumulate in memory, POST the whole recording **once at finish** via the
   submission queue; the queue's pagehide keepalive flush covers a finish/teardown race, and a
   best-effort pagehide stop-and-enqueue salvages an abandoned run's partial capture. ✅
3. **`recording_url`:** points at `${vsBaseUrl}/v1/deployments/{deployment_id}/recordings` (the SP3
   researcher/replay read). ✅

## Non-goals (SP2)

- No capture on `?fixture=`/`?preview=`/ephemeral runs (no session to attach a recording to).
- No deployment-level sample-rate config (channels stays `{mouse: bool}`; rate is a player param).
- No canonical `.jsonl.gz` upload (the player POSTs JSON `{channel, samples}`; SP3 stores it).
- No keyboard/other channels (mouse only; the architecture leaves room).
- No mid-run chunked upload.

## Architecture / units

| Unit | File | Responsibility |
|---|---|---|
| Capture | `src/app/mouseCapture.ts` (new) | `MouseCapture` — throttled mousemove + button listeners → Schema-4b samples |
| Transport kind | `src/app/transport.ts` | add `'recordings'` to `SubmissionKind` |
| Event builders | `src/app/events.ts` | `recordingStarted` / `recordingEnded` (object `bdm:Recording`, extensions) |
| Mint type + param | `src/app/bootstrap.ts` | `MintOk.channels`; parse `?mouse_hz=` |
| Wiring | `src/app/App.tsx` | start capture + emit started (boot); stop + enqueue + emit ended (finish) |

### `MouseCapture` contract

```ts
export type ButtonState = 'up' | 'left_down' | 'right_down' | 'middle_down'
export type MouseSample = { t: number; x: number; y: number; button_state: ButtonState }

export class MouseCapture {
  constructor(opts?: { sampleRateHz?: number; maxSamples?: number; now?: () => number; target?: Window | Document })
  start(): void                 // attach listeners, stamp t0
  stop(): MouseSample[]          // detach listeners, return the samples (idempotent)
  get sampleRateHz(): number
}
```
- `sampleRateHz` default 6 → `minIntervalMs = 1000 / 6`. A `mousemove` is sampled only if
  `now - lastSampleAt >= minIntervalMs`. A `mousedown`/`mouseup` is ALWAYS sampled (updates the
  current `button_state`: left/right/middle_down on press, `up` on release).
- Each sample: `t = (now - t0) / 1000` (seconds), `x = round(clientX)`, `y = round(clientY)`,
  `button_state` = the current state. Exactly the Schema-4b shape.
- `maxSamples` default 50000 — once reached, further samples are dropped (bounded payload).
- `now` defaults to `performance.now`; injected for tests. `target` defaults to `window`; tests pass
  a jsdom window/document and dispatch synthetic events.

### Event shapes (events.ts)

- `recordingStarted(engineActor, recordingId, sessionId, { modality:'mouse', sampleRate, scope:'runtime' }, ts)`
  → `verb:'bdm:recording_started'`, `object:{objectType:'bdm:Recording', id: recordingId}`,
  `result.extensions:{'bdm:recording_modality','bdm:sample_rate','bdm:recording_scope'}`,
  `context.extensions:{'bdm:session_id'}`.
- `recordingEnded(engineActor, recordingId, sessionId, { url, sampleCount }, ts)` →
  `verb:'bdm:recording_ended'`, same object, `result.extensions:{'bdm:recording_url','bdm:sample_count'}`.
- `recordingId = 'recording_mouse_' + sessionId`.

### Wiring (App.tsx)

- **Boot (deployment capture path only):** after a successful mint, if `mint.channels?.mouse === true`
  and the run is not fixture/preview/ephemeral: `const cap = new MouseCapture({ sampleRateHz: params.mouseHz ?? 6 }); cap.start()`,
  store it on the pipeline ref, and `batcher.add(ev.recordingStarted(engine, recId, sid, {modality:'mouse', sampleRate: cap.sampleRateHz, scope:'runtime'}, nowIso()))`.
- **Finish (the finishing effect, alongside completed/submitted):** if a capture is active:
  `const samples = cap.stop(); queue.enqueue('recordings', { channel:'mouse', samples });
  batcher.add(ev.recordingEnded(engine, recId, sid, { url: \`${vsBaseUrl}/v1/deployments/${deploymentId}/recordings\`, sampleCount: samples.length }, nowIso()))`,
  then flush.
- **pagehide:** if a capture is still active (abandoned run), best-effort `stop()` + `enqueue('recordings', ...)` so the queue's keepalive flush ships the partial recording.

## Error / edge handling

- `channels` absent / `mouse` falsy → no capture, no recording events (unchanged behaviour).
- fixture/preview/ephemeral → never captures (no real session).
- Empty capture (participant never moved) → `samples: []`; still enqueued + `recording_ended` with
  `sample_count: 0` (a zero-length recording is legal; SP3 accepts it).
- `maxSamples` reached → capture silently stops accumulating; `recording_ended` reports the capped count.
- A failed `/recordings` POST is handled by the existing queue retry/backoff (best-effort, non-blocking).

## Testing (Vitest + jsdom — the player's stack)

- **`mouseCapture.test.ts`:** with an injected clock + a jsdom target, dispatching `mousemove` faster
  than the interval yields throttled samples (~6 Hz); `mousedown`/`mouseup` are captured immediately
  and flip `button_state` (left_down → up); every sample matches the Schema-4b shape (keys + integer
  coords + enum); `maxSamples` caps the array; `stop()` detaches and is idempotent.
- **`transport.test.ts`:** `enqueue('recordings', {channel,samples})` POSTs to
  `/v1/sessions/{id}/recordings` (the `SubmissionKind` union now includes it).
- **`events.test.ts`:** `recordingStarted`/`recordingEnded` produce the exact verb/object/extension shapes.
- **App wiring (`App.test.tsx` add):** a mint with `channels:{mouse:true}` on a deployment run emits
  `bdm:recording_started` at boot and, at finish, enqueues a `recordings` submission + emits
  `bdm:recording_ended`; a mint with `mouse:false` (or absent) does neither.

## Follow-ups (out of SP2)

- Deployment-level capture config (sample rate, which channels) by extending the VS `channels` shape.
- Keyboard channel capture (same pattern, `channel:'keyboard'`).
- Canonical `.jsonl.gz` upload + chunked mid-run upload for long sessions.
- End-to-end live verification (bot/SP1 or a human → player/SP2 → VS/SP3 → researcher read) — the
  track's final integration step.
