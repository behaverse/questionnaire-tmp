# xAPI surfacing (#3) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A logged-in participant can download their own xAPI activity (their `bdm:`-profile event statements) from the portal.

**Architecture:** Mirror the existing `/me/responses.csv` path. Events are already stored (retained in the `outbox`, `kind='events'`). Add a VS reader + `GET /v1/me/events` JSON download, and a download button in participant-app My Data. No new storage/capture/schema.

**Tech Stack:** Python/FastAPI + Postgres (VS); React 19 + TypeScript + Vite (participant-app); pytest + testcontainers; Vitest.

## Global Constraints

- Surface the stored `bdm:`-profile statements **as-is** (no ADL/IEEE xAPI remap).
- Participant-only; results scoped to `claims["sub"]` (one participant never sees another's events).
- Download only (no in-page viewer). Empty stream → `{"events": []}`.
- No new storage, no new capture, no Schema change.
- Em-dashes have **no surrounding spaces** in any copy.
- VS tests need Docker: run with `DOCKER_CONFIG=/tmp/lib_docker` from `viewer-service/`.
- Finish on a branch, then merge to master + push (no PRs).

---

### Task 1: VS — `iter_event_rows_for_participant` + `GET /v1/me/events`

**Files:**
- Modify: `viewer-service/src/viewer_service/store/export.py` (add the reader)
- Modify: `viewer-service/src/viewer_service/api/me.py` (add the endpoint)
- Test: `viewer-service/tests/test_my_data_api.py`

**Interfaces:**
- Produces: `iter_event_rows_for_participant(conn, participant_sub) -> Iterator[dict]` (yields each `kind='events'` batch payload, a `{batch_id, events:[...]}` dict). `GET /v1/me/events` → `{"events": [...]}` JSON download.

- [ ] **Step 1: Write the failing reader + endpoint test**

In `viewer-service/tests/test_my_data_api.py`, add (the file already imports `psycopg`, `Jsonb`, and has the `_seed` helper + `client`/`auth_header`/`pg_url` fixtures):

```python
def _seed_events(pg_url, sid, events):
    with psycopg.connect(pg_url) as c:
        c.execute("INSERT INTO outbox (session_id, kind, payload, payload_sha256) "
                  "VALUES (%s,'events',%s,%s)",
                  (sid, Jsonb({"batch_id": sid + ":0", "events": events}), "he_" + sid))
        c.commit()

def test_me_events_flattens_and_scopes(client, auth_header, pg_url):
    _seed(pg_url, "alice", "sA")
    _seed(pg_url, "bob", "sB")
    _seed_events(pg_url, "sA", [{"verb": "bdm:selected"}, {"verb": "bdm:completed"}])
    _seed_events(pg_url, "sB", [{"verb": "bdm:selected"}])
    client.headers.pop("authorization", None)
    r = client.get("/v1/me/events", headers=auth_header(["participant"], sub="alice"))
    assert r.status_code == 200
    assert "attachment" in r.headers["content-disposition"]
    assert [e["verb"] for e in r.json()["events"]] == ["bdm:selected", "bdm:completed"]   # bob excluded

def test_me_events_requires_token(client):
    client.headers.pop("authorization", None)
    assert client.get("/v1/me/events").status_code == 401

def test_me_events_empty(client, auth_header):
    client.headers.pop("authorization", None)
    r = client.get("/v1/me/events", headers=auth_header(["participant"], sub="nobody"))
    assert r.status_code == 200 and r.json() == {"events": []}
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `cd viewer-service && DOCKER_CONFIG=/tmp/lib_docker python -m pytest tests/test_my_data_api.py -k me_events -q`
Expected: FAIL (`/v1/me/events` is 404 / not defined).

- [ ] **Step 3: Add the reader**

In `viewer-service/src/viewer_service/store/export.py`, add after `iter_response_rows_for_participant`:

```python
def iter_event_rows_for_participant(conn: psycopg.Connection, participant_sub: str) -> Iterator[dict]:
    """Yield every event batch ({batch_id, events:[...]}) collected for one participant, from the
    outbox. Scoped to session.participant_sub; kind='events' only; insertion order."""
    cur = conn.execute(
        "SELECT o.payload FROM outbox o JOIN session s ON o.session_id = s.session_id "
        "WHERE s.participant_sub = %s AND o.kind = 'events' ORDER BY o.id", (participant_sub,))
    for (payload,) in cur:
        yield payload
```

- [ ] **Step 4: Add the endpoint**

In `viewer-service/src/viewer_service/api/me.py`, change the response import and add the route. Replace
`from fastapi.responses import StreamingResponse` with:

```python
from fastapi.responses import StreamingResponse, JSONResponse
```

Then add (after `my_sessions`, before `my_responses`):

```python
@router.get("/me/events")
def my_events(conn=Depends(get_conn), claims=Depends(require_participant)):
    """Download the caller's xAPI activity (bdm: profile statements), flattened from event batches."""
    events: list = []
    for payload in export_store.iter_event_rows_for_participant(conn, claims["sub"]):
        evs = payload.get("events") if isinstance(payload, dict) else None
        if isinstance(evs, list):
            events.extend(evs)
    return JSONResponse(content={"events": events},
                        headers={"Content-Disposition": 'attachment; filename="my_xapi.json"'})
```

(`export_store`, `get_conn`, and `require_participant` are already imported in this file.)

- [ ] **Step 5: Run the test to confirm it passes**

Run: `cd viewer-service && DOCKER_CONFIG=/tmp/lib_docker python -m pytest tests/test_my_data_api.py -q`
Expected: PASS (all, including the existing `/me/sessions` + `/me/responses.csv` tests).

- [ ] **Step 6: Run the VS suite + commit**

Run: `cd viewer-service && DOCKER_CONFIG=/tmp/lib_docker python -m pytest -q` → PASS (all).

```bash
git add viewer-service/
git commit -m "feat(viewer-service): GET /v1/me/events (participant xAPI download)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: participant-app — `downloadMyEvents` + My Data button

**Files:**
- Modify: `participant-app/src/mydata/client.ts` (add `downloadMyEvents`)
- Modify: `participant-app/src/mydata/MyDataView.tsx` (add the button)
- Test: `participant-app/src/mydata/client.test.ts`, `participant-app/src/mydata/MyDataView.test.tsx`

**Interfaces:**
- Consumes: `GET /v1/me/events` (Task 1).
- Produces: `downloadMyEvents(vsBaseUrl: string, authFetch: AuthFetch): Promise<void>`.

- [ ] **Step 1: Write the failing client test**

In `participant-app/src/mydata/client.test.ts`, add the import `downloadMyEvents` to the existing
`from './client'` import line, then add this test (it mirrors the existing `downloadMyData` test in
the same file; `vi` and `AuthFetch` are already imported there):

```typescript
test('downloadMyEvents fetches /v1/me/events via authFetch and creates an object URL', async () => {
  const authFetch: AuthFetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ events: [] }), { status: 200 }))
  const createObjectURL = vi.fn().mockReturnValue('blob:x')
  const revokeObjectURL = vi.fn()
  vi.stubGlobal('URL', { ...URL, createObjectURL, revokeObjectURL })
  await downloadMyEvents('http://vs', authFetch)
  expect(authFetch).toHaveBeenCalledWith('http://vs/v1/me/events')
  expect(createObjectURL).toHaveBeenCalledOnce()
  expect(revokeObjectURL).toHaveBeenCalledWith('blob:x')
})
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `cd participant-app && npx vitest run src/mydata/client.test.ts -t downloadMyEvents`
Expected: FAIL (`downloadMyEvents` not exported).

- [ ] **Step 3: Implement `downloadMyEvents`**

In `participant-app/src/mydata/client.ts`, add below `downloadMyData`:

```typescript
export async function downloadMyEvents(vsBaseUrl: string, authFetch: AuthFetch): Promise<void> {
  const resp = await authFetch(`${vsBaseUrl}/v1/me/events`)
  if (!resp.ok) throw new Error(`download failed: ${resp.status}`)
  const blob = await resp.blob()
  const objectUrl = URL.createObjectURL(blob)
  try {
    const a = document.createElement('a')
    a.href = objectUrl; a.download = 'my_xapi.json'
    document.body.appendChild(a); a.click(); a.remove()
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}
```

- [ ] **Step 4: Run the client test to confirm it passes**

Run: `cd participant-app && npx vitest run src/mydata/client.test.ts`
Expected: PASS.

- [ ] **Step 5: Write the failing My Data button test**

In `participant-app/src/mydata/MyDataView.test.tsx`, add (reuse the file's `authed(sessions)` +
`renderView()` helpers):

```typescript
test('authed: shows a download-xAPI button', async () => {
  authed([{ session_id: 's1', instrument_id: 'qst_x', instrument_version: 'v1', deployment_id: 'd', status: 'submitted', session_index: 1, started_at: null, completed_at: null, submitted_at: null }])
  renderView()
  expect(await screen.findByRole('button', { name: /download my activity/i })).toBeInTheDocument()
})
```

- [ ] **Step 6: Run it to confirm it fails**

Run: `cd participant-app && npx vitest run src/mydata/MyDataView.test.tsx -t download-xAPI`
Expected: FAIL (no such button).

- [ ] **Step 7: Add the button + handler in `MyDataView`**

In `participant-app/src/mydata/MyDataView.tsx`:

(a) Add `downloadMyEvents` to the existing `./client` import:

```typescript
import { fetchMySessions, downloadMyData, downloadMyEvents, type MySession } from './client'
```

(b) Add a busy state beside `downloading` (near `const [downloading, setDownloading] = useState(false)`):

```typescript
  const [downloadingEvents, setDownloadingEvents] = useState(false)
```

(c) Add a handler beside `handleDownload`:

```typescript
  async function handleDownloadEvents() {
    setDownloadingEvents(true)
    try { await downloadMyEvents(params.vsBaseUrl, session.authFetch) }
    catch (e) { console.error(e) }
    finally { setDownloadingEvents(false) }
  }
```

(d) In the export card, change the single-button row to hold both buttons. Replace the existing
`<button onClick={() => void handleDownload()} ...>` element with:

```tsx
          <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
            <button onClick={() => void handleDownload()} disabled={downloading}
              className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60">
              {downloading ? 'Preparing…' : 'Download my data (CSV)'}
            </button>
            <button onClick={() => void handleDownloadEvents()} disabled={downloadingEvents}
              className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full border border-zinc-300 bg-white px-5 py-2.5 text-sm font-semibold text-zinc-900 shadow-sm transition hover:border-zinc-400 disabled:cursor-not-allowed disabled:opacity-60">
              {downloadingEvents ? 'Preparing…' : 'Download my activity (xAPI)'}
            </button>
          </div>
```

- [ ] **Step 8: Run the participant-app suite + typecheck**

Run: `cd participant-app && npm run typecheck && npx vitest run`
Expected: typecheck clean; all PASS (existing My Data tests still pass).

- [ ] **Step 9: Commit**

```bash
git add participant-app/
git commit -m "feat(participant-app): download my activity (xAPI) in My Data

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: Docs + finish

**Files:**
- Modify: `viewer-service/README.md` (document `GET /v1/me/events`)
- Modify: `participant-app/HANDOFF.md` (mark #3 done)

- [ ] **Step 1: Update the docs**

- `viewer-service/README.md`: under the `/me` section, add a short `#### GET /v1/me/events` note — a
  participant-scoped JSON download (`{"events":[...]}`, `attachment; filename=my_xapi.json`) of the
  caller's `bdm:`-profile xAPI statements, flattened from the outbox; `401` without a token.
- `participant-app/HANDOFF.md`: mark **#3 xAPI surfacing** done — My Data has a "Download my activity
  (xAPI)" button calling `GET /v1/me/events`; statements surfaced as-is in the `bdm:` profile; a
  researcher event export + ADL remap are noted follow-ups.

Use no-space em-dashes.

- [ ] **Step 2: Run all suites once more**

Run:
```bash
cd participant-app && npm run typecheck && npx vitest run
cd ../viewer-service && DOCKER_CONFIG=/tmp/lib_docker python -m pytest -q
```
Expected: all green.

- [ ] **Step 3: Commit + merge + push**

```bash
git add viewer-service/README.md participant-app/HANDOFF.md
git commit -m "docs: xAPI surfacing (#3)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
git fetch origin && git checkout master && git pull --ff-only && git merge --ff-only <branch> && git push origin master
```

---

## Deployment (gated on owner confirmation)

No schema change. After merge, redeploy **vs** (the new endpoint) and **portal** (`participant-app`
button) via `scripts/redeploy-participant-stack.sh vs|portal`. The download reads existing retained
outbox events, so it works for past sessions immediately (no backfill needed).
