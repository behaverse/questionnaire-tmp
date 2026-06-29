# Score-progression Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a logged-in participant see how their score(s) on a given questionnaire change over time, inline in `participant-app`'s My Data view.

**Architecture:** The player persists a display-ready score projection (`x_score_display`) at completion, sent in the existing `scorer_outputs` POST. The Viewer Service stores it in a new `session.score_display` column and returns it from `GET /v1/me/sessions`. The participant-app groups a participant's sessions by questionnaire and draws a dependency-free SVG line chart per named score.

**Tech Stack:** Python/FastAPI + Postgres (VS); React 19 + TypeScript + Vite + Tailwind (web-viewer, participant-app); Vitest; pytest + testcontainers.

## Global Constraints

- Display names travel **with** the scores; the participant-app does **no** runtime/Library lookup.
- `score_display` is a **viewer display projection** carried via the session `x_`-extension channel — **no** normative Schema-5/BDM change.
- Only **numeric named** scores are charted; non-numeric (e.g. severity bands) are excluded in v1.
- No backfill: only sessions completed after this ships carry `score_display`.
- A chart renders only for a score series with **≥2** points; otherwise the My Data list is unchanged.
- Em-dashes have **no surrounding spaces** in any copy.
- VS tests need Docker: run with `DOCKER_CONFIG=/tmp/lib_docker`.
- Finish each component on a branch, then merge to master + push (no PRs).

---

### Task 1: Viewer Service — persist + expose `score_display`

**Files:**
- Modify: `viewer-service/src/viewer_service/store/schema.sql` (add column)
- Modify: `viewer-service/src/viewer_service/store/sessions.py` (`_SELECT_COLS`, new setter)
- Modify: `viewer-service/src/viewer_service/api/scoring.py` (accept `x_score_display`)
- Modify: `viewer-service/src/viewer_service/api/me.py` (return `score_display`)
- Test: `viewer-service/tests/test_scorer_outputs_api.py`, `viewer-service/tests/test_my_data_api.py`

**Interfaces:**
- Consumes: existing `POST /v1/sessions/{id}/scorer_outputs` body (a `scorer_outputs` map). The player will additionally include a sibling key `x_score_display: [{id, name, value}]`.
- Produces: `GET /v1/me/sessions` sessions each gain `score_display: [{id, name, value}] | null`.

- [ ] **Step 1: Add the column to the schema**

In `viewer-service/src/viewer_service/store/schema.sql`, directly after the existing line
`ALTER TABLE session ADD COLUMN IF NOT EXISTS scorer_outputs jsonb;` add:

```sql
ALTER TABLE session ADD COLUMN IF NOT EXISTS score_display jsonb;
```

- [ ] **Step 2: Expose the column in the store + add a setter**

In `viewer-service/src/viewer_service/store/sessions.py`, add `"score_display"` to the end of the
`_SELECT_COLS` tuple (after `"participant_sub"`):

```python
_SELECT_COLS = ("session_id", "session_index", "deployment_id", "viewer_id", "viewer_version",
                "agent_id", "instrument_id", "instrument_version", "status", "token_hash",
                "initial_locale", "last_active_locale", "started_at", "completed_at",
                "submitted_at", "forwarded_at", "forward_attempts", "forward_failure_reason",
                "ephemeral", "scorer_outputs", "participant_sub", "score_display")
```

Then add a setter directly below `set_scorer_outputs`:

```python
def set_score_display(conn: psycopg.Connection, session_id: str, display: list) -> None:
    conn.execute("UPDATE session SET score_display=%s WHERE session_id=%s", (Json(display), session_id))
```

- [ ] **Step 3: Write the failing VS POST test**

In `viewer-service/tests/test_scorer_outputs_api.py`, add (the `session` fixture already exists):

```python
def test_stores_x_score_display_sidecar(session):
    client, sid, h = session
    body = {**_VALID_OUTPUTS, "x_score_display": [{"id": "scr_phq9", "name": "PHQ-9", "value": 12}]}
    r = client.post(f"/v1/sessions/{sid}/scorer_outputs", json=body, headers=h)
    assert r.status_code in (200, 202), r.text
    import psycopg, os
    from viewer_service.store import sessions as session_store
    with psycopg.connect(os.environ["DATABASE_URL"]) as c:
        row = session_store.get_session(c, sid)
        assert row["scorer_outputs"] == _VALID_OUTPUTS              # sidecar stripped before validation
        assert row["score_display"] == [{"id": "scr_phq9", "name": "PHQ-9", "value": 12}]
```

- [ ] **Step 4: Run it to confirm it fails**

Run: `cd viewer-service && DOCKER_CONFIG=/tmp/lib_docker python -m pytest tests/test_scorer_outputs_api.py::test_stores_x_score_display_sidecar -q`
Expected: FAIL (the `x_score_display` key makes `scorer_outputs` validation reject it / it is not stored).

- [ ] **Step 5: Accept + store the sidecar in the POST handler**

In `viewer-service/src/viewer_service/api/scoring.py`, replace the body of `post_scorer_outputs` so it
splits `x_score_display` out **before** validation and stores it:

```python
@router.post("/sessions/{session_id}/scorer_outputs")
def post_scorer_outputs(session_id: str, payload: dict, session=Depends(require_session), conn=Depends(get_conn)):
    display = payload.pop("x_score_display", None) if isinstance(payload, dict) else None
    try:
        _validator().validate(payload)
    except ValidationError as e:
        return JSONResponse(status_code=422, content={"error": {"code": "invalid_submission", "message": e.message}})
    if session["ephemeral"]:
        return JSONResponse(status_code=202, content={"ephemeral": True})
    session_store.set_scorer_outputs(conn, session_id, payload)
    if isinstance(display, list):
        session_store.set_score_display(conn, session_id, display)
    conn.commit()
    return JSONResponse(status_code=202, content={"stored": True})
```

- [ ] **Step 6: Run the test to confirm it passes**

Run: `cd viewer-service && DOCKER_CONFIG=/tmp/lib_docker python -m pytest tests/test_scorer_outputs_api.py -q`
Expected: PASS (all, including the existing scorer_outputs tests).

- [ ] **Step 7: Write the failing `/me/sessions` test**

In `viewer-service/tests/test_my_data_api.py`, add this test. It reuses the file's existing `_seed`
helper and `sstore` import, and the `set_score_display` setter added in Step 2:

```python
def test_me_sessions_includes_score_display(client, auth_header, pg_url):
    _seed(pg_url, "carol", "sC")
    with psycopg.connect(pg_url) as c:
        sstore.set_score_display(c, "sC", [{"id": "sc", "name": "PHQ-9", "value": 9}])
        c.commit()
    client.headers.pop("authorization", None)
    r = client.get("/v1/me/sessions", headers=auth_header(["participant"], sub="carol"))
    assert r.status_code == 200
    assert r.json()["sessions"][0]["score_display"] == [{"id": "sc", "name": "PHQ-9", "value": 9}]
```

- [ ] **Step 8: Run it to confirm it fails**

Run: `cd viewer-service && DOCKER_CONFIG=/tmp/lib_docker python -m pytest tests/test_my_data_api.py::test_me_sessions_includes_score_display -q`
Expected: FAIL with `KeyError`/assertion (field not in the response).

- [ ] **Step 9: Add `score_display` to the `/me/sessions` response**

In `viewer-service/src/viewer_service/api/me.py`, in `my_sessions`, add the field to each mapped dict
(after `"submitted_at"`):

```python
        "submitted_at": r["submitted_at"].isoformat() if r["submitted_at"] else None,
        "score_display": r["score_display"],
```

- [ ] **Step 10: Run the VS suite**

Run: `cd viewer-service && DOCKER_CONFIG=/tmp/lib_docker python -m pytest -q`
Expected: PASS (all).

- [ ] **Step 11: Commit**

```bash
git add viewer-service/
git commit -m "feat(viewer-service): persist + expose score_display (x_score_display sidecar)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: Player — build + persist the score-display projection

**Files:**
- Modify: `web-viewer/src/scoring/display.ts` (add `ScoreDisplay` + `buildScoreDisplay`)
- Modify: `web-viewer/src/app/bootstrap.ts` (`submitScorerOutputs` accepts the projection)
- Modify: `web-viewer/src/app/App.tsx` (compute + pass it at completion)
- Test: `web-viewer/src/scoring/display.test.ts`, `web-viewer/src/app/bootstrap.test.ts`

**Interfaces:**
- Consumes: `displayScores(runtime): {id,name}[]` (same file) and a resolver `score(id): EvalValue` (`pl.cache.resolver.score`).
- Produces: `ScoreDisplay = { id: string; name: string; value: number }`; `buildScoreDisplay(runtime, score)`; `submitScorerOutputs(vs, id, token, outputs, scoreDisplay?)` sends `x_score_display` when non-empty. Task 3 mirrors `ScoreDisplay` in the participant-app.

- [ ] **Step 1: Write the failing `buildScoreDisplay` test**

In `web-viewer/src/scoring/display.test.ts`, add:

```typescript
import { buildScoreDisplay } from './display'

test('buildScoreDisplay returns named numeric scores with values; skips unnamed + non-numeric', () => {
  const runtime = { pages: [], scores: [
    { id: 'sc_total', scorer: 'scr_x@v26.0602', path: '/total', name: 'Total' },
    { id: 'sc_branch', scorer: 'scr_x@v26.0602', path: '/b' },                 // no name → excluded
    { id: 'sc_sev', scorer: 'scr_x@v26.0602', path: '/sev', name: 'Severity' },// non-numeric → excluded
  ] } as unknown as import('../renderer/types').Runtime
  const score = (id: string) => (id === 'sc_total' ? 12 : id === 'sc_sev' ? 'moderate' : null)
  expect(buildScoreDisplay(runtime, score)).toEqual([{ id: 'sc_total', name: 'Total', value: 12 }])
})
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `cd web-viewer && npx vitest run src/scoring/display.test.ts`
Expected: FAIL (`buildScoreDisplay` not exported).

- [ ] **Step 3: Implement `buildScoreDisplay`**

In `web-viewer/src/scoring/display.ts`, add the import and function (keep existing `displayScores`):

```typescript
import type { EvalValue } from '../logic/types'

export type ScoreDisplay = { id: string; name: string; value: number }

/** Display-ready projection persisted at completion: named scores with a numeric value. */
export function buildScoreDisplay(runtime: Runtime, score: (id: string) => EvalValue): ScoreDisplay[] {
  const out: ScoreDisplay[] = []
  for (const d of displayScores(runtime)) {
    const v = score(d.id)
    if (typeof v === 'number' && Number.isFinite(v)) out.push({ id: d.id, name: d.name, value: v })
  }
  return out
}
```

(`Runtime` is already imported in this file; if not, add `import type { Runtime } from '../renderer/types'`.)

- [ ] **Step 4: Run it to confirm it passes**

Run: `cd web-viewer && npx vitest run src/scoring/display.test.ts`
Expected: PASS.

- [ ] **Step 5: Write the failing `submitScorerOutputs` test**

In `web-viewer/src/app/bootstrap.test.ts`, add:

```typescript
import { submitScorerOutputs } from './bootstrap'

test('submitScorerOutputs includes x_score_display when provided', async () => {
  const fetchMock = vi.fn().mockResolvedValue(new Response('{}', { status: 202 }))
  vi.stubGlobal('fetch', fetchMock)
  await submitScorerOutputs('http://vs', 's1', 't1', { 'scr_x@v26.0602': { total: 1 } },
    [{ id: 'sc', name: 'N', value: 1 }])
  const body = JSON.parse(fetchMock.mock.calls[0][1].body as string)
  expect(body.x_score_display).toEqual([{ id: 'sc', name: 'N', value: 1 }])
  expect(body['scr_x@v26.0602']).toEqual({ total: 1 })
})
```

(If `vi` is not imported in this file, add `import { vi } from 'vitest'`.)

- [ ] **Step 6: Run it to confirm it fails**

Run: `cd web-viewer && npx vitest run src/app/bootstrap.test.ts -t x_score_display`
Expected: FAIL (`body.x_score_display` is `undefined`).

- [ ] **Step 7: Extend `submitScorerOutputs`**

In `web-viewer/src/app/bootstrap.ts`, replace `submitScorerOutputs` with:

```typescript
import type { ScoreDisplay } from '../scoring/display'

export async function submitScorerOutputs(vsBaseUrl: string, sessionId: string, token: string, outputs: Record<string, unknown>, scoreDisplay?: ScoreDisplay[]): Promise<boolean> {
  const body = scoreDisplay && scoreDisplay.length ? { ...outputs, x_score_display: scoreDisplay } : outputs
  try {
    const r = await fetch(`${vsBaseUrl}/v1/sessions/${sessionId}/scorer_outputs`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    })
    return r.ok
  } catch {
    return false
  }
}
```

- [ ] **Step 8: Run it to confirm it passes**

Run: `cd web-viewer && npx vitest run src/app/bootstrap.test.ts`
Expected: PASS.

- [ ] **Step 9: Compute + pass the projection at completion**

In `web-viewer/src/app/App.tsx`: add `buildScoreDisplay` to the existing `displayScores` import from
`'../scoring/display'`, then in the finishing effect replace the scorer-outputs persist block (the
`const scorerOutputs = pl.cache.scorerOutputs()` / `if (... Object.keys(scorerOutputs).length > 0)`
lines) with:

```typescript
      const scorerOutputs = pl.cache.scorerOutputs()
      const scoreDisplay = buildScoreDisplay(state.runtime!, pl.cache.resolver.score)
      if (!ephemeralRef.current && !localRun && Object.keys(scorerOutputs).length > 0) {
        await submitScorerOutputs(params.vsBaseUrl, pl.identity.sessionId, token, scorerOutputs, scoreDisplay)
      }
```

- [ ] **Step 10: Typecheck + run the player suite**

Run: `cd web-viewer && npm run typecheck && npx vitest run`
Expected: typecheck clean; all tests PASS.

- [ ] **Step 11: Commit**

```bash
git add web-viewer/
git commit -m "feat(web-viewer): persist display-ready score projection (x_score_display)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: participant-app — `score_display` type + `groupByInstrument`

**Files:**
- Modify: `participant-app/src/mydata/client.ts` (`ScoreDisplay` + `MySession.score_display`)
- Create: `participant-app/src/mydata/progression.ts`
- Test: `participant-app/src/mydata/progression.test.ts`

**Interfaces:**
- Consumes: `MySession` (extended with `score_display`).
- Produces: `ScoreDisplay = { id: string; name: string; value: number }`; `ScoreSeries = { id: string; name: string; points: { date: string; value: number }[] }`; `InstrumentGroup = { instrument_id: string; instrument_version: string; sessions: MySession[]; series: ScoreSeries[] }`; `groupByInstrument(sessions): InstrumentGroup[]`. Tasks 4–5 consume `ScoreSeries` / `InstrumentGroup`.

- [ ] **Step 1: Extend the `MySession` type**

In `participant-app/src/mydata/client.ts`, add the `ScoreDisplay` type and the new field:

```typescript
export type ScoreDisplay = { id: string; name: string; value: number }

export type MySession = {
  session_id: string; instrument_id: string; instrument_version: string; deployment_id: string
  status: string; session_index: number
  started_at: string | null; completed_at: string | null; submitted_at: string | null
  score_display?: ScoreDisplay[] | null
}
```

- [ ] **Step 2: Write the failing `groupByInstrument` test**

Create `participant-app/src/mydata/progression.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { groupByInstrument } from './progression'
import type { MySession } from './client'

const s = (over: Partial<MySession>): MySession => ({
  session_id: 'x', instrument_id: 'qst_a', instrument_version: 'v1', deployment_id: 'd',
  status: 'submitted', session_index: 1, started_at: null, completed_at: null, submitted_at: null, ...over,
})

describe('groupByInstrument', () => {
  it('groups by instrument and builds chronological series per named score', () => {
    const groups = groupByInstrument([
      s({ instrument_id: 'qst_a', submitted_at: '2026-02-01', score_display: [{ id: 'sc', name: 'Total', value: 8 }] }),
      s({ instrument_id: 'qst_a', submitted_at: '2026-01-01', score_display: [{ id: 'sc', name: 'Total', value: 12 }] }),
      s({ instrument_id: 'qst_b', submitted_at: '2026-01-01', score_display: [{ id: 'sc', name: 'X', value: 3 }] }),
    ])
    const a = groups.find((g) => g.instrument_id === 'qst_a')!
    expect(a.series).toHaveLength(1)
    expect(a.series[0]).toEqual({ id: 'sc', name: 'Total', points: [
      { date: '2026-01-01', value: 12 }, { date: '2026-02-01', value: 8 },   // chronological
    ] })
    expect(groups.map((g) => g.instrument_id).sort()).toEqual(['qst_a', 'qst_b'])
  })

  it('omits sessions without a date or score_display from series', () => {
    const groups = groupByInstrument([
      s({ instrument_id: 'qst_a', submitted_at: null, completed_at: null, started_at: null, score_display: [{ id: 'sc', name: 'T', value: 1 }] }),
      s({ instrument_id: 'qst_a', submitted_at: '2026-01-01', score_display: null }),
    ])
    expect(groups[0].series).toEqual([])
  })
})
```

- [ ] **Step 3: Run it to confirm it fails**

Run: `cd participant-app && npx vitest run src/mydata/progression.test.ts`
Expected: FAIL (`progression.ts` does not exist).

- [ ] **Step 4: Implement `progression.ts`**

Create `participant-app/src/mydata/progression.ts`:

```typescript
import type { MySession } from './client'

export type ScoreSeries = { id: string; name: string; points: { date: string; value: number }[] }
export type InstrumentGroup = { instrument_id: string; instrument_version: string; sessions: MySession[]; series: ScoreSeries[] }

function sessionDate(s: MySession): string | null {
  return s.submitted_at ?? s.completed_at ?? s.started_at
}

/** Group a participant's sessions by questionnaire, with a chronological series per named score. */
export function groupByInstrument(sessions: MySession[]): InstrumentGroup[] {
  const byInstrument = new Map<string, MySession[]>()
  for (const s of sessions) {
    const arr = byInstrument.get(s.instrument_id) ?? []
    arr.push(s)
    byInstrument.set(s.instrument_id, arr)
  }
  const groups: InstrumentGroup[] = []
  for (const [instrument_id, list] of byInstrument) {
    const chrono = [...list].sort((a, b) => (sessionDate(a) ?? '').localeCompare(sessionDate(b) ?? ''))
    const byScore = new Map<string, ScoreSeries>()
    for (const s of chrono) {
      const date = sessionDate(s)
      if (!date || !s.score_display) continue
      for (const sc of s.score_display) {
        const ser = byScore.get(sc.id) ?? { id: sc.id, name: sc.name, points: [] }
        ser.points.push({ date, value: sc.value })
        byScore.set(sc.id, ser)
      }
    }
    groups.push({
      instrument_id,
      instrument_version: list[0].instrument_version,
      sessions: list,                       // preserve incoming order (endpoint returns newest-first) for cards
      series: [...byScore.values()],
    })
  }
  return groups
}
```

- [ ] **Step 5: Run it to confirm it passes**

Run: `cd participant-app && npx vitest run src/mydata/progression.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add participant-app/src/mydata/client.ts participant-app/src/mydata/progression.ts participant-app/src/mydata/progression.test.ts
git commit -m "feat(participant-app): score_display type + groupByInstrument

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: participant-app — `<ScoreSparkline>` (SVG + table fallback)

**Files:**
- Create: `participant-app/src/mydata/ScoreSparkline.tsx`
- Test: `participant-app/src/mydata/ScoreSparkline.test.tsx`

**Interfaces:**
- Consumes: `ScoreSeries` from `progression.ts`.
- Produces: `<ScoreSparkline series={ScoreSeries} />` — renders an `<svg role="img">` with a `<polyline>` of N points plus a visually-hidden `<table>` (date, value). Renders nothing for `<2` points. Task 5 mounts it.

- [ ] **Step 1: Write the failing test**

Create `participant-app/src/mydata/ScoreSparkline.test.tsx`:

```typescript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ScoreSparkline } from './ScoreSparkline'

const series = { id: 'sc', name: 'Total', points: [
  { date: '2026-01-01', value: 12 }, { date: '2026-02-01', value: 8 }, { date: '2026-03-01', value: 5 },
] }

describe('ScoreSparkline', () => {
  it('renders a labelled chart with a polyline and a data-table fallback', () => {
    const { container } = render(<ScoreSparkline series={series} />)
    expect(screen.getByRole('img', { name: /total over time/i })).toBeInTheDocument()
    const poly = container.querySelector('polyline')!
    expect(poly.getAttribute('points')!.trim().split(/\s+/)).toHaveLength(3)   // one coord pair per point
    expect(screen.getAllByRole('row')).toHaveLength(4)                         // header + 3 data rows
    expect(screen.getByText('5')).toBeInTheDocument()                          // latest value readout
  })

  it('renders nothing for fewer than two points', () => {
    const { container } = render(<ScoreSparkline series={{ id: 'sc', name: 'T', points: [{ date: '2026-01-01', value: 1 }] }} />)
    expect(container).toBeEmptyDOMElement()
  })
})
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `cd participant-app && npx vitest run src/mydata/ScoreSparkline.test.tsx`
Expected: FAIL (`ScoreSparkline` does not exist).

- [ ] **Step 3: Implement `ScoreSparkline.tsx`**

Create `participant-app/src/mydata/ScoreSparkline.tsx`:

```tsx
import type { ScoreSeries } from './progression'

const W = 280, H = 64, PAD = 10

function fmtDate(iso: string): string {
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

/** A dependency-free SVG line chart of one named score over time, with a visually-hidden table. */
export function ScoreSparkline({ series }: { series: ScoreSeries }) {
  const pts = series.points
  if (pts.length < 2) return null
  const values = pts.map((p) => p.value)
  const min = Math.min(...values), max = Math.max(...values)
  const span = max - min || 1
  const xy = pts.map((p, i) => {
    const x = PAD + (i * (W - 2 * PAD)) / (pts.length - 1)
    const y = H - PAD - ((p.value - min) / span) * (H - 2 * PAD)   // higher value sits higher
    return [x, y] as const
  })
  const latest = pts[pts.length - 1].value

  return (
    <figure className="m-0 rounded-xl border border-zinc-200/80 bg-white p-4">
      <figcaption className="mb-2 flex items-baseline justify-between">
        <span className="text-sm font-semibold text-zinc-800">{series.name}</span>
        <span className="text-sm text-zinc-500">latest <span className="font-semibold tabular-nums text-zinc-900">{latest}</span></span>
      </figcaption>
      <svg role="img" aria-label={`${series.name} over time`} viewBox={`0 0 ${W} ${H}`} className="h-16 w-full">
        <polyline fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"
          className="text-zinc-900" points={xy.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ')} />
        {xy.map(([x, y], i) => <circle key={i} cx={x} cy={y} r="2.5" className="fill-zinc-900" />)}
      </svg>
      <table className="sr-only">
        <caption>{series.name} over time</caption>
        <thead><tr><th>Date</th><th>Score</th></tr></thead>
        <tbody>
          {pts.map((p, i) => <tr key={i}><td>{fmtDate(p.date)}</td><td>{p.value}</td></tr>)}
        </tbody>
      </table>
    </figure>
  )
}
```

- [ ] **Step 4: Run it to confirm it passes**

Run: `cd participant-app && npx vitest run src/mydata/ScoreSparkline.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add participant-app/src/mydata/ScoreSparkline.tsx participant-app/src/mydata/ScoreSparkline.test.tsx
git commit -m "feat(participant-app): ScoreSparkline (dependency-free SVG + table fallback)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: participant-app — wire progression into My Data

**Files:**
- Modify: `participant-app/src/mydata/MyDataView.tsx`
- Test: `participant-app/src/mydata/MyDataView.test.tsx`

**Interfaces:**
- Consumes: `groupByInstrument` (Task 3), `<ScoreSparkline>` (Task 4), `MySession` (Task 3).
- Produces: the My Data page renders, per questionnaire, any `series` with ≥2 points as charts above that questionnaire's attempt cards.

- [ ] **Step 1: Write the failing test**

In `participant-app/src/mydata/MyDataView.test.tsx`, add this test. It reuses the file's existing
`authed(sessions)` and `renderView()` helpers:

```typescript
test('renders a score-progression chart for a questionnaire with >=2 scored attempts', async () => {
  authed([
    { session_id: 'a', instrument_id: 'qst_phq9', instrument_version: 'v1', deployment_id: 'd',
      status: 'submitted', session_index: 2, started_at: null, completed_at: null,
      submitted_at: '2026-02-01', score_display: [{ id: 'sc', name: 'PHQ-9 total', value: 8 }] },
    { session_id: 'b', instrument_id: 'qst_phq9', instrument_version: 'v1', deployment_id: 'd',
      status: 'submitted', session_index: 1, started_at: null, completed_at: null,
      submitted_at: '2026-01-01', score_display: [{ id: 'sc', name: 'PHQ-9 total', value: 12 }] },
  ])
  renderView()
  expect(await screen.findByRole('img', { name: /phq-9 total over time/i })).toBeInTheDocument()
})
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `cd participant-app && npx vitest run src/mydata/MyDataView.test.tsx -t progression`
Expected: FAIL (no chart rendered yet).

- [ ] **Step 3: Group the list + render charts in `MyDataView`**

In `participant-app/src/mydata/MyDataView.tsx`:

(a) Add imports at the top:

```typescript
import { groupByInstrument } from './progression'
import { ScoreSparkline } from './ScoreSparkline'
```

(b) Replace the success branch list (the `<ul className="space-y-4">{sessions.map(...)}</ul>` block)
with grouped rendering:

```tsx
      ) : (
        <div className="space-y-8">
          {groupByInstrument(sessions).map((g) => {
            const charts = g.series.filter((s) => s.points.length >= 2)
            return (
              <section key={g.instrument_id} className="space-y-4">
                {charts.length > 0 && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {charts.map((s) => <ScoreSparkline key={s.id} series={s} />)}
                  </div>
                )}
                <ul className="space-y-4">{g.sessions.map((s) => <SessionRow key={s.session_id} s={s} />)}</ul>
              </section>
            )
          })}
        </div>
      )}
```

- [ ] **Step 4: Run the participant-app suite + typecheck**

Run: `cd participant-app && npm run typecheck && npx vitest run`
Expected: typecheck clean; all tests PASS (existing My Data tests still pass — the flat list became grouped sections but the same `SessionRow`s render).

- [ ] **Step 5: Commit**

```bash
git add participant-app/src/mydata/MyDataView.tsx participant-app/src/mydata/MyDataView.test.tsx
git commit -m "feat(participant-app): score-progression charts in My Data

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 6: Docs + finish

**Files:**
- Modify: `viewer-service/README.md` (note `score_display` on `/me/sessions` + the `x_score_display` sidecar)
- Modify: `participant-app/HANDOFF.md` (note the #4 dashboard as done)
- Modify: `web-viewer/FOLLOWUPS.md` (the score-display persist; note no backfill)

- [ ] **Step 1: Update the three docs**

Add concise notes (no-space em-dashes):
- `viewer-service/README.md` endpoint table: `POST /sessions/{id}/scorer_outputs` also accepts an `x_score_display` sidecar (display projection) stored in `session.score_display`; `GET /v1/me/sessions` returns `score_display`.
- `participant-app/HANDOFF.md`: under the owner-requests block, mark **#4 score-progression** done (charts in My Data; data via `/me/sessions` `score_display`; no backfill of pre-existing sessions).
- `web-viewer/FOLLOWUPS.md`: the player now persists `x_score_display` at completion alongside `scorer_outputs`.

- [ ] **Step 2: Run all three suites once more**

Run:
```bash
cd web-viewer && npm run typecheck && npx vitest run
cd ../participant-app && npm run typecheck && npx vitest run
cd ../viewer-service && DOCKER_CONFIG=/tmp/lib_docker python -m pytest -q
```
Expected: all green.

- [ ] **Step 3: Commit + merge to master + push**

```bash
git add viewer-service/README.md participant-app/HANDOFF.md web-viewer/FOLLOWUPS.md
git commit -m "docs: score-progression dashboard (#4)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
git fetch origin && git checkout master && git pull --ff-only && git merge --ff-only <branch> && git push origin master
```

---

## Deployment (gated on owner confirmation)

After merge, the feature needs (each is an outward-facing prod step, confirm first):
1. Apply `ALTER TABLE session ADD COLUMN score_display jsonb` to the live shared DB (`questionnaire-identity`, ref `vknmmbcenrgorexxqhxv`) via the Supabase MCP — idempotent.
2. Redeploy **vs** (the endpoint changes) and **player** (persist) and **portal** (`participant-app` charts) via `scripts/redeploy-participant-stack.sh vs|player|portal`.
3. `score_display` only populates for sessions completed after the player redeploy (no backfill).
