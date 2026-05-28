# 08a — Viewer Service

The Viewer Service is the broker that sits between researchers' deployment configurations and participants' viewer sessions. It owns deployments, mints sessions, brokers submissions, and stores the per-deployment configuration that the questionnaire definition (intentionally) does not carry.

## Purpose

- **Own deployments.** A deployment is a runnable instance of a questionnaire: its mode, its theme, its locale defaults, its date window, its quota, its consent text.
- **Mint sessions.** A session is a single participant's attempt at a deployment. The Viewer Service issues session tokens, validates them on every viewer request, and tracks lifecycle.
- **Broker submission.** Viewers submit responses, events, and behavioural-channel attachments to the Viewer Service; the Viewer Service forwards them to Behaverse (or, for third-party deployments, to a pluggable sink).
- **Serve real-time monitoring.** A minimal dashboard surface for researchers to watch a deployment in flight.
- **Host theming.** Themes are stored per-deployment (or referenced from a shared theme template).
- **Resolve locale.** The participant-locale resolution algorithm (see [05_data_model.md](05_data_model.md) §"Locale resolution") runs here.

## What the Viewer Service is not

- **Not a viewer.** It does not render anything to participants. Viewers (Web, Native) do that.
- **Not the Library.** It references questionnaires by `qst_{id}@version`; it does not store definitions.
- **Not the response store.** Behaverse is the canonical store. The Viewer Service buffers and forwards.

## Deployments

### Deployment identity

A deployment carries:

| Field | Notes |
|---|---|
| `deployment_id` | `dep_{uuid8}` |
| `questionnaire_ref` | `qst_{id}@{version}` — version-pinned, immutable |
| `created_by` | Researcher account ID |
| `created_at` | ISO 8601 |
| `mode_preset` | Named preset (e.g. `"anonymous_link"`, `"kiosk"`, `"demo"`, `"preview"`) — see §"Deployment modes" below |
| `dimensions` | Resolved orthogonal dimension values (see below) |
| `theme_id` | Theme reference (nullable) |
| `default_locale` | `{ language, region? }` |
| `available_locales` | Subset of the questionnaire's validated languages |
| `style_overrides` | Optional overrides on questionnaire-level `style` fields (R18) |
| `flow_overrides` | Optional overrides on questionnaire-level `flow` fields that are overridable (R18 — *not* `allow_back`, `require_complete`, `randomize_*`) |
| `max_time_seconds` | Optional deployment cap (overrides questionnaire default per R18) |
| `redirect_url` | Optional post-completion redirect |
| `confirmation_message` | Optional translatable completion message |
| `show_score` | Boolean — whether scoring results are shown to participants |
| `randomization_seed_strategy` | `per_session` (default), `per_participant`, or `fixed` |
| `active_from` | Optional ISO 8601 — deployment cannot accept new sessions before this |
| `active_until` | Optional ISO 8601 — deployment cannot accept new sessions after this |
| `quota` | Optional per-deployment and per-condition response caps |
| `consent_text_ref` | Optional consent-form reference for non-platform-study deployments |
| `channels` | Behavioural-channel flags per OD-07. Object with one boolean per channel: `{ rt: true, mouse: false, keyboard: false, webcam: false, microphone: false }`. Defaults follow the OD-07 matrix (`rt` true; others false). Webcam / microphone, even when true, still require explicit per-session participant consent at session start. |

### Deployment modes

Modes are **named presets** that resolve to specific combinations of orthogonal dimensions. The Viewer Service stores the resolved dimensions; the preset name is a UX convenience.

**Orthogonal dimensions:**

| Dimension | Values |
|---|---|
| `auth` | `none`, `access_code`, `platform_session`, `host_inherited`, `local`, `editor_session` |
| `persistence` | `persisted`, `ephemeral` |
| `lifecycle` | `standard`, `kiosk_reset`, `preview_short_lived` |
| `rendering_context` | `standalone`, `embedded` |

**Preset table:**

| Preset | `auth` | `persistence` | `lifecycle` | `rendering_context` |
|---|---|---|---|---|
| `anonymous_link` | `none` | `persisted` | `standard` | `standalone` |
| `access_code` | `access_code` | `persisted` | `standard` | `standalone` |
| `platform_study` | `platform_session` | `persisted` | `standard` | `standalone` |
| `embedded` | `host_inherited` | `persisted` | `standard` | `embedded` |
| `kiosk` | `local` | `persisted` | `kiosk_reset` | `standalone` |
| `demo` | `none` | `ephemeral` | `standard` | `standalone` |
| `preview` | `editor_session` | `ephemeral` | `preview_short_lived` | `standalone` |

Unusual combinations (e.g. a "Kiosk Demo" — `kiosk_reset` + `ephemeral`) are expressible by setting dimensions directly, behind an "advanced" surface in the deployment-creation UI.

### Style and flow overrides

Per [05_data_model.md](05_data_model.md), the questionnaire owns the `style` and `flow` blocks. Some fields are deployment-overridable; others are instrument-only.

**Overridable at deployment** (deployment value wins when specified; falls back to instrument value otherwise):
- `style.progress_bar`
- `style.question_numbering`
- `flow.max_time_seconds`

**Instrument-only** (deployment cannot override; changing requires a new questionnaire version):
- `flow.allow_back`
- `flow.require_complete`
- `flow.randomize_pages`
- `flow.randomize_pages_in_block`
- `flow.randomize_questions_in_page`
- `flow.randomize_questions_in_section`

The Viewer Service applies the resolution at session start and freezes it for the session's lifetime.

## Sessions

### Session minting

A session is created when a participant first opens a deployment's viewer entry point. The Viewer Service:

1. Validates the deployment is active (`active_from` ≤ now ≤ `active_until`, quota not exhausted).
2. Authenticates the participant per the deployment's `auth` dimension.
3. Resolves the participant's locale per [05_data_model.md](05_data_model.md) §"Locale resolution".
4. Allocates a session ID (UUID v4) and issues a session token.
5. Records the resolved configuration (deployment snapshot + locale + theme) for the session, plus the **questionnaire version pinned at session-mint time** (per OD-14 sub-question 3 — newer versions never silently enter an in-flight session).

The session token is the join key between the viewer and the Viewer Service for the lifetime of the session.

### Resume rules

Per OD-14 (resolved 2026-05-21), the Viewer Service applies these rules when a viewer attempts to resume a session:

- **In-progress sessions resume against the pinned questionnaire version**, regardless of newer versions in the Library (sub-question 3).
- **`active_until` enforcement is asymmetric** (sub-question 5): a resume of an existing `in_progress` session succeeds even after `active_until` has passed; minting a *new* session against a closed deployment fails with `410 Gone`.
- **`persistence=ephemeral` deployments refuse resume** (sub-question 4): the Viewer Service mints a new session and returns it; the viewer is responsible for the user-facing message ("This is a demo / preview — your prior session has been cleared").
- **The session record persists `last_active_locale`** (sub-question 6): updated each time the participant switches locale mid-session. On resume the viewer reads this back and continues in the last-active locale.

### Session lifecycle

The full state machine is documented in [08_viewer.md](08_viewer.md) §"Session lifecycle" and in [04_architecture.md](04_architecture.md) §"Session lifecycle". The Viewer Service is the owner of the state — viewers report transitions; the Viewer Service records them. Per OD-13, the lifecycle includes the `forwarded` state between `submitted` and `validated`.

For `ephemeral` deployments (Demo, Preview), the session record is held in memory or short-TTL storage and is purged after the session ends. No data leaves the Viewer Service for `ephemeral` sessions.

## Submission brokering

Viewers submit three streams to the Viewer Service:

1. **Per-item or batched responses** — Behaverse trial format (Schema 5).
2. **Semantic events** — xAPI 2.0 statements (Schema 4a).
3. **Behavioural-channel attachments** — per-session files for mouse, keyboard, future webcam/microphone (Schema 4b).

### Response and event endpoints

| Endpoint | Purpose |
|---|---|
| `POST /sessions/{session_id}/responses` | Submit one or more responses (per-item or batched). |
| `POST /sessions/{session_id}/events` | Submit a batch of xAPI statements. |
| `POST /sessions/{session_id}/channels/{channel_name}` | Upload (or chunk-upload) a behavioural-channel attachment. The final call closes the channel and emits the linker `recorded` xAPI statement. |

The Viewer Service forwards these to Behaverse (or to a configured sink) after lightweight validation (schema-conformance check, session-token check, deployment status check).

### Submission forwarding to Behaverse

Per OD-13 (resolved 2026-05-23), forwarding from the Viewer Service to Behaverse is **asynchronous, via a durable Postgres outbox**. Submissions are not lost if Behaverse is slow or down; the viewer's `submitted` ack is independent of Behaverse's availability.

**Outbox model.**

- Each accepted submission writes a row to an outbox table in the same SQL transaction that records the session-state transition (so atomicity is free).
- A forwarder worker reads due rows and POSTs to Behaverse with exponential back-off retry.
- On Behaverse 2xx, the row is marked `forwarded`; session state transitions `submitted → forwarded`. On Behaverse 4xx/5xx, the row stays pending; retry counter and last error are recorded.

**Per-session forwarding fields** (Schema 6): `submitted_at`, `forwarded_at`, `forward_attempts`, `forward_failure_reason`.

**Verification surfaces.**

- **Viewer-initiated:** the viewer may poll `GET /sessions/{session_id}/status` until `forwarded` returns. Offline Native Viewers do this on next sync.
- **Researcher dashboard** (sub-question 1 resolution): the dashboard collapses `submitted` and `forwarded` into a single happy-path tile under normal operation. When unforwarded count or oldest-unforwarded age exceeds a configurable threshold, an alert banner appears showing the queue depth, oldest age, and the most recent Behaverse error. Researchers only see the distinction when there's a problem worth seeing.
- **Reconciliation:** the Viewer Service periodically queries Behaverse for session IDs Behaverse has seen and compares to its own `forwarded` set; drift is surfaced as an alert.

**Outbox bounds** (sub-question 2 resolution): two-tier.

- **Soft alert** at queue depth `outbox_soft_threshold` (operator-configurable default; recommended starting value: 10 000 pending items). Pages the operator; new submissions still accepted.
- **Hard cap** at queue depth `outbox_hard_threshold` (operator-configurable default; recommended starting value: 1 000 000 pending items). New submissions refused with `503 Service Unavailable`; the viewer surfaces a "data collection is paused — please try again later" message and queues locally if it can.

The two thresholds are deliberately far apart: the soft alert gives the operator hours-to-days of headroom to diagnose the Behaverse-side issue before any participant-visible failure. Specific numbers are deployment-tuning; the design commits to the two-tier shape.

**Transport security (per OD-13).**

- TLS 1.3+ on every hop: viewer → Viewer Service, Viewer Service → Behaverse.
- Per-submission SHA-256 hash recomputed on outbox-write and re-checked by Behaverse on receipt (tamper detection across the queue).
- Service-to-service auth (VS → Behaverse): signed bearer tokens at minimum; mTLS as the stronger option.
- Outbox at rest is encrypted (per SEC-02; application-level envelope encryption is the future stronger step).
- **End-to-end encryption** (viewer encrypts to a Behaverse-side public key; the Viewer Service only sees ciphertext) is deferred to a future OD — bigger architectural commitment.

### Pluggable sink

The Viewer Service's response, event, and attachment paths are written against three sink interfaces (per OD-13):

- `ResponseSink` — accepts per-item or batched response payloads.
- `EventSink` — accepts xAPI statement batches.
- `AttachmentStore` — accepts chunked attachment uploads, returns a stable URL.

The first-party implementation routes to Behaverse. The interfaces are documented so third-party labs that adopt this software without Behaverse can substitute their own backends. Only the Behaverse implementation ships initially.

## Real-time monitoring dashboard

For each deployment, researchers can watch live metrics:

- Active sessions (in_progress count, by minute).
- Completion rate (completed / started, by hour).
- Per-question abandonment hotspots.
- Quota status.
- Recent submissions list (anonymised).

The dashboard is served by the Viewer Service from its own deployment+session state, not from Behaverse. Behaverse-side analytics are richer but slower; this dashboard is real-time and minimal.

Push protocol: server-sent events (SSE) over HTTPS. Polling is supported as fallback.

## Theming

A theme is a named bundle of:

- Logo (asset URL).
- Colour palette (primary, secondary, success, warning, error).
- Typography (font family, base size).
- Spacing tokens.
- Optional custom CSS (Web Viewer only).

Themes are stored centrally by the Viewer Service and referenced from deployments via `theme_id`. A theme can be reused across deployments. Modifying a theme affects every deployment that references it; for one-off changes, create a new theme.

Theme conformance to accessibility constraints (WCAG 2.1 AA contrast, minimum readable font size) is checked at theme-save time; failing checks block save.

**Phasing split (per the 2026-05-23 reconciliation of UC-13 with this section).** The *theme infrastructure* described above — `theme_id` on every deployment, central theme store, the Viewer respecting an applied theme — is part of the Viewer Service from its first ship. A small built-in set of themes (a default plus a couple of institutional templates) is provided so deployments are visually reasonable from day one. The *theme editor* surface (logo upload, colour customisation, custom CSS, accessibility-conformance UI, theme versioning — full UC-13) is a later deliverable; phasing tracked in [plan/04_feature_priority.md](../plan/04_feature_priority.md) and [plan/03_use_case_priority.md](../plan/03_use_case_priority.md).

## Locale resolution

Implemented per [05_data_model.md](05_data_model.md) §"Locale resolution". The Viewer Service intersects the deployment's `available_locales` with the questionnaire's validated translations and applies the precedence chain (URL query param → platform profile → deployment default → browser `Accept-Language` → questionnaire canonical language).

## Interactions with other components

| With | How |
|---|---|
| **Library** | Fetches questionnaire definitions and metadata when a deployment is created. Reports back per-deployment usage statistics. |
| **Editor** | Receives preview deployment-creation requests (preset `preview`); returns the preview viewer URL. |
| **Web Viewer / Native Viewer** | The Viewer Service mints session tokens; viewers exchange them at every request. Viewers POST responses, events, attachments here. |
| **Participant Platform** | The Platform creates `platform_study` deployments and assigns participants to them. The Viewer Service issues authenticated session tokens upon assignment-link redemption. |
| **Behaverse** | The default downstream sink for responses, events, and attachment manifests. Connected by API; the Viewer Service forwards after lightweight validation. |
| **Identity sibling project** | All authenticated access (researcher CRUD on deployments; participant `platform_session` auth; editor `editor_session` auth) federates against the Identity sibling. |

## Implementation stack

Python + FastAPI backend; PostgreSQL as the default storage engine (`jsonb` for deployment configurations and session snapshots), with SQLite as a permissible option for single-machine self-hosted deployments. Attachments are stored in object storage (S3-compatible), referenced from the relational store.

## Resolved decisions referenced from this component

- **OD-07** (resolved 2026-05-21) — Behavioural-channel default-state matrix; the `channels` field on a deployment (above) implements the flags. Webcam/microphone two-layer consent (deployment-level flag + per-session participant prompt) is enforced by the viewer.
- **OD-12** (resolved 2026-05-23) — Five-concept pagination model (Block / Page / Section / Subscale / Tag); the deployment-overridable `flow.randomize_*` fields are defined against it. See [05_data_model.md](05_data_model.md) §"Schema 2".
- **OD-13** (resolved 2026-05-23) — Queued forwarding via Postgres outbox; extended session lifecycle; verification surfaces; transport security; pluggable-sink interface; two-tier outbox bounds. Documented in §"Submission forwarding to Behaverse" above.
- **OD-14** (resolved 2026-05-21) — Session resume semantics; documented in §"Resume rules" above. Affects how the Viewer Service handles re-mint vs continue when a participant returns to an `in_progress` session.
