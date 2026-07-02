# respondent-bot

A Playwright-driven CLI that auto-answers a live questionnaire deployment end-to-end. It models
respondent behaviour via a seeded trait profile (random, acquiescence bias, straight-lining,
extreme, midpoint, or a fixed JSON profile), drives the player through every question, and tees
the player's `bdm:` statements into a portable `trace.json`—the artifact the replay harness (#7)
consumes. Doubles as a cross-stack E2E smoke lane and a data generator for pipeline validation.

## Install

```bash
cd tools/respondent-bot
npm install          # Chromium is already installed system-wide; no extra browser download needed
```

## Quickstart

The bot answers an **open** deployment (anonymous or signed-invite). End to end:

1. **Get a deployment id.** Create one as a researcher (see
   [`docs/testing-participant-flow.md`](../../docs/testing-participant-flow.md)) or reuse an existing
   open `dep_*`. For a demo without a backend, use the offline smoke lane instead (`npm run e2e`).
2. **Run the bot** against the player + Viewer Service, with the visible cursor on:
   ```bash
   npm start -- --player http://localhost:5173/ --deployment dep_abc \
     --viewer-url http://localhost:8001 --profile acquiescence --show-cursor --trace run.json
   ```
   It mints a session, answers every question per the profile (moving a real cursor in the realistic
   lane), and finishes on the "Thank you" screen.
3. **Inspect the output.** `run.json` is the `{deployment_id, session_id, statements, mouse}` trace
   (see [Trace output](#trace-output)). The same `bdm:` events + mouse recording also land in the
   Viewer Service outbox, so the run can be **replayed** by a researcher (#7 replay).

Against the **live stack**, point the flags at the deployed URLs, e.g.
`--player https://player-sooty-six.vercel.app/ --viewer-url https://viewer-service.vercel.app`.

## See it in action

`npm run e2e` drives a full run headlessly and writes proof artifacts to
`tests/e2e/screenshots/` (gitignored, regenerated on each run):

- `respondent-bot-cursor.png` — the bot mid-run with the visible cursor over a chosen option
- `respondent-bot-finished.png` — the completed run
- a captured `trace.json` alongside

For a paced, watchable capture (a `.webm` video + per-question stills), run a headed browser demo
with `--show-cursor` against a real deployment. The frames land under the same `screenshots/` dir.

## Trait presets

| Name | Behaviour |
|---|---|
| `random` | Chooses uniformly at random (default) |
| `acquiescence` | Strongly biased toward high/agree options |
| `straight_line` | Always picks the same relative position (first, middle, or last) |
| `extreme` | Alternates between the two extreme options |
| `midpoint` | Always picks the middle option (or nearest) |
| `fixed` | Reads answers from a JSON profile file—see below |

The `fixed` strategy is not a named preset; pass a JSON **file path** to `--profile`:

```json
{
  "choice_strategy": "fixed",
  "fixed": {
    "item_phq_1": 2,
    "Not at all": 0
  }
}
```

Keys may be the item `id` or its `aria-label`. Any item not found in the map falls back to
`random`.

## Interaction lanes

**Default (realistic):** the bot moves a real cursor along a path to each control and clicks it,
then types text character-by-character. Choice items are selected by clicking their wrapping
`<label>` (the radio inputs are screen-reader-only). The cursor motion is recorded into
`trace.json` under a `mouse` array of Schema-4b samples:

```json
{ "t": 0.12, "x": 480, "y": 310, "button_state": "up" }
```

Fields: `t` = seconds from the first sample (float); `x`/`y` = integer viewport pixels;
`button_state` ∈ `up | left_down | right_down | middle_down`. This is the bot's **own** synthetic
motion. Capturing a **real participant's** mouse in the player (SP2) and storing it server-side (SP3)
are now shipped and deployed, and a researcher can replay any session (#7 replay); see HANDOFF.md.

Note: the number control (slider/spinbutton) is filled directly in both lanes; no drag-path is
recorded for it yet (noted follow-up).

Pass `--show-cursor` to render a visible red cursor ring that follows the bot's pointer—useful for
demos and headed runs.

**`--direct` (fast):** uses `page.fill()` for text fields and does **not** move the mouse;
`trace.mouse` is omitted entirely. Choice selection is identical to the realistic lane
(label-click). Useful for speed when realistic motion is not required.

## Seed determinism

Identical `--seed` + `--profile` ⇒ identical decisions. With `--n N`, run `i` (zero-indexed) uses
seed `seed + i`, so you get N distinct-but-reproducible runs.

## CLI reference

```
npm start -- --player <url>        (required) base URL of the player, e.g. http://localhost:5173/
             --deployment <id>     (required) deployment ID (dep_*)
             --viewer-url <url>    Viewer Service base URL (default http://localhost:8001)
             --profile <name|file> trait preset name or path to a .json profile (default random)
             --seed <n>            RNG seed (default 1)
             --n <count>           number of sequential runs (default 1)
             --direct              fast lane: use fill() for text, skip pointer motion
             --show-cursor         render a visible red cursor ring (demos/headed runs; default off)
             --locale <code>       questionnaire locale (default en)
             --trace <out.json>    write the captured bdm: trace to this file
```

## Examples

```bash
# one acquiescent respondent against a local open deployment, save the trace
npm start -- --player http://localhost:5173/ --deployment dep_abc \
  --viewer-url http://localhost:8001 --profile acquiescence --seed 42 --trace run.json

# five random respondents (run.0.json … run.4.json)
npm start -- --player http://localhost:5173/ --deployment dep_abc --profile random --n 5 --trace run.json

# fast lane (no pointer motion)
npm start -- --player http://localhost:5173/ --deployment dep_abc --direct

# headed demo run with visible cursor and trace output
npm start -- --player http://localhost:5173/ --deployment dep_abc --show-cursor --trace run.json
```

## Trace output

`trace.json` shape:

```json
{
  "deployment_id": "dep_abc",
  "session_id": "sess_xyz",
  "statements": [ /* BdmEvent[] */ ],
  "mouse": [ /* MouseSample[]—realistic lane only */ ]
}
```

`statements` is the same `bdm:` event stream the player POSTs to `/v1/sessions/{id}/events`; the
CLI intercepts those requests and tees them into the file. The same events also persist to the
Viewer Service outbox via the normal pipeline. `mouse` is present only for realistic-lane runs and
holds the bot's own synthetic path as Schema-4b samples (see "Interaction lanes" above); it is
omitted when `--direct` is used.

Traces require a real `?deployment=` run—anonymous/open deployments or signed `?invite=` links.
Authenticated deployments are not yet supported (deferred follow-up).

## v1 control support

| Control | Widget IDs | Support |
|---|---|---|
| Choice (radio) | `choice.*` | ✅ |
| Number rating | `number.ratio`, `number.interval` with rating layout | ✅ |
| Slider | `number.*` with slider layout | ✅ |
| Number input | `number.*` with input layout | ✅ |
| Text | `text.*` | ✅ |
| Checkbox multi-select | `choice.*` multi | ❌ unsupported—**fails loudly** |
| Matrix | `matrix.*` | ❌ unsupported—**fails loudly** |

The bot **throws** on an unsupported control type—it never silently skips.

## Operational gotchas

- **CORS:** the player origin must be in the Viewer Service `VS_CORS_ORIGINS` allow-list or the
  bot's session mint will fail with a network error.
- **Deployment must be open:** the target deployment must be accepting responses (not paused,
  quota-full, or in a mode that refuses anonymous mints).
- **Live catalogue questionnaires (known gap):** the bot selects a choice by clicking its wrapping
  `<label>`, which works for the bundled fixtures. Some live `RadioGroup` renderings present option
  rows as clickable `<div>`s (no `<label>`), which the current click misses—so the bot can stall on
  those. Driving them (click the `role=radio` element / the option container instead of `<label>`)
  is a tracked follow-up.

## Running tests

```bash
npm test          # Vitest unit tests (33 tests—profile, strategy, runner, trace, CLI)
npm run e2e       # Playwright offline capture smoke (boots the web-viewer dev server on :5173
                  # via reuseExistingServer if not already running)
npm run typecheck # tsc --noEmit
```
