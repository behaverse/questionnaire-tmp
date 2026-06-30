# respondent-bot—handoff

Branch: `work/respondent-bot`

A standalone Node/TypeScript (ESM) tool that drives the web-viewer player via Playwright,
models respondent behaviour with a seeded trait profile, and emits portable `bdm:` traces for
the replay harness (#7). See `README.md` for the full user-facing reference.

## Run / test

Run all commands from inside `tools/respondent-bot/`.

```bash
npm install                          # first-time setup (Chromium already installed system-wide)
npm test                             # Vitest unit tests (33 tests)
npm run e2e                          # Playwright offline capture smoke
npm run typecheck                    # tsc --noEmit

# one run against a local deployment
npm start -- --player http://localhost:5173/ --deployment dep_abc \
  --viewer-url http://localhost:8001 --profile acquiescence --seed 42 --trace run.json
```

The e2e smoke boots the web-viewer dev server on `:5173` via Playwright's `reuseExistingServer`
(starts it if not already running).

## File map

| File | Role |
|---|---|
| `src/profile.ts` | Trait presets (random / acquiescence / straight_line / extreme / midpoint / fixed) + seeded RNG + `resolveProfile` |
| `src/strategy.ts` | `decide(item, profile, rng)` → answer value + `thinkTime` delays; the trait model |
| `src/driver.ts` | `Driver` interface + `runOnce` (driver-agnostic single-run orchestrator) |
| `src/ui-driver.ts` | `UiDriver` (Playwright) + `drivePlayer` entry point |
| `src/mouse.ts` | Pure linear path generator (`interpolatePath`) + Schema-4b `MouseRecorder` |
| `src/trace.ts` | Trace aggregation from intercepted `/events` requests + well-formedness check |
| `src/cli.ts` | CLI (flag parsing, `--n` loop, `--trace` write, non-zero exit on partial failure) |

Test files mirror their source modules: `src/profile.test.ts`, `src/strategy.test.ts`,
`src/runner.test.ts`, `src/trace.test.ts`, `src/cli.test.ts`;
e2e: `tests/e2e/smoke.spec.ts`.

## What's done

- **Seeded trait model**—five named presets + a `fixed` JSON profile; identical seed+profile ⇒
  identical decisions; `--n N` uses seed `seed+i` per run.
- **Two interaction lanes**—realistic (default): moves a real cursor along a path to each control
  then clicks, types text character-by-character, and records the synthetic pointer motion into
  `trace.mouse` as Schema-4b samples `{t, x, y, button_state}`; pass `--show-cursor` to render a
  visible red cursor ring for demos/headed runs. `--direct`: uses `page.fill()` for text, does not
  move the mouse, and emits no `trace.mouse` samples. Choice interaction is label-click in both
  lanes (player radio inputs are screen-reader-only).
- **v1 control support**—radio, number-rating, slider, number-input, text; unsupported controls
  (checkbox multi-select, matrix) throw loudly—no silent skips.
- **Trace capture**—intercepts `POST /v1/sessions/{id}/events`, tees statements into
  `trace.json` of shape `{ deployment_id, session_id, statements: BdmEvent[] }`; events also
  persist to the Viewer Service outbox via the normal pipeline.
- **`--n` loop**—serial multi-run; continues on failure, exits non-zero if any run failed.
- **Offline capture smoke**—route-mocked e2e (no live VS/identity needed); asserts a
  well-formed trace is produced.
- **Unit tests**—33 tests covering profile determinism, strategy decisions (all presets),
  runner orchestration, trace well-formedness, and CLI argument parsing.

## Deferred follow-ups

- **SP2—player live mouse capture**—capture a real participant's mouse in the player (live pointer
  → `.jsonl.gz` + `bdm:recording_started/ended` events + `recording_url` field); deferred, no
  player-side recording yet.
- **SP3—VS recording store + runtime channel**—Viewer Service upload/store of recording files +
  `channels.mouse` flowed into the runtime for replay; depends on SP2.
- **Human-like paths**—replace the current linear interpolation with easing, curve-fitting, and
  seeded jitter so synthetic paths are harder to distinguish from real ones.
- **Slider drag-pathing**—the number control (slider/spinbutton) is filled directly in both lanes
  today; record a drag path for slider interactions as a follow-up.
- **Authenticated-deployment runs**—SSO/login flow so the bot can run against `authenticated`
  preset deployments; deferred because it requires the identity SSO handoff from the player.
- **A real CI/E2E harness product**—a config-driven test suite (multi-instrument matrix,
  pass/fail criteria, CI report) built on top of this core driver.
- **Load / concurrency**—`--n` runs serially today; parallel execution (multiple Playwright
  workers) is deferred until the VS/DB can absorb it.
- **Checkbox multi-select + matrix controls**—the bot throws on these today; extend `UiDriver`
  when those widget patterns are finalised.
- **Browserless `--direct`**—drive the renderer-as-library directly (no browser) for pure
  speed in CI; requires wiring `web-viewer`'s exported renderer lib into the bot (deferred until
  the renderer lib API stabilises).
- **Locale coverage**—consent/next/finish labels are tabled for `en`+`pt` only (mirroring the
  player's `strings.ts`); add a locale before driving `--locale` for it. The `en` path is the
  only one the e2e covers.
- **`CommentWidget` collision**—a deployment with `style.x_comments` renders a fixed star-rating
  `radiogroup` ("Rate this question") that `readItems` would treat as an extra choice item; skip
  it by aria-label if comment-enabled deployments need bot runs.
- **`Profile.pointer` is unused**—the lane switch is `--direct`/`opts.direct`, not `profile.pointer`;
  drop the field or wire it when a third actuation style is needed.
