# Web Viewer WV-B (Response Capture + Submission) — Design Spec

**Date drafted:** 2026-06-12
**Author:** Web Viewer WV-B brainstorming session (2026-06-12)
**Component:** **Web Viewer**, sub-project **WV-B** — second of six stages (decomposition in the [WV-A spec §0](2026-06-11-web-viewer-wv-a-design.md)). **This stage closes the Phase-2 gate for linear questionnaires**: a participant's answers become Schema 5 `Response` rows and `bdm:` Schema 4a events, flow into the Viewer Service outbox, get forwarded (OD-13), and appear in the researcher's `export.csv`.
**Target:** `web-viewer/` (built in WV-A) + one **additive** Viewer Service change (§5).
**Authoritative source documents:**

- [design/08_viewer.md](../../../design/08_viewer.md) §"Event emission" (5 s / 20-statement batching, retry with back-off), §"Behavioural channels" (OD-07: summary RT default ON), §"Session lifecycle".
- [schemas/response/schema.json](../../../schemas/response/schema.json) + `examples/` — Schema 5 (OD-17 BDM trial table): `Response` (12 required fields) / `ResponseSet`.
- [design/05c_bdm_alignment.md](../../../design/05c_bdm_alignment.md) §D1 — the synthetic `stimulus_id` convention (Context+Instruction+Prompt ids, `+`-joined, in that canonical order; `stimulus_description` carries the concatenated text).
- [schemas/events/schema.json](../../../schemas/events/schema.json) + `examples/phq9_event_stream.json` — Schema 4a (OD-19): `Event`/`EventBatch`, the `bdm:` verb/object vocabulary, and the canonical questionnaire trial grammar this spec follows.
- `viewer-service/src/viewer_service/{api/submission.py, submission.py, sessions.py}` — the live endpoints WV-B drives: `POST /v1/sessions/{id}/responses` · `/events` (Schema-validated → outbox, 202/422/503; ephemeral → validated + skipped) · `/complete`.

---

## 1 — Scope

### 1.1 In scope

- **Trial bookkeeping** in the App: a per-step trial clock (start = step becomes visible), answer-commit timestamps, monotonic `response_id` counter, page/element indices threaded from `flattenSteps` (which already retains `pageId`).
- **Pure Response-row builder** (§3): renderer `AnswerValue` + element + timing + session identity → a valid Schema 5 `Response` row. Message steps produce `instruction` rows with `response_skipped: true` (canonical-example behaviour). Submitted per item (§3.3) wrapped in a single-row `ResponseSet`.
- **Pure event builders + batcher** (§4): the canonical questionnaire trial grammar (`bdm:initialized/started/trial_started/presented/selected|adjusted|typed/clicked/trial_ended/navigated/completed/submitted`), batched every **5 s or 20 events**, flushed on completion and on `pagehide` (keepalive).
- **Transport queue** (§6): one in-memory FIFO for both kinds, Bearer-authenticated `fetch`, exponential back-off on network/5xx/503, drop-and-log on 422, `keepalive` final flush.
- **Completion flow** (§7): finished → flush everything → `POST /complete` → thank-you; visible "still submitting / retry" state on failure.
- **Additive VS change** (§5): `POST /v1/sessions/new` (and `GET /v1/sessions/{id}`) additionally return `agent_id` + `session_index` — required fields of every Schema 5 row that currently never leave the VS.
- **Summary RT** (OD-07, default ON): `response_time` on rows + `bdm:response_time` on `trial_ended`; disabled by `style.x_summary_rt: false` (same `^x_` style-hint pattern as `x_auto_advance`).
- **Live smoke extension**: complete a questionnaire in a real browser against a local stack and verify the rows appear in `GET /v1/deployments/{id}/export.csv` — the literal Phase-2 gate check.

### 1.2 Non-goals (deferred)

- **No behavioural channels** (mouse/keyboard trajectories, Schema 4b attachments, `recorded` events) — post-Phase-2.
- **No offline persistence of the queues** — in-memory only; IndexedDB durability arrives with WV-E resume. A mid-session refresh still loses unsent data (WV-A's known token-in-memory caveat).
- **No logic/scoring** (WV-C/D): no `score()` evaluation, no per-item `correct`/`score` fields (they are Solution/Scorer-dependent), no `bdm:state_changed`.
- **No locale-switch UI** (WV-E) — `language` is constant per session in WV-B.
- **No demo-mode banner** (the VS already validates-but-drops ephemeral submissions; participant-facing demo indicator comes with deployment-mode UX later).
- **No consent events** (`bdm:consented`) — consent infrastructure is a later milestone.

## 2 — Module layout (additions to `web-viewer/src/`)

```
src/app/
├── trial.ts          # TrialClock: per-step start/commit timestamps + response_id counter (pure-ish, injectable now())
├── responses.ts      # buildResponseRow(ctx, stepElement, pageMeta, answer, timing) → Schema5 Response (pure)
├── events.ts         # event builders (pure) + EventBatcher (5 s / 20-event flush policy, injectable timer)
├── transport.ts      # SubmissionQueue: enqueue(kind, payload) → fetch w/ Bearer, backoff, keepalive flush (injectable fetch)
└── App.tsx           # wiring: trial lifecycle on step change, submit-on-advance, completion flow
```

All four new modules are renderer-independent and unit-testable without the DOM. `App.tsx` stays the only place that knows about React.

## 3 — Response rows (Schema 5)

### 3.1 Field mapping

Constant per session (from the §5-extended mint + the runtime): `agent_id`, `session_index`, `session_id`, `instrument_id` = `runtime.metadata.id`, `language` = `runtime.locale`, `transformation_name: "identity"`, `multitask_type: ""`, `activity_index: 1`, `instrument_repetition: 0`. `timeline_id` = the containing Block id when `runtime.blocks` lists the page, else omitted.

Per step/element:

| Schema 5 field | Source |
|---|---|
| `response_id` | Monotonic integer counter per session (1-based, increments per emitted row incl. revisions — see §3.3). |
| `block_index` / `block_name` | 1-based page position in `runtime.pages` / page id. |
| `block_type` | `"test"` for items; `"instruction"` for message elements. |
| `trial_index` | 1-based element position within its page, as a **string** (matrix rows: the section's position, sub-rows get `additional_measures.row_index` — see §3.2). |
| `trial_start_datetime` | Trial clock start (step became visible), ISO-8601. |
| `stimulus_id` | Synthetic per 05c D1: question-side ids joined `+` in canonical order Context → Instruction → Prompt (fallback for id-less inline entities: the element's WV-A answer key). Messages: the message id. |
| `stimulus_type` | `"text"` (prompt-only Question) · `"composite"` (Question with Context and/or Instruction) · `"instruction"` (message). |
| `stimulus_description` | Concatenated active-locale text of the parts (05c D1). |
| `option_id` / `option_data_type` / `measurement_type` / `option_count` | From the element's Option (when present). |
| `response_datetime` / `response_time` | Commit time / **milliseconds** from trial start (canonical response-example convention — see §9 flag F1). Omitted when `style.x_summary_rt: false`. |

Per widget kind: **choice.\*.single** → `response_option_index` (structural `index`), `response_numeric` (when the value is numeric), `response_description` (choice text). **choice.nominal.multiple** → `response_count`, `response_description` (selected texts, `"; "`-joined), `additional_measures` = JSON-stringified `{values: [...], indices: [...]}`. **number.\*** → `response_numeric`. **text.\*** → `response_description`. **Message** → `response_skipped: true`, no response fields (RT = time-on-step still emitted as `response_time`, matching the kitchen-sink example).

### 3.2 Matrix sections

Each matrix **row** is its own Response row (it is its own Item): `trial_index` = the section's element position; `additional_measures` carries `{"row_index": j, "section_id": "sec_…"}`; `stimulus_id`/`option_*`/response fields from the row item + shared option. The section emits no row of its own.

### 3.3 When rows are submitted — per-item on forward-advance, with revision rows

A row is built and enqueued when the participant **advances forward past the step** (Next/Enter/auto-advance), i.e. at trial end — the earliest point its timing fields are complete. This makes partial data durable for abandoned sessions (the dashboard's abandonment metrics depend on it). If the participant goes **Back** and changes an answer, advancing again emits a **revision row**: same `stimulus_id`, a **new** `response_id`, `x_revises` = the original `response_id`, and `x_revision: n`. The outbox is append-only, so corrections supersede rather than replace; **export consumers keep, per `stimulus_id`, the row with the highest `response_datetime`** — documented in the README and noted for the VS-D export's future "deduped view" follow-up. Going Back without changing the answer emits nothing.

## 4 — Events (Schema 4a)

Two actors: the **participant** `{objectType: "bdm:Agent", id: agent_id}` for interactions; the **viewer** `{objectType: "bdm:Engine", id: "behaverse-web-viewer@v26.0611"}` for lifecycle/presentation. Every event carries `context.extensions["bdm:session_id"]` (+ `bdm:trial_index` where a trial is active). Vocabulary used in WV-B (a subset of OD-19, mirroring `phq9_event_stream.json`):

| Moment | Verb (actor) | Object |
|---|---|---|
| Session minted / first render | `bdm:initialized` then `bdm:started` (Engine) | `bdm:RuntimeInstance` (session_id) |
| Step shown | `bdm:trial_started` (Engine) → `bdm:presented` (Engine) | `bdm:Trial` (`trial_<answerKey>`) → `bdm:Stimulus` (stimulus_id) |
| Choice picked / number-text edited (committed) | `bdm:selected` / `bdm:adjusted` / `bdm:typed` (Agent) | `bdm:Option` (option id, `name` = choice text) / `bdm:UIComponent` |
| Nav button | `bdm:clicked` (Agent) | `bdm:UIComponent` (`next_button` / `back_button`) |
| Step left forward | `bdm:trial_ended` (Engine) with `result.extensions`: `bdm:response_id/description/numeric/option_index/response_time` | `bdm:Trial` |
| Back navigation | `bdm:navigated` (Agent) | `bdm:Screen` (target step) |
| Finished / `/complete` acknowledged | `bdm:completed` / `bdm:submitted` (Engine) | `bdm:RuntimeInstance` |

`bdm:typed` fires once per **commit** (step advance), never per keystroke — keystroke timing is a Schema 4b channel, out of scope. The **EventBatcher** accumulates `Event`s and flushes an `EventBatch` (`batch_id: "<session_id>:<seq>"`) every 5 s or at 20 events, plus forced flushes at completion and `pagehide`.

## 5 — Additive Viewer Service change

`POST /v1/sessions/new` and `GET /v1/sessions/{id}` additionally return **`agent_id`** and **`session_index`** (both already stored on the session row; never previously exposed). Without them the viewer cannot populate two of Schema 5's twelve required fields. Additive, mirrors the WV-A CORS precedent; ~2 tests (mint + resume-read include the fields).

## 6 — Transport

One `SubmissionQueue` for both kinds (FIFO preserves response-before-complete ordering): `enqueue({kind: 'responses'|'events', payload})` → serial `fetch(POST {vs}/v1/sessions/{id}/{kind}, Authorization: Bearer <token>)`. **202** → next; **422** → drop the payload, `console.error` (a viewer data bug must not poison the queue — surfaced loudly in dev); **503 / network / 5xx** → exponential back-off (1 s · 2ⁿ, cap 30 s, infinite retries — the participant may finish locally while the queue drains). `pagehide`/`visibilitychange:hidden` → best-effort flush of everything pending with `fetch(..., {keepalive: true})`. The queue exposes `pendingCount` + `idle` promise for the completion flow and tests.

## 7 — Completion flow

Last step advanced → phase `finishing` (new): final `trial_ended` + `bdm:completed` enqueued, batcher force-flushed, await queue `idle` (with a 10 s soft timeout showing "still submitting…" and a retry button on hard failure) → `POST /complete` → enqueue `bdm:submitted` + final flush → phase `finished` (existing thank-you). `/complete` failure → same visible retry state; the participant is never shown a silent success that didn't happen.

## 8 — Testing

1. **Pure units**: `buildResponseRow` per widget kind + message + matrix row + revision (validate every produced row against `schemas/response/schema.json` with Ajv in the test — the same cross-schema trick as the manifest check); event builders against `schemas/events/schema.json`; batcher flush policy (fake timers); queue back-off/422-drop/keepalive (stubbed fetch).
2. **App integration** (RTL): walk the mini fixture committing answers → assert the exact ordered POST bodies (responses then events then complete); Back-and-change → revision row; `x_summary_rt: false` strips RTs; 503 then success → eventual delivery; completion failure → retry UI.
3. **Live smoke** (extends WV-A's): complete the AISS in a real browser against the local stack, then assert the rows in `export.csv` and the session reaching `submitted` — **the Phase-2 gate, exercised literally**.

## 9 — Review flags for the owner (decide at spec review)

- **F1 — RT units are inconsistent in the canonical examples**: `schemas/response/examples/` uses **milliseconds** (`response_time: 5000` for a 5 s gap) while `schemas/events/examples/phq9_event_stream.json` uses **seconds** (`bdm:response_time: 3.215`). WV-B follows each example as-is (ms in rows, s in events). You own the BDM model — flag whether to unify (would be a schema-example correction, possibly a D-deviation note), and WV-B will follow.
- **F2 — Revision policy** (§3.3): append-only revision rows with `x_revises`, export dedup by latest `response_datetime`. Alternative considered and rejected: submit only at `/complete` (loses abandonment data). Confirm you're happy with revision rows reaching Behaverse.
- **F3 — Message rows**: messages emit `response_skipped: true` rows (canonical kitchen-sink behaviour) — confirms time-on-instruction lands in the trial table rather than only in events.
