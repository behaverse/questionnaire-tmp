# respondent-bot — handoff

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
| `src/trace.ts` | Trace aggregation from intercepted `/events` requests + well-formedness check |
| `src/cli.ts` | CLI (flag parsing, `--n` loop, `--trace` write, non-zero exit on partial failure) |

Test files mirror their source modules: `src/profile.test.ts`, `src/strategy.test.ts`,
`src/runner.test.ts`, `src/trace.test.ts`, `src/cli.test.ts`;
e2e: `tests/e2e/smoke.spec.ts`.

## What's done

- **Seeded trait model** — five named presets + a `fixed` JSON profile; identical seed+profile ⇒
  identical decisions; `--n N` uses seed `seed+i` per run.
- **Two interaction lanes** — default (real pointer + `page.type()` per character); `--direct`
  (uses `page.fill()` for text; choice interaction is label-click in both lanes because the
  player's radio inputs are screen-reader-only).
- **v1 control support** — radio, number-rating, slider, number-input, text; unsupported controls
  (checkbox multi-select, matrix) throw loudly—no silent skips.
- **Trace capture** — intercepts `POST /v1/sessions/{id}/events`, tees statements into
  `trace.json` of shape `{ deployment_id, session_id, statements: BdmEvent[] }`; events also
  persist to the Viewer Service outbox via the normal pipeline.
- **`--n` loop** — serial multi-run; continues on failure, exits non-zero if any run failed.
- **Offline capture smoke** — route-mocked e2e (no live VS/identity needed); asserts a
  well-formed trace is produced.
- **Unit tests** — 33 tests covering profile determinism, strategy decisions (all presets),
  runner orchestration, trace well-formedness, and CLI argument parsing.

## Deferred follow-ups

- **Authenticated-deployment runs** — SSO/login flow so the bot can run against `authenticated`
  preset deployments; deferred because it requires the identity SSO handoff from the player.
- **A real CI/E2E harness product** — a config-driven test suite (multi-instrument matrix,
  pass/fail criteria, CI report) built on top of this core driver.
- **Load / concurrency** — `--n` runs serially today; parallel execution (multiple Playwright
  workers) is deferred until the VS/DB can absorb it.
- **Checkbox multi-select + matrix controls** — the bot throws on these today; extend `UiDriver`
  when those widget patterns are finalised.
- **Browserless `--direct`** — drive the renderer-as-library directly (no browser) for pure
  speed in CI; requires wiring `web-viewer`'s exported renderer lib into the bot (deferred until
  the renderer lib API stabilises).
