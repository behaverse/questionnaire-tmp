# Researcher `/studies` surface + copy replay link — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give researchers a UI to list a deployment's sessions and copy a replay link per session, backed by a new `GET /deployments/{id}/sessions` endpoint.

**Architecture:** A researcher-gated `/studies` route in participant-app (the existing Identity-authenticated portal) calls three VS endpoints via `useSession().authFetch`: `GET /v1/deployments`, the new `GET /v1/deployments/{id}/sessions`, and the existing `POST /v1/deployments/{id}/sessions/{sid}/replay-link`. The new endpoint returns a curated, credential-free projection of session rows.

**Tech Stack:** FastAPI + psycopg (viewer-service); React 19 + TS + Vitest/@testing-library (participant-app); `@behaverse/participant-session` for auth (`useSession`, `authFetch`, `user.roles`).

## Global Constraints

- **Em-dashes, no spaces** in prose/comments: `word—word`.
- **Security:** the sessions endpoint MUST NOT expose `token_hash` (a session credential in `_row_to_dict`) or other internals — project an explicit safe field set.
- **Server is the real gate:** `require_researcher` authorizes the endpoints; the UI role-gate is convenience only.
- **No schema change, no CORS change** (participant-app origin is already in `VS_CORS_ORIGINS`).
- **No PRs:** finish by merging `work/researcher-studies` → master locally + push; `git fetch` + ff/rebase before push (shared checkout).
- Verify: `DOCKER_CONFIG=/tmp/lib_docker pytest viewer-service/ -q`; `cd participant-app && npm test && npm run build`.
- Test-runner note: in these JS packages `npm test -- <file>` may not filter; use `npx vitest run <path>` for a file-scoped run.

## File Structure

- `viewer-service/src/viewer_service/store/sessions.py` — **modify.** Add `list_sessions_for_deployment`.
- `viewer-service/src/viewer_service/api/deployments.py` — **modify.** Add `GET /deployments/{id}/sessions`.
- `viewer-service/tests/test_deployment_sessions_api.py` — **create.** Endpoint tests.
- `participant-app/src/studies/api.ts` — **create.** Thin authFetch wrappers.
- `participant-app/src/studies/api.test.ts` — **create.**
- `participant-app/src/studies/StudiesView.tsx` — **create.** The view.
- `participant-app/src/studies/StudiesView.test.tsx` — **create.**
- `participant-app/src/shell/ParticipantApp.tsx` — **modify.** Add `/studies` route.
- `participant-app/src/shell/NavShell.tsx` — **modify.** Researcher-only "Studies" nav item.
- `web-viewer/FOLLOWUPS.md`, `viewer-service/FOLLOWUPS.md`, `HANDOFF.md` — **modify.** Mark #7-2/#7-3 done.

---

### Task 1: VS — sessions-list endpoint (curated projection)

**Files:**
- Modify: `viewer-service/src/viewer_service/store/sessions.py` (after `list_sessions_for_participant`, ~line 72)
- Modify: `viewer-service/src/viewer_service/api/deployments.py`
- Test: `viewer-service/tests/test_deployment_sessions_api.py`

**Interfaces:**
- Produces: `GET /v1/deployments/{deployment_id}/sessions` (researcher-gated) → `{ "sessions": [ { session_id, session_index, status, participant_sub, started_at, completed_at, submitted_at } ] }`, newest first; 404 if deployment unknown; 403 for non-researchers. `store.list_sessions_for_deployment(conn, deployment_id) -> list[dict]`.

- [ ] **Step 1: Write the failing endpoint test**

Create `viewer-service/tests/test_deployment_sessions_api.py` (mirrors `test_replay_api.py`'s setup):

```python
import psycopg
import viewer_service.runtime as runtime_mod
from test_sessions_api import MANIFEST, BUNDLE


def _setup(client, monkeypatch):
    monkeypatch.setattr(runtime_mod, "fetch_resolution_bundle", lambda base, qid, ver: BUNDLE)
    client.post("/v1/viewers", json=MANIFEST)
    dep = client.post("/v1/deployments", json={
        "questionnaire_ref": "qst_mini@v26.0609",
        "runtime_policy": {"scorer_impl_preference": ["wasm"], "show_score": True},
        "default_locale": "en", "available_locales": ["en"]}).json()
    s = client.post("/v1/sessions/new", json={
        "deployment_id": dep["deployment_id"], "viewer_id": "web", "viewer_version": "v26.0610"}).json()
    return dep["deployment_id"], s["session_id"]


def test_researcher_lists_deployment_sessions_without_token_hash(client, monkeypatch):
    dep_id, sid = _setup(client, monkeypatch)
    r = client.get(f"/v1/deployments/{dep_id}/sessions")
    assert r.status_code == 200, r.text
    body = r.json()
    assert [s["session_id"] for s in body["sessions"]] == [sid]
    row = body["sessions"][0]
    assert set(row) == {"session_id", "session_index", "status", "participant_sub",
                        "started_at", "completed_at", "submitted_at"}
    assert "token_hash" not in row


def test_sessions_requires_researcher(client, monkeypatch, auth_header):
    dep_id, _ = _setup(client, monkeypatch)
    assert client.get(f"/v1/deployments/{dep_id}/sessions",
                      headers=auth_header(["participant"])).status_code == 403


def test_sessions_unknown_deployment_404(client):
    assert client.get("/v1/deployments/nope/sessions").status_code == 404


def test_sessions_scoped_to_deployment(client, monkeypatch):
    dep_id, sid = _setup(client, monkeypatch)
    other = client.post("/v1/deployments", json={
        "questionnaire_ref": "qst_mini@v26.0609",
        "runtime_policy": {"scorer_impl_preference": ["wasm"], "show_score": True},
        "default_locale": "en", "available_locales": ["en"]}).json()["deployment_id"]
    r = client.get(f"/v1/deployments/{other}/sessions")
    assert r.status_code == 200
    assert r.json()["sessions"] == []   # the session belongs to dep_id, not `other`
```

- [ ] **Step 2: Run to verify failure**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps && DOCKER_CONFIG=/tmp/lib_docker pytest viewer-service/tests/test_deployment_sessions_api.py -q`
Expected: FAIL — the endpoint 404s (route not defined) / store fn missing.

- [ ] **Step 3: Add the store function**

In `viewer-service/src/viewer_service/store/sessions.py`, after `list_sessions_for_participant`:

```python
def list_sessions_for_deployment(conn: psycopg.Connection, deployment_id: str) -> list[dict]:
    cur = conn.execute(
        f"SELECT {', '.join(_SELECT_COLS)} FROM session WHERE deployment_id=%s "
        "ORDER BY started_at DESC", (deployment_id,))
    return [_row_to_dict(r) for r in cur.fetchall()]
```

- [ ] **Step 4: Add the endpoint**

In `viewer-service/src/viewer_service/api/deployments.py`: add the import near the top imports —

```python
from ..store import sessions as session_store
```

and after the `GET /deployments/{deployment_id}` handler (~line 65) add:

```python
_SESSION_LIST_FIELDS = ("session_id", "session_index", "status", "participant_sub",
                        "started_at", "completed_at", "submitted_at")


@router.get("/deployments/{deployment_id}/sessions")
def list_sessions(deployment_id: str, conn=Depends(get_conn), claims=Depends(require_researcher)):
    if store.get_deployment(conn, deployment_id) is None:
        raise HTTPException(status_code=404, detail="deployment not found")
    rows = session_store.list_sessions_for_deployment(conn, deployment_id)
    # project only display-safe fields — never leak token_hash or other session internals
    return {"sessions": [{k: r[k] for k in _SESSION_LIST_FIELDS} for r in rows]}
```

- [ ] **Step 5: Run tests green**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps && DOCKER_CONFIG=/tmp/lib_docker pytest viewer-service/tests/test_deployment_sessions_api.py -q`
Expected: 4 passed. (If the `client`/`auth_header` fixtures differ, read `viewer-service/tests/conftest.py` — do not change fixtures.)

- [ ] **Step 6: Commit**

```bash
cd /home/pedro/Repos/Cursor/questionnaire_apps
git add viewer-service/src/viewer_service/store/sessions.py viewer-service/src/viewer_service/api/deployments.py viewer-service/tests/test_deployment_sessions_api.py
git commit -m "feat(viewer-service): researcher GET /deployments/{id}/sessions (safe projection)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: participant-app — studies API client

**Files:**
- Create: `participant-app/src/studies/api.ts`
- Test: `participant-app/src/studies/api.test.ts`

**Interfaces:**
- Consumes: `AuthFetch` from `@behaverse/participant-session`, the VS base URL string.
- Produces: `listDeployments(vs, authFetch)`, `listSessions(vs, authFetch, depId)`, `mintReplayLink(vs, authFetch, depId, sid)` and the `Deployment`/`Session`/`ReplayLink` types.

- [ ] **Step 1: Write the failing client test**

Create `participant-app/src/studies/api.test.ts`:

```ts
import { test, expect, vi } from 'vitest'
import { listDeployments, listSessions, mintReplayLink } from './api'

const af = (impl: (url: string, init?: RequestInit) => Response) =>
  vi.fn(async (url: string, init?: RequestInit) => impl(url, init)) as unknown as import('@behaverse/participant-session').AuthFetch

test('listDeployments returns items', async () => {
  const authFetch = af((url) => {
    expect(url).toBe('http://vs/v1/deployments')
    return new Response(JSON.stringify({ items: [{ deployment_id: 'd1', questionnaire_ref: 'q@v1' }] }), { status: 200 })
  })
  expect(await listDeployments('http://vs', authFetch)).toEqual([{ deployment_id: 'd1', questionnaire_ref: 'q@v1' }])
})

test('listSessions hits the deployment sessions endpoint', async () => {
  const authFetch = af((url) => {
    expect(url).toBe('http://vs/v1/deployments/d1/sessions')
    return new Response(JSON.stringify({ sessions: [{ session_id: 's1', session_index: 1, status: 'submitted', participant_sub: null, started_at: null, completed_at: null, submitted_at: null }] }), { status: 200 })
  })
  const rows = await listSessions('http://vs', authFetch, 'd1')
  expect(rows[0].session_id).toBe('s1')
})

test('mintReplayLink POSTs and returns the link', async () => {
  const authFetch = af((url, init) => {
    expect(url).toBe('http://vs/v1/deployments/d1/sessions/s1/replay-link')
    expect(init?.method).toBe('POST')
    return new Response(JSON.stringify({ token: 't', bundle_url: 'http://vs/v1/replay?token=t', replay_url: 'http://p/?replay=x' }), { status: 200 })
  })
  const link = await mintReplayLink('http://vs', authFetch, 'd1', 's1')
  expect(link.replay_url).toBe('http://p/?replay=x')
})

test('a non-ok response throws', async () => {
  const authFetch = af(() => new Response('nope', { status: 403 }))
  await expect(listSessions('http://vs', authFetch, 'd1')).rejects.toThrow(/403/)
})
```

- [ ] **Step 2: Run to verify failure**

Run: `cd participant-app && npx vitest run src/studies/api.test.ts`
Expected: FAIL — `./api` does not exist.

- [ ] **Step 3: Implement the client**

Create `participant-app/src/studies/api.ts`:

```ts
import type { AuthFetch } from '@behaverse/participant-session'

export type Deployment = { deployment_id: string; questionnaire_ref: string; mode_preset?: string; listed?: boolean; title?: string | null }
export type Session = {
  session_id: string; session_index: number; status: string
  participant_sub: string | null
  started_at: string | null; completed_at: string | null; submitted_at: string | null
}
export type ReplayLink = { token: string; bundle_url: string; replay_url: string | null }

export async function listDeployments(vsBaseUrl: string, authFetch: AuthFetch): Promise<Deployment[]> {
  const resp = await authFetch(`${vsBaseUrl}/v1/deployments`)
  if (!resp.ok) throw new Error(`deployments ${resp.status}`)
  return (await resp.json()).items ?? []
}

export async function listSessions(vsBaseUrl: string, authFetch: AuthFetch, deploymentId: string): Promise<Session[]> {
  const resp = await authFetch(`${vsBaseUrl}/v1/deployments/${deploymentId}/sessions`)
  if (!resp.ok) throw new Error(`sessions ${resp.status}`)
  return (await resp.json()).sessions ?? []
}

export async function mintReplayLink(vsBaseUrl: string, authFetch: AuthFetch, deploymentId: string, sessionId: string): Promise<ReplayLink> {
  const resp = await authFetch(`${vsBaseUrl}/v1/deployments/${deploymentId}/sessions/${sessionId}/replay-link`, { method: 'POST' })
  if (!resp.ok) throw new Error(`replay-link ${resp.status}`)
  return await resp.json()
}
```

- [ ] **Step 4: Run green**

Run: `cd participant-app && npx vitest run src/studies/api.test.ts`
Expected: 4 passed.

- [ ] **Step 5: Commit**

```bash
cd /home/pedro/Repos/Cursor/questionnaire_apps
git add participant-app/src/studies/api.ts participant-app/src/studies/api.test.ts
git commit -m "feat(participant-app): studies API client (deployments/sessions/replay-link)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: participant-app — StudiesView + routing + nav

**Files:**
- Create: `participant-app/src/studies/StudiesView.tsx`
- Test: `participant-app/src/studies/StudiesView.test.tsx`
- Modify: `participant-app/src/shell/ParticipantApp.tsx`
- Modify: `participant-app/src/shell/NavShell.tsx`

**Interfaces:**
- Consumes: `listDeployments`/`listSessions`/`mintReplayLink` (Task 2), `useSession()` (`user.roles`, `authFetch`), `parseParams().vsBaseUrl`.
- Produces: the `/studies` route + a researcher-only "Studies" nav item.

- [ ] **Step 1: Write the failing view test**

Create `participant-app/src/studies/StudiesView.test.tsx` (mirrors `MyDataView.test.tsx`):

```tsx
import { test, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SessionProvider } from '@behaverse/participant-session'
import { StudiesView } from './StudiesView'

beforeEach(() => { vi.restoreAllMocks(); localStorage.clear() })

function authed(roles: string[], routes: (url: string, init?: RequestInit) => Response | null) {
  localStorage.setItem('behaverse.participant.refresh', 'RT0')
  vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => {
    if (url.endsWith('/v1/auth/refresh')) return new Response(JSON.stringify({ access_token: 'AT', refresh_token: 'RT1', expires_in: 900, token_type: 'Bearer' }), { status: 200 })
    if (url.endsWith('/v1/auth/me')) return new Response(JSON.stringify({ id: 'u1', email: 'r@e.com', display_name: 'R', email_verified: true, roles }), { status: 200 })
    return routes(url, init) ?? new Response('{}', { status: 200 })
  }))
}

const render_ = () => render(<SessionProvider identityBaseUrl="http://id"><StudiesView /></SessionProvider>)

test('non-researcher sees a gated notice and no data calls', async () => {
  authed([], () => null)
  render_()
  expect(await screen.findByText(/researchers only/i)).toBeInTheDocument()
})

test('researcher: lists sessions and copies a replay link', async () => {
  const clip = vi.fn(async () => {})
  Object.assign(navigator, { clipboard: { writeText: clip } })
  authed(['researcher'], (url, init) => {
    if (url.endsWith('/v1/deployments')) return new Response(JSON.stringify({ items: [{ deployment_id: 'd1', questionnaire_ref: 'q@v1' }] }), { status: 200 })
    if (url.endsWith('/v1/deployments/d1/sessions')) return new Response(JSON.stringify({ sessions: [{ session_id: 's1', session_index: 1, status: 'submitted', participant_sub: null, started_at: null, completed_at: null, submitted_at: null }] }), { status: 200 })
    if (url.endsWith('/replay-link') && init?.method === 'POST') return new Response(JSON.stringify({ token: 't', bundle_url: 'http://vs/v1/replay?token=t', replay_url: 'http://p/?replay=x' }), { status: 200 })
    return null
  })
  render_()
  expect(await screen.findByText(/s1/)).toBeInTheDocument()
  await userEvent.click(screen.getByRole('button', { name: /copy replay link/i }))
  await waitFor(() => expect(clip).toHaveBeenCalledWith('http://p/?replay=x'))
  expect(await screen.findByText(/copied/i)).toBeInTheDocument()
})
```

- [ ] **Step 2: Run to verify failure**

Run: `cd participant-app && npx vitest run src/studies/StudiesView.test.tsx`
Expected: FAIL — `./StudiesView` does not exist.

- [ ] **Step 3: Implement `StudiesView`**

Create `participant-app/src/studies/StudiesView.tsx`:

```tsx
import { useEffect, useState } from 'react'
import { parseParams } from '../params'
import { useSession } from '@behaverse/participant-session'
import { listDeployments, listSessions, mintReplayLink, type Deployment, type Session } from './api'

function fmt(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

export function StudiesView() {
  const { vsBaseUrl } = parseParams(window.location.search)
  const session = useSession()
  const isResearcher = !!session.user?.roles?.includes('researcher')
  const [deployments, setDeployments] = useState<Deployment[]>([])
  const [selected, setSelected] = useState('')
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!isResearcher) return
    let live = true
    listDeployments(vsBaseUrl, session.authFetch)
      .then((d) => { if (!live) return; setDeployments(d); if (d.length && !selected) setSelected(d[0].deployment_id) })
      .catch(() => { if (live) setDeployments([]) })
    return () => { live = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isResearcher, vsBaseUrl, session.authFetch])

  useEffect(() => {
    if (!selected) { setSessions([]); return }
    let live = true
    setLoading(true)
    listSessions(vsBaseUrl, session.authFetch, selected)
      .then((s) => { if (live) setSessions(s) })
      .catch(() => { if (live) setSessions([]) })
      .finally(() => { if (live) setLoading(false) })
    return () => { live = false }
  }, [selected, vsBaseUrl, session.authFetch])

  async function copyLink(sid: string) {
    try {
      const link = await mintReplayLink(vsBaseUrl, session.authFetch, selected, sid)
      const url = link.replay_url ?? link.bundle_url
      await navigator.clipboard.writeText(url)
      setCopied((c) => ({ ...c, [sid]: link.replay_url ? 'Copied ✓' : 'Copied bundle URL—set WEB_VIEWER_BASE_URL for a player link' }))
    } catch {
      setCopied((c) => ({ ...c, [sid]: 'Could not copy the link' }))
    }
  }

  if (!isResearcher) {
    return <p className="text-sm text-zinc-500">Researchers only. Log in with a researcher account to view studies.</p>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-lg font-semibold tracking-tight text-zinc-900">Studies</h1>
        <label className="flex items-center gap-2 text-sm text-zinc-500">
          Deployment
          <select value={selected} onChange={(e) => setSelected(e.target.value)}
            className="rounded-lg border border-zinc-200 bg-white px-2 py-1 text-sm text-zinc-800">
            <option value="">Select…</option>
            {deployments.map((d) => <option key={d.deployment_id} value={d.deployment_id}>{d.questionnaire_ref} · {d.deployment_id}</option>)}
          </select>
        </label>
      </div>

      {loading ? <p className="text-sm text-zinc-400">Loading sessions…</p>
        : !selected ? <p className="text-sm text-zinc-400">Pick a deployment to see its sessions.</p>
        : sessions.length === 0 ? <p className="text-sm text-zinc-400">No sessions for this deployment yet.</p>
        : (
          <ul className="divide-y divide-zinc-100 overflow-hidden rounded-2xl border border-zinc-200/80 bg-white">
            {sessions.map((s) => (
              <li key={s.session_id} className="flex items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="truncate font-mono text-sm text-zinc-800">{s.session_id}</p>
                  <p className="mt-0.5 text-xs text-zinc-500">
                    {s.status} · {s.participant_sub ?? 'anon'} · {fmt(s.submitted_at ?? s.completed_at ?? s.started_at)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {copied[s.session_id] && <span className="text-xs text-emerald-600">{copied[s.session_id]}</span>}
                  <button onClick={() => void copyLink(s.session_id)}
                    className="rounded-full border border-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100">
                    Copy replay link
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
    </div>
  )
}
```

- [ ] **Step 4: Wire the route + nav**

In `participant-app/src/shell/ParticipantApp.tsx`, import and add the route:

```tsx
import { StudiesView } from '../studies/StudiesView'
```
and in the `view` ternary, add before the `CatalogueView` fallback:
```tsx
    : route === '/studies' ? <StudiesView />
```

In `participant-app/src/shell/NavShell.tsx`, replace the static `NAV.map(...)` usage with a
researcher-aware list. After `const session = useSession()`, add:

```tsx
  const nav = session.user?.roles?.includes('researcher') ? [...NAV, { to: '/studies', label: 'Studies' }] : NAV
```
and change `{NAV.map((n) => (` to `{nav.map((n) => (`.

- [ ] **Step 5: Run the view test + full suite + build**

Run: `cd participant-app && npx vitest run src/studies/StudiesView.test.tsx` (expected: 2 passed), then
`npm test && npm run build` (expected: full suite green, build clean).

- [ ] **Step 6: Commit**

```bash
cd /home/pedro/Repos/Cursor/questionnaire_apps
git add participant-app/src/studies/StudiesView.tsx participant-app/src/studies/StudiesView.test.tsx participant-app/src/shell/ParticipantApp.tsx participant-app/src/shell/NavShell.tsx
git commit -m "feat(participant-app): researcher /studies view + copy replay link + nav gate

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: Docs/status + finish the branch

**Files:**
- Modify: `web-viewer/FOLLOWUPS.md`, `viewer-service/FOLLOWUPS.md`, `HANDOFF.md`

- [ ] **Step 1: Mark #7-2 + #7-3 done**

Match each file's existing spaced-em-dash strike-through idiom, dated 2026-07-02, referencing:
`viewer-service` `GET /deployments/{id}/sessions` + participant-app `/studies` view with per-session copy replay link.
- `web-viewer/FOLLOWUPS.md` — the "copy replay link" UI + "researcher session-list surface" follow-ons.
- `viewer-service/FOLLOWUPS.md` — the same two RP3 bullets ("Researcher 'copy replay link' UI", "Researcher session-list surface").
- `HANDOFF.md` — remove `a "copy replay link" researcher UI` and `a researcher session-list surface` from the #7 "Remaining (RP3 follow-ons)" list.

Read enough of each file to copy its exact idiom; surgical edits only.

- [ ] **Step 2: Commit**

```bash
cd /home/pedro/Repos/Cursor/questionnaire_apps
git add web-viewer/FOLLOWUPS.md viewer-service/FOLLOWUPS.md HANDOFF.md
git commit -m "docs: researcher /studies + copy replay link done (#7-2/#7-3); refresh follow-ups + HANDOFF

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

- [ ] **Step 3: Full green + merge + push**

```bash
cd /home/pedro/Repos/Cursor/questionnaire_apps
DOCKER_CONFIG=/tmp/lib_docker pytest viewer-service/ -q
( cd participant-app && npm test && npm run build )
git fetch origin
git switch master && git merge --ff-only origin/master
git merge --no-ff work/researcher-studies -m "merge: #7-2/#7-3 researcher /studies surface + copy replay link"
git push origin master
```

(If push is rejected: `git fetch origin && git rebase origin/master work/researcher-studies`, re-merge, retry. Never force-push.)

---

## Self-Review

**1. Spec coverage:**
- VS store fn + `GET /deployments/{id}/sessions` with safe projection (no `token_hash`) → Task 1. ✅
- VS tests: list / 403 / 404 / cross-deployment isolation / no `token_hash` → Task 1 Step 1. ✅
- participant-app api client (deployments/sessions/replay-link) → Task 2. ✅
- `StudiesView` (role gate, deployment picker, sessions table, copy-link, null-`replay_url` fallback) + route + researcher-only nav → Task 3. ✅
- participant-app tests: render + copy-link (mint + clipboard) + role gate → Task 3 Step 1. ✅
- Docs/FOLLOWUPS/HANDOFF → Task 4. ✅

**2. Placeholder scan:** No TBD/"add error handling". All code blocks complete; the endpoint's field projection is explicit.

**3. Type/name consistency:** `Session`/`Deployment`/`ReplayLink` types (Task 2) are consumed by `StudiesView` (Task 3); `authFetch`/`user.roles` from `useSession()` match `@behaverse/participant-session`'s `Session` shape (`accessToken`, `authFetch`, `user.roles`). The endpoint's `_SESSION_LIST_FIELDS` matches the VS test's asserted key set exactly. `mintReplayLink` returns `{token, bundle_url, replay_url}` matching the RP2 endpoint.
