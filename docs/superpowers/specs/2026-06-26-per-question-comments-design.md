# Per-question participant comments (QA) — design

**Date:** 2026-06-26 · **Components:** `web-viewer/` (player) + `viewer-service/` (VS)
**Owner request:** `my_comments.md` #5/#6 (the lightweight in-session slice).

> Terminology: this feature is **"comment"**, never "feedback". The owner reserves
> "feedback" for information given to *users about their performance*. These are QA
> comments participants/experts leave *about a question*.

## Goal

Let a participant (or a domain expert previewing a deployment) leave a short comment about
the current question/page during a run, for QA purposes. Opt-in per deployment; never blocks
answering or navigation. Researchers can read the collected comments.

## Out of scope (defer to the larger QA-research effort)

- Multiple/elaborate rating scales (clarity confusing→clear, sentiment angry→happy).
- "Ask questions *about* a question" expert-review workflows, reviewer assignment, aggregation
  dashboards. (#6's deeper form.)
- Editing/deleting a submitted comment; threading; per-comment moderation.

## Player (web-viewer)

- **Flag:** `runtime.style.x_comments` (default `false`, opt-in). Read via a
  `commentsEnabled(runtime)` helper in `src/app/steps.ts`, mirroring `keySelectEnabled` /
  `presentationMode`.
- **UI:** when enabled, a small fixed **comment icon button** renders on the runner step
  (bottom-left, opposite the score summary). Clicking opens a **modal** with:
  - a free-text **comment** textarea (cap ~2000 chars), and
  - an optional **1–5 star** rating (most intuitive single scale; clarity/sentiment deferred).
  - Submit is enabled when *either* the comment is non-empty *or* a star is chosen.
  - On submit: POST to the VS; show a brief "Thanks" then auto-close. Cancel/Esc closes.
  - Non-blocking: independent of Next/answering; no `bdm:` event emitted (stored out-of-band).
- **Payload (player → VS):** `{ page_id, item_id, locale, comment, stars }`.
  - `page_id` = current step's `pageId`; `item_id` = the step's first item key (or `null` on a
    message-only step); `locale` = the displayed locale.
- **Client:** `submitComment(vsBaseUrl, sessionId, token, body)` in `src/app/bootstrap.ts`,
  alongside `submitScorerOutputs` (same Bearer-token fetch pattern; returns `boolean`).
- **Strings:** added to `src/app/chrome/strings.ts` (button label, modal title, placeholder,
  stars label, submit, cancel, thanks).

## Viewer Service

- **Table** `question_comment` (append-only; new `CREATE TABLE IF NOT EXISTS` in
  `store/schema.sql`):
  `id bigserial PK`, `session_id text NOT NULL REFERENCES session(session_id)`,
  `deployment_id text NOT NULL`, `instrument_id text NOT NULL`,
  `instrument_version text NOT NULL`, `page_id text`, `item_id text`, `locale text`,
  `comment text`, `stars int` (1–5, nullable), `participant_sub text`,
  `created_at timestamptz NOT NULL DEFAULT now()`.
  Index on `(deployment_id, created_at)`.
- **Store** `store/comments.py`: `insert_comment(conn, session, body)` (denormalises
  deployment_id / instrument_id / instrument_version / participant_sub from the session dict)
  and `list_comments(conn, deployment_id)` (newest first).
- **Endpoints** `api/comments.py` (router registered in `api/app.py` under `/v1`):
  - `POST /sessions/{session_id}/comments` — `require_session`. Inline-validate: `stars`, if
    present, is an int 1–5; `comment`, if present, is a string ≤2000 chars; reject (422) if both
    `comment` and `stars` are empty/absent. **Ephemeral** sessions validate but skip the write
    and return `202 {"ephemeral": true}` (mirrors `scorer_outputs`). Otherwise insert + commit,
    return `202 {"stored": true}`.
  - `GET /deployments/{deployment_id}/comments` — `require_researcher`; `404` if the deployment
    is unknown (mirrors `metrics`); returns the comment list (newest first).

## Testing

- **VS** (`tests/test_comments_api.py`, mirroring `test_scorer_outputs_api.py`): stores a valid
  comment; researcher GET returns it; rejects empty body (422); rejects `stars` out of range
  (422); ephemeral session validates-but-skips (verified via the store); researcher GET requires
  the researcher role; participant POST requires a valid session token.
- **Player:** `commentsEnabled` unit test (default off, on only when `x_comments === true`);
  App-level test that the comment button appears only when the flag is set, the modal opens,
  submitting POSTs the expected body, and submit is disabled when both fields are empty.

## Follow-ups (recorded in the FOLLOWUPS files)

- VS/Editor authoring to set `style.x_comments` (same channel as `x_key_select` / `x_back_nav`).
- Researcher **UI** to browse/export comments (this slice ships the read *endpoint* only).
- The deeper QA-research programme (#6 expert review, extra scales, aggregation).
