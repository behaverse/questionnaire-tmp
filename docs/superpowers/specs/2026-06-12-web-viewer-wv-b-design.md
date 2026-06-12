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
| `response_datetime` / `response_time` | Commit time / **seconds** from trial start (owner ruling 2026-06-12: ALL durations are in seconds, always — Schemas 4a/5 READMEs now state this; canonical examples corrected). Omitted when `style.x_summary_rt: false`. |

Per widget kind: **choice.\*.single** → `response_option_index` (structural `index`), `response_numeric` (when the value is numeric), `response_description` (choice text). **choice.nominal.multiple** → `response_count`, `response_description` (selected texts, `"; "`-joined), `additional_measures` = JSON-stringified `{values: [...], indices: [...]}`. **number.\*** → `response_numeric`. **text.\*** → `response_description`. **Message** → a full trial row (owner ruling 2026-06-12): `response_description: "acknowledged"` (the participant's response to an instruction IS the Next press), `response_time` = seconds from the message becoming visible to the Next press, `input_action_type: "click"` (or `"key"` for Enter); `response_skipped` is NOT set (the canonical kitchen-sink example was corrected accordingly — `response_skipped` stays reserved for genuinely unanswered presented trials, e.g. future optional-question skips).

### 3.2 Matrix sections

Each matrix **row** is its own Response row (it is its own Item): `trial_index` = the section's element position; `additional_measures` carries `{"row_index": j, "section_id": "sec_…"}`; `stimulus_id`/`option_*`/response fields from the row item + shared option. The section emits no row of its own.

### 3.3 When rows are submitted — per-item on forward-advance, ALL attempts kept

A row is built and enqueued when the participant **advances forward past the step** (Next/Enter/auto-advance), i.e. at trial end — the earliest point its timing fields are complete. This makes partial data durable for abandoned sessions (the dashboard's abandonment metrics depend on it).

**Every attempt is collected — never only the final answer** (owner ruling 2026-06-12: the record must allow exact reproduction of what happened). If the participant goes **Back** and changes an answer, advancing again emits a new row for the same `stimulus_id` with a **new** `response_id` plus two extension fields: `x_response_revises` = the superseded row's `response_id` and `x_response_revision: n` (1-based attempt counter; first answers carry neither). The `x_` prefix is forced by Schema 5's `additionalProperties: false` + `^x_` escape hatch — the owner's preferred plain names (`response_revises` / `response_revision`) or a BDM-style `attempt_index` require a **Schema 5 CalVer bump + a BDM upstream change request**, noted as follow-up §10. Going Back without changing the answer emits nothing (no new attempt occurred). Nothing is ever deduplicated viewer-side or VS-side; any "latest answer per stimulus" view is an analysis-time projection.

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
2. **App integration** (RTL): walk the mini fixture committing answers → assert the exact ordered POST bodies (responses then events then complete); Back-and-change → second attempt row carrying `x_response_revises`/`x_response_revision`; `x_summary_rt: false` strips RTs; 503 then success → eventual delivery; completion failure → retry UI.
3. **Live smoke** (extends WV-A's): complete the AISS in a real browser against the local stack, then assert the rows in `export.csv` and the session reaching `submitted` — **the Phase-2 gate, exercised literally**.

## 9 — Owner rulings (2026-06-12, resolved at spec review)

- **F1 — Units**: **all durations are in seconds, always** (responses AND events AND any future field). Applied: WV-B emits seconds everywhere; `schemas/response/examples/` corrected from millisecond values (44 examples + 309 tests still green); units rule added to the Schema 5 + 4a READMEs. The published `schema.json` artifacts are untouched (numeric typing, no version bump).
- **F2 — All attempts collected**: confirmed — exact-reproduction principle; §3.3 updated (attempt rows, nothing deduplicated). Preferred field names `response_revises`/`response_revision` (or `attempt_index`) need a Schema 5 bump + BDM upstream request → follow-up §10; until then the schema-legal `x_response_revises`/`x_response_revision` carry the data losslessly.
- **F3 — Message/instruction trials**: messages ARE full trial rows with `response_time` = seconds until the participant presses Next, and now `response_description: "acknowledged"` instead of `response_skipped: true` (§3.1 updated; canonical kitchen-sink example corrected to match). `response_skipped` stays reserved for presented-but-unanswered question trials.

## 10 — Follow-ups seeded by this spec

- **Schema 5 bump (future)**: promote `x_response_revises`/`x_response_revision` to first-class fields — owner prefers `response_revises`/`response_revision`, or BDM-style `attempt_index` — bundled with a BDM upstream change request (new D-entry in design/05c). Do at the next natural Schema 5 CalVer boundary, not as a one-off bump.
- **VS-D export follow-up**: document the all-attempts semantics in the export README; a "latest attempt per stimulus" convenience view is analysis-side, never storage-side.
