# Viewer Service recordings + channels plumbing (SP3) — design

**Date:** 2026-06-30 · **Component:** `viewer-service/` only
**Context:** Sub-project 3 of the mouse-tracking track. SP1 (merged) made the respondent-bot record
its own mouse path. SP3 builds the **sink**: a Viewer Service path to store a behavioural-channel
recording (mouse first) and surface the per-deployment channel opt-in to the player, so SP2 (the
player's live capture) has somewhere to send to and a signal to capture.

## Goal

The Viewer Service can (a) tell the player which behavioural channels a deployment wants captured,
and (b) accept, store, retain, forward, and read back a session's channel recording — reusing the
existing outbox, with **no schema migration**.

## Reuse (verified — this is why SP3 is small)

- `outbox.kind` is free-form `text NOT NULL` (no CHECK); the forwarder is kind-agnostic
  (`sink.send(row["kind"], row["payload"])` for every claimed row). A new `kind='recording'`
  therefore gets storage + retention + sha256 dedup + Behaverse forwarding for free.
- `deployment.channels` jsonb already exists (default `{"rt":true,"mouse":false,"keyboard":false,
  "webcam":false,"microphone":false}`); it is simply not surfaced to the player yet.
- The mint (`new_session`) already returns deployment-derived fields (`consent`,
  `confirmation_message`, `redirect_url`); `channels` joins them.
- `submission.py` (`POST /sessions/{id}/events|responses` → `_enqueue`) and `export.py`
  (`iter_event_rows_for_participant`, `iter_response_rows`) are the exact patterns to mirror;
  `me.py` (`/me/events`, `require_participant`) and `comments.py` / `export.py`
  (`/deployments/{id}/...`, `require_researcher`) are the read patterns.

## Decisions (resolved)

1. **Storage:** reuse the **outbox** with `kind='recording'`. No migration; auto-forwards; mirrors
   events/responses. ✅
2. **Wire format:** JSON `{channel, samples:[...]}` payload (jsonb in the outbox), where each sample
   is a Schema-4b mouse sample `{t,x,y,button_state}`. The canonical `.jsonl.gz` archive format is
   left to a future export concern. ✅
3. **Channels plumbing:** surface `deployment.channels` in the `POST /v1/sessions/new` mint
   response. ✅
4. **Reads:** include both a participant read (`/v1/me/recordings`) and a researcher read
   (`/v1/deployments/{id}/recordings`) in SP3 — trivial mirrors that #7 replay and participant
   "my data" both need. ✅

## Non-goals (SP3)

- No player change (that is SP2) — SP3 is the server side only.
- No new DB table, no migration, no Supabase Storage.
- No `.jsonl.gz` canonical wire format and no `bdm:recording_started/ended` event lifecycle (SP2
  emits those Schema-4a events; SP3 just stores what the player POSTs).
- No keyboard/webcam/mic capture wiring beyond accepting `channel` as a validated string (mouse +
  keyboard allowed; others rejected for now).
- No hard size cap on a recording (noted follow-up).

## Architecture / units

| Unit | File | Responsibility |
|---|---|---|
| Mint channels | `sessions.py` `new_session` | add `"channels": deployment.get("channels")` to the return dict |
| Recording ingest | `api/recordings.py` `POST /sessions/{id}/recordings` | validate body, enqueue `kind='recording'` (skip ephemeral) |
| Participant read | `api/recordings.py` `GET /me/recordings` | `require_participant`; return the caller's recordings |
| Researcher read | `api/recordings.py` `GET /deployments/{id}/recordings` | `require_researcher`; return the deployment's recordings |
| Readers | `store/export.py` | `iter_recording_rows_for_participant`, `iter_recording_rows` (kind='recording') |
| Router wiring | `api/app.py` | `include_router(recordings.router)` |

### Ingest contract

`POST /v1/sessions/{session_id}/recordings` — `require_session` (the participant's own session token).
Body: `{ "channel": "mouse", "samples": [ {t,x,y,button_state}, ... ] }`.
- Validation (400 on failure): `channel` is one of `{"mouse","keyboard"}`; `samples` is a list.
- Ephemeral/demo sessions: accepted (202) but **not** enqueued (mirrors `submission._enqueue`).
- Stores `{channel, samples}` as the outbox payload with `kind='recording'`; returns `202 {enqueued: <id>}`.

### Read contract

- `GET /v1/me/recordings` → `{ "recordings": [ {channel, samples}, ... ] }` scoped to `claims["sub"]`
  (mirrors `/me/events`). `401` without a participant token.
- `GET /v1/deployments/{deployment_id}/recordings` → `{ "recordings": [...] }`, `require_researcher`
  (`401`/`403` otherwise; mirrors `/deployments/{id}/comments`).

### Mint change

`new_session` return gains `"channels": deployment.get("channels")` (may be `null` if the deployment
never set channels — the player treats absent/`null`/`mouse:false` as "do not capture").

## Data flow

SP2 player reads `mint.channels.mouse` → if true, captures mouse → `POST /sessions/{id}/recordings`
`{channel:'mouse', samples}` → outbox `kind='recording'` (retained) → forwarder ships it to Behaverse
like events/responses → researcher reads `/deployments/{id}/recordings` (and #7 replays from it);
participant reads `/me/recordings`.

## Error / edge handling

- Invalid `channel` (not mouse/keyboard) or non-list `samples` → `400 {error:{code:"bad_recording"}}`.
- Ephemeral session → `202` with no outbox row (consistent with events; demo data is not retained).
- Unknown/closed session or bad token → `401` via `require_session` (same as events).
- Empty `samples` `[]` → accepted and stored (a zero-length recording is legal); readers yield it.
- A recording payload that is not a dict / missing keys in the reader → yielded as-is defensively
  (mirrors `iter_event_rows_for_participant` tolerance); the consumer filters.

## Testing (pytest + testcontainers; `DOCKER_CONFIG=/tmp/lib_docker`, run `viewer-service/` alone)

- **Mint:** `new_session` response includes `channels` equal to the deployment's `channels` (and a
  deployment with no channels yields `channels: null`).
- **Ingest:** `POST /sessions/{id}/recordings` enqueues exactly one `kind='recording'` outbox row
  with the `{channel,samples}` payload; an ephemeral session enqueues none (still 202); invalid
  `channel` and non-list `samples` → 400; missing/invalid session token → 401.
- **Readers:** `iter_recording_rows_for_participant` returns only the caller's `kind='recording'`
  payloads (excludes events/responses and other participants); `iter_recording_rows(deployment)`
  returns the deployment's, in insertion order.
- **Read endpoints:** `/me/recordings` is scoped to the token's `sub` (alice sees only alice's);
  `/deployments/{id}/recordings` requires a researcher token (401 without).

## Follow-ups (out of SP3)

- SP2: the player's live Schema-4b mouse capture + `bdm:recording_started/ended` + `recording_url`
  pointing at `/me/recordings` or `/deployments/{id}/recordings`.
- Canonical `.jsonl.gz` archive format (gzip at export); per-recording size cap + rate limiting.
- A TTL reaper for recording rows (folds into the existing shared outbox-reaper follow-up).
- Researcher CSV/streaming export of recordings (today's reads return JSON).
