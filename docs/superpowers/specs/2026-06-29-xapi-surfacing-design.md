# xAPI surfacing to the participant (#3) — design

**Date:** 2026-06-29 · **Components:** `viewer-service` (VS) + `participant-app` (portal)
**Owner request:** `my_comments.md` #3 — "xAPI data should also be stored and available in the participant platform".

## Context

The player already emits xAPI-shaped statements (`{ actor, verb, object, context.extensions,
result.extensions, timestamp }`) in the project's `bdm:` profile (OD-19), batched as
`{ batch_id, events: [...] }` and POSTed to `POST /v1/sessions/{id}/events`. These land in the
`outbox` (`kind='events'`) and are **retained** after forwarding (status flips to `forwarded`,
rows are never deleted) — exactly like `kind='responses'`. So the data is **already stored**; the
only gap is a participant-facing way to read it, parallel to the existing `GET /v1/me/responses.csv`.

## Goal

A logged-in participant can **download their own activity** (their xAPI statements) from the portal.

## Non-goals (v1)

- No remap to standard ADL/IEEE xAPI verbs/IRIs — surface the stored `bdm:`-profile statements **as-is**.
- No researcher-facing event export (a noted follow-up; the responses path already has a researcher CSV, events can mirror it later).
- No in-page activity timeline/viewer — **download only**.
- No new storage, no new capture, no Schema change.

## Data flow

1. **VS** —
   - `store/export.py`: add `iter_event_rows_for_participant(conn, participant_sub)` →
     `SELECT o.payload FROM outbox o JOIN session s ON o.session_id = s.session_id
      WHERE s.participant_sub = %s AND o.kind = 'events' ORDER BY o.id`, yielding each batch payload
     (a `{ batch_id, events: [...] }` dict). Mirrors `iter_response_rows_for_participant`.
   - `api/me.py`: add `GET /v1/me/events` (`require_participant`). Iterates the reader, flattens each
     batch's `events` list (defensively: `payload.get("events") or []`, skipping non-list) into one
     chronological array, and returns `{"events": [...]}` as a JSON **download**:
     `media_type="application/json"`, `Content-Disposition: attachment; filename="my_xapi.json"`.
     Scoped to `claims["sub"]`. Empty stream → `{"events": []}`.

2. **participant-app** —
   - `mydata/client.ts`: add `downloadMyEvents(vsBaseUrl, authFetch)` mirroring `downloadMyData`:
     `authFetch(`${vsBaseUrl}/v1/me/events`)` → `blob()` → object URL → click an `<a download="my_xapi.json">`
     → revoke. Throws on non-OK.
   - `mydata/MyDataView.tsx`: in the existing export card, add a second button
     **"Download my activity (xAPI)"** beside "Download my data (CSV)", wired to `downloadMyEvents`
     with its own `downloadingEvents` busy state.

## Components

| Unit | Responsibility | Depends on |
|---|---|---|
| VS `iter_event_rows_for_participant` | read the caller's event batches from the outbox | outbox + session join |
| VS `GET /v1/me/events` | flatten batches → scoped JSON download | the reader |
| participant-app `downloadMyEvents` | fetch + save `my_xapi.json` | `authFetch` |
| participant-app My Data button | trigger the download | `downloadMyEvents` |

## Error / edge handling

- No events → `{"events": []}` (still a valid download).
- A batch payload missing/!list `events` → skipped (no crash).
- `/v1/me/events` requires a valid Identity token (`require_participant`) → `401` otherwise; results
  are scoped to `claims["sub"]` so one participant never sees another's events (same guard as
  `/me/responses.csv` and `/me/sessions`).
- Download fetch failure in the portal → the button's handler catches + logs (mirrors the CSV button).

## Testing

- **VS:** `iter_event_rows_for_participant` returns only the caller's `kind='events'` batches in `id`
  order (and excludes `responses` rows + other participants). `GET /v1/me/events` flattens batches to
  a single ordered statement array, sets the attachment header, requires a token (`401` without),
  and is scoped (alice sees only alice's). Empty case returns `{"events": []}`.
- **participant-app:** `downloadMyEvents` calls `/v1/me/events` via `authFetch` and creates an object
  URL (mirror the existing `downloadMyData` test). `MyDataView` renders the new button when the
  participant has sessions.

## Follow-ups (out of scope)

- Researcher event export (`GET /v1/deployments/{id}/events`), parallel to the responses CSV.
- Optional standard-ADL xAPI remap for external-LRS interoperability.
- In-portal activity timeline view.
