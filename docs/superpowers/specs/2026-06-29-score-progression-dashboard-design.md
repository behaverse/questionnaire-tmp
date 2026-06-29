# Score-progression dashboard — design

**Date:** 2026-06-29 · **Components:** `web-viewer` (player) + `viewer-service` (VS) + `participant-app` (portal)
**Owner request:** `my_comments.md` #4 — "a dashboard to see progression of scores for a given questionnaire over time".

## Goal

A logged-in participant who has taken the **same questionnaire** more than once can see how their
score(s) changed **over time**, inline in the existing **My Data** view of `participant-app`.

## Key constraint: names travel with the scores (no lookup)

The display **name** of a score lives in `runtime.scores[].name` (a `PinnedScore`: `{id, scorer,
path, name?}`), while the persisted `session.scorer_outputs` is the **raw** scorer output (keyed by
scorer ref; one scorer can feed several named sub-scores, e.g. DASS-21 → depression/anxiety/stress).
So the dashboard cannot label scores from `scorer_outputs` alone, and we will **not** do a runtime
lookup. Instead the **player persists a display-ready projection** at completion, where it already
holds both the runtime (names) and the resolver (values).

## Data flow

1. **Player (`web-viewer`)** — at completion, in addition to the existing `scorer_outputs`, compute
   a display projection:
   `score_display = [{ id, name, value }]` for each **named** display score
   (`displayScores(runtime)`) whose resolved value (`resolver.score(id)`) is **numeric**. Persist it
   in the **same** `POST /sessions/{id}/scorer_outputs` call via an extended body
   `{ ...scorer_outputs, x_score_display: [...] }` — i.e. through the session's `x_`-extension
   channel, so there is **no normative Schema-5/BDM change** (consistent with `x_show_score`).
   - New helper `buildScoreDisplay(runtime, resolver)` in `web-viewer/src/scoring/` (reuses
     `displayScores`); returns `[]` when there are no numeric named scores.
   - Persisted only for non-ephemeral, non-local runs, same gate as `scorer_outputs`.

2. **Viewer Service** —
   - `ALTER TABLE session ADD COLUMN score_display jsonb` (additive; mirrors how `scorer_outputs`
     was added).
   - `POST /v1/sessions/{id}/scorer_outputs` accepts an optional `x_score_display` array in the body
     and stores it in `score_display` (the existing `scorer_outputs` validation is unchanged; the
     `x_`-prefixed sibling is allowed and split out before the Schema-6 validation of the rest).
   - `GET /v1/me/sessions` returns `score_display` per session (the row is already fetched; add the
     field to `_SELECT_COLS` + the response map).

3. **participant-app (My Data)** —
   - `groupByInstrument(sessions)` → `[{ instrument_id, instrument_version, sessions[] }]`, sessions
     ordered by date (`submitted_at ?? completed_at ?? started_at`).
   - For each group, collect named scores across its sessions into series
     `{ name → [{ date, value }] }` (from `score_display`). A series with **≥2 points** renders an
     inline **`<ScoreSparkline>`** (dependency-free SVG line chart) above that instrument's attempt
     cards; with **1 point** (or none) no chart shows — just the existing cards.
   - `<ScoreSparkline>`: a small responsive SVG (polyline + dots + min/max axis labels + last-value
     readout), with a visually-hidden `<table>` (date, value) fallback for assistive tech and an
     `aria-label`. No tooltips/zoom in v1.

## Components (small, isolated, testable)

| Unit | Responsibility | Depends on |
|---|---|---|
| `web-viewer` `buildScoreDisplay(runtime, resolver)` | Named numeric scores → `[{id,name,value}]` | `displayScores`, resolver |
| `web-viewer` persist step (`App.tsx`/`bootstrap.ts`) | send `x_score_display` with `scorer_outputs` | `submitScorerOutputs` |
| VS `score_display` column + store passthrough | persist + return the projection | schema.sql, store/sessions |
| VS `scoring.py` POST handler | split `x_score_display` out, store it | — |
| VS `me.py` `/me/sessions` | expose `score_display` | store |
| `participant-app` `groupByInstrument()` | group + order a participant's sessions | — |
| `participant-app` `<ScoreSparkline>` | render one named score over time (SVG + table) | — |
| `participant-app` My Data grouping | wire groups + charts into the page | above |

## Error / edge handling

- No `score_display` (older sessions, unscored questionnaires, single attempt) → no chart; the My
  Data list behaves exactly as today (graceful, additive).
- Non-numeric named scores (e.g. a severity band) are **excluded** from `score_display` in v1.
- Mixed instrument **versions**: group by `instrument_id` (across versions); show the version on each
  attempt card as today. (A future refinement could split or annotate by version.)
- Backfill: only sessions completed **after** this ships carry `score_display`; no migration of past
  sessions.

## Testing

- **Player:** `buildScoreDisplay` returns named numeric scores with values; `[]` when none; excludes
  unnamed/non-numeric. Persist call includes `x_score_display` when present.
- **VS:** POST with `x_score_display` stores it and `scorer_outputs` validation still passes;
  `GET /v1/me/sessions` returns `score_display`; ephemeral still skips.
- **participant-app:** `groupByInstrument` groups + orders correctly; `<ScoreSparkline>` renders a
  polyline for ≥2 points and the table fallback; My Data shows a chart only for instruments with ≥2
  scored attempts.

## Out of scope (later)

- Human-readable instrument **titles** (still `instrument_id`; a Library lookup is a separate item).
- Severity-band trends, date-range filters, tooltips/zoom, per-version splitting, CSV of scores.
- Researcher-facing cohort dashboards (this is participant-self-view only).
