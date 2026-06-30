# Respondent-bot (#8) — design

**Date:** 2026-06-30 · **Component:** new tool `tools/respondent-bot/`
**Owner request:** `my_comments.md` #8 — "create a bot that can answer the questions from the
web-viewer; with and without mouse moving and clicking; also giving the bot various character
traits and constraints." Paired with #7 (replay) — **#8 is built first; it produces the event
traces #7 consumes.**

## Context

The player (`web-viewer/`) already renders a deployment, lets a participant answer, and emits
xAPI-shaped `bdm:` statements (`web-viewer/src/app/events.ts` + `EventBatcher`) that POST to
`POST /v1/sessions/{id}/events` and are retained in the Viewer Service `outbox` (`kind='events'`).
`events.ts` already ships an `agentActor`/`bdm:Agent` actor, so a non-human respondent is
anticipated in the event model.

Verified run-mode behaviour (drives the architecture):
- The same `ev.*` statements are generated in **every** run mode — the `batcher.add(...)` calls in
  `App.tsx` are identical for fixture, preview, and deployment runs.
- The **transport** differs: `?fixture=`/`?preview=` build the pipeline with a **stub transport**
  (`async () => new Response('{}', { status: 202 })`) — events are generated but **nothing
  persists**. A real `?deployment=` run enqueues each batch to the submission queue → real
  `POST /v1/sessions/{id}/events` → outbox.
- **Therefore traces for #7 must come from a real `?deployment=` run** against a running stack.
  Fixture mode is a backend-free smoke lane only.

## Goal

A configurable CLI bot that drives a **real player run** end-to-end — choosing answers per a trait
model, optionally with real pointer movement + clicks — exercising the full stack (mint → render →
answer → events/responses → outbox) and producing **realistic, timestamped `bdm:` event traces**
that become #7's replay fixtures.

## Scope (approved)

- **Data-generator core first.** The deliverable is "one bot completes one deployment run; real
  traces land in the outbox and in a portable `trace.json`." The "test-harness" is just the smoke
  test in §Testing — not a separate CI product yet.
- **Playwright UI driver is the default; `--direct` is an opt-in fast lane.** One trait model, two
  drivers behind a common interface.
- **Small seeded declarative trait profile** — presets, deterministic via `--seed`.
- **v1 targets anonymous-capable deployments** (open / invite-link). Authenticated deployments
  (SSO/login flow) are deferred.

## Non-goals (v1)

- No authenticated-deployment login/SSO flow (deferred).
- No separate CI/test-harness product — only the smoke test below.
- No new VS endpoint, no Schema change, no player change. The bot drives the existing player as-is.
- No researcher-facing trace read — that is #7's job (reads the outbox).
- No load/concurrency tooling beyond a simple `--n` loop.

## Architecture

A standalone **Node + TypeScript CLI** at `tools/respondent-bot/`, test stack **Vitest**
(unit) + **Playwright** (integration) to match the project. Drives the **real player** at a URL;
never imports the player's React internals.

```
respondent-bot --player <url> --deployment <id> --profile <name> --seed <n>
               [--n <count>] [--direct] [--trace <out.json>] [--locale <code>]
               [--fixture <name>]   # backend-free smoke lane (no persisted trace)
```

### Units

| Unit | Responsibility | Depends on |
|---|---|---|
| `cli.ts` | parse args, load profile, loop `--n` runs, exit code | profile, runner |
| `profile.ts` | profile schema + built-in presets + seeded RNG | — (pure) |
| `strategy.ts` | choice/number/text decision per item from profile + seed | profile (pure) |
| `driver.ts` | `Driver` interface (`findControls`/`answer`/`next`) | — |
| `ui-driver.ts` | Playwright, locate controls by **ARIA role**, real pointer/click/type | Playwright, strategy |
| `direct-driver.ts` | Playwright `--direct`: direct value-set, no pointer motion | Playwright, strategy |
| `runner.ts` | one full run: open player URL, step until finished, tee event POSTs | driver |
| `trace.ts` | collect intercepted `POST .../events` bodies → `trace.json` | — |

### Driver interface (driver-agnostic trait model)

```ts
interface Driver {
  // discover the controls + their semantics on the current step
  findControls(): Promise<Control[]>
  // apply a decision produced by the strategy (click/type, or direct-set)
  answer(control: Control, decision: Decision): Promise<void>
  next(): Promise<void>           // advance (Next / auto-advance aware)
  isFinished(): Promise<boolean>  // finished / declined screen reached
}
```

`Control` is derived from accessible roles (`radiogroup`+`radio`, `slider`, `textbox`,
`button[name=Next|Back]`) — robust to internal markup, leaning on the renderer's ARIA work.

- **`UiDriver` (default):** `page.getByRole(...)`, real `.hover()`/`.click()`/`.fill()` with
  pointer movement; honours `style.x_key_select`/`x_back_nav` by using clicks (never key shortcuts
  unless the profile says so).
- **`DirectDriver` (`--direct`):** same role selectors, but `.check()`/`.fill()`/`fill range`
  directly with no pointer path — faster bulk generation.

## Trait model

A declarative profile, deterministic under `--seed` (seeded RNG so runs reproduce):

```ts
type Profile = {
  choice_strategy: 'random' | 'acquiescence' | 'straight_line' | 'extreme' | 'midpoint' | 'fixed'
  fixed?: Record<string, unknown>   // item_id -> answer (for 'fixed')
  timing: { think_ms_min: number; think_ms_max: number }  // human-ish durations, not 0 ms
  pointer: 'realistic' | 'minimal'  // hint to UiDriver (ignored by DirectDriver)
  text: string                      // canned answer for text items
}
```

Built-in presets (selectable by `--profile <name>`):
- `random` — uniform over options.
- `acquiescence` — bias toward agree / high end of ordered scales.
- `straight_line` — same option **index** every item.
- `extreme` — endpoints of ordered scales.
- `midpoint` — centre of ordered scales.
- `fixed` — answers from `profile.fixed` (by item id); falls back to `random` for unmapped items.

Per question type: `choice` → pick an option per strategy; `number` (slider/rating/input) → map
strategy to a value in `[min,max]`; `text` → `profile.text`. Think-time is drawn from
`timing` between answering and advancing, so emitted durations look human.

## Targets & trace output

- **Trace generation (for #7):** real `?deployment=` run against a running stack. The runner
  intercepts the outgoing `POST /v1/sessions/{id}/events` request bodies (Playwright network
  events) and writes them, in order, to `--trace out.json` — a portable
  `{ deployment_id, session_id, statements: [...] }` artifact. The same batches persist to the
  outbox via the normal pipeline, so #7 gets **both** a self-contained fixture file and the real
  outbox read path.
- **Smoke lane (`--fixture <name>`):** backend-free `?fixture=` run; drives the player to the
  finished screen to prove bot + renderer + drivers work. No persisted/portable trace (stub
  transport) — the run is asserted, not captured.
- v1 targets **anonymous-capable deployments** (open / invite-link via `?invite=`); authenticated
  deferred.

## Error / edge handling

- **Unsupported / unknown control on a step** → log the step id + role and fail that run with a
  non-zero exit (don't silently skip — a missed item corrupts the trace).
- **Required-but-unanswerable item** (e.g. a widget the bot can't map) → same: fail loudly.
- **Run never reaches finished** within a step/time budget → timeout with a clear message + the
  last step id.
- **`--n` loop:** one failed run reports its index and continues; the CLI exits non-zero if any run
  failed.
- **Determinism:** identical `--seed` + `--profile` + deployment ⇒ identical decisions (RNG is
  seeded; no `Date.now()`/`Math.random()` in `strategy.ts`).

## Testing

- **Unit (Vitest, no browser):** each `choice_strategy` is deterministic under a fixed seed;
  `acquiescence` skews high, `straight_line` repeats the index, `extreme`/`midpoint` hit
  endpoints/centre, `fixed` honours the map. `strategy.ts` is pure.
- **Integration (Playwright):** one `--fixture mini` run — the bot reaches the finished screen and
  the captured statement stream is well-formed: actor `bdm:Agent`, every verb in the `bdm:`
  vocabulary, timestamps monotonic non-decreasing.
- **Trace shape:** `trace.json` matches `{ deployment_id, session_id, statements: BdmEvent[] }` so
  #7 can rely on it (shape assertion).

## Owner-decisions (resolved)

1. **Scope:** data-generator core first; harness = smoke test only. ✅
2. **Fidelity:** Playwright UI default, `--direct` opt-in. ✅
3. **Trait model:** small seeded declarative profile + presets. ✅
4. **Targets:** anonymous-capable deployments (open/invite); authenticated deferred. ✅

## Follow-ups (out of scope)

- Authenticated-deployment runs (SSO handoff / login).
- A real CI/E2E harness product (assertions library, fixtures matrix) built on this core.
- Load/concurrency generation beyond a serial `--n` loop.
- `--direct` via the renderer-as-library (no browser at all) if pointer realism is never needed.
