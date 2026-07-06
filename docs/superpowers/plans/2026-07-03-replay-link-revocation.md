# Dedicated `REPLAY_SIGNING_SECRET` + per-session revocation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let operators sign replay links with a dedicated secret (rotatable independently of invites) and revoke all replay links for a session, keyed by `session_id`.

**Architecture:** A dedicated `REPLAY_SIGNING_SECRET` resolved as `replay_signing_secret or invite_signing_secret` (non-breaking). Replay tokens gain a sub-second `iat`. A `replay_revocation` table records a per-session `revoked_at`; `GET /v1/replay` rejects (401) any token whose `iat` predates the session's `revoked_at`. A researcher-gated revoke endpoint + a `/studies` "Revoke links" button drive it.

**Tech Stack:** FastAPI + psycopg (viewer-service); React 19 + TS + Vitest (participant-app).

## Global Constraints

- **Em-dashes, no spaces** in new code/prose (`word—word`). The three legacy status docs use spaced em-dashes — match their style there.
- **Non-breaking:** replay must keep working with only `INVITE_SIGNING_SECRET` set (fallback). Setting `REPLAY_SIGNING_SECRET` and rotating it is the intended way to invalidate all replay links.
- **`iat` precision:** when `mint_replay` is called with an explicit `now`, use it verbatim (keeps `now=1000 → exp=1100` unit tests green); when `now is None`, use `time.time()` (float) so `iat` strictly increases and a same-second revoke→re-mint is distinguishable.
- **Server is the gate:** the revoke endpoint and the `GET /v1/replay` revocation check are `require_researcher`/token-authorized on the server; the UI button is convenience.
- Additive schema + config only. No CORS change.
- Verify: `DOCKER_CONFIG=/tmp/lib_docker pytest viewer-service/ -q`; `cd participant-app && npm test && npm run build`. File-scoped JS runs: `npx vitest run <path>`.
- **No PRs:** finish by merging `work/replay-revocation` → master + push; fetch + ff/rebase first (shared checkout).

## File Structure

- `viewer-service/src/viewer_service/config.py` — **modify.** Add `replay_signing_secret`.
- `viewer-service/src/viewer_service/replay_links.py` — **modify.** Sub-second `iat` in the payload.
- `viewer-service/src/viewer_service/api/replay.py` — **modify.** `_replay_secret` helper at mint+verify; revoke endpoint; bundle revocation check.
- `viewer-service/src/viewer_service/store/schema.sql` — **modify.** `replay_revocation` table.
- `viewer-service/src/viewer_service/store/replay_revocation.py` — **create.** `revoke_session`, `revoked_at`.
- `viewer-service/tests/test_replay_links.py` — **modify.** `iat` presence.
- `viewer-service/tests/test_replay_revocation_api.py` — **create.** Secret-rotation + revocation endpoint tests.
- `participant-app/src/studies/api.ts` — **modify.** `revokeReplayLinks`.
- `participant-app/src/studies/api.test.ts` — **modify.**
- `participant-app/src/studies/StudiesView.tsx` — **modify.** Revoke button.
- `participant-app/src/studies/StudiesView.test.tsx` — **modify.**
- `web-viewer/docs/replay.md`, `web-viewer/FOLLOWUPS.md`, `viewer-service/FOLLOWUPS.md`, `HANDOFF.md` — **modify.** Docs/status.

---

### Task 1: VS — dedicated secret + sub-second `iat` + effective-secret resolution

**Files:**
- Modify: `viewer-service/src/viewer_service/config.py:28,70`
- Modify: `viewer-service/src/viewer_service/replay_links.py:8-12,15-32`
- Modify: `viewer-service/src/viewer_service/api/replay.py`
- Test: `viewer-service/tests/test_replay_links.py`

**Interfaces:**
- Produces: `Settings.replay_signing_secret`; `mint_replay` payload includes `iat`; `verify_replay` accepts a float `exp`; `api/replay.py::_replay_secret(s) = s.replay_signing_secret or s.invite_signing_secret` used at both mint and verify.

- [ ] **Step 1: Write the failing unit test**

In `viewer-service/tests/test_replay_links.py`, add:

```python
def test_payload_carries_iat():
    tok = mint_replay(SECRET, deployment_id="d", session_id="s", ttl=100, now=1000)
    p = verify_replay(SECRET, tok, now=1050)
    assert p["iat"] == 1000 and p["exp"] == 1100


def test_default_iat_is_subsecond_float():
    tok = mint_replay(SECRET, deployment_id="d", session_id="s", ttl=100)
    import json as _json
    from viewer_service.invites import _b64u_decode
    payload = _json.loads(_b64u_decode(tok.split(".")[0]))
    assert isinstance(payload["iat"], float)
```

- [ ] **Step 2: Run to verify failure**

Run: `cd viewer-service && python -m pytest tests/test_replay_links.py -q`
Expected: FAIL — `p["iat"]` KeyError (no `iat` in payload yet).

- [ ] **Step 3: Add `iat` to the token + accept float `exp`**

In `viewer-service/src/viewer_service/replay_links.py`, replace `mint_replay` (lines 8-12) with:

```python
def mint_replay(secret: str, *, deployment_id: str, session_id: str, ttl: int, now: float | None = None) -> str:
    iat = time.time() if now is None else now
    payload = {"deployment_id": deployment_id, "session_id": session_id, "iat": iat, "exp": iat + ttl}
    payload_b64 = _b64u(json.dumps(payload, separators=(",", ":"), sort_keys=True).encode())
    return f"{payload_b64}.{_sign(secret, payload_b64)}"
```

and in `verify_replay`, change the `exp` type check (line 30) from `int` to `(int, float)`:

```python
    if not isinstance(payload.get("exp"), (int, float)) or payload["exp"] <= t:
        return None
```

(The docstring return-shape note may add `iat`; optional.)

- [ ] **Step 4: Add the config field**

In `viewer-service/src/viewer_service/config.py`, add after `replay_link_ttl_seconds` (line 28):

```python
    replay_signing_secret: str = ""
```
and in `get_settings()` after the `replay_link_ttl_seconds=...` line (line 70):
```python
        replay_signing_secret=os.environ.get("REPLAY_SIGNING_SECRET", ""),
```

- [ ] **Step 5: Use the effective secret at mint + verify**

In `viewer-service/src/viewer_service/api/replay.py`, after `router = APIRouter()` add:

```python
def _replay_secret(s) -> str:
    """Dedicated replay secret when set, else the invite secret (non-breaking fallback)."""
    return s.replay_signing_secret or s.invite_signing_secret
```

In `mint_link`, change `mint_replay(s.invite_signing_secret, ...)` to `mint_replay(_replay_secret(s), ...)`.
In `bundle`, change `verify_replay(s.invite_signing_secret, token)` to `verify_replay(_replay_secret(s), token)`.

- [ ] **Step 6: Run unit + api replay tests green**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps && DOCKER_CONFIG=/tmp/lib_docker pytest viewer-service/tests/test_replay_links.py viewer-service/tests/test_replay_api.py -q`
Expected: all pass (new `iat` tests + existing round-trip/expiry, which still assert `exp==1100` under explicit `now`; existing api tests still 200 via the invite-secret fallback).

- [ ] **Step 7: Commit**

```bash
cd /home/pedro/Repos/Cursor/questionnaire_apps
git add viewer-service/src/viewer_service/config.py viewer-service/src/viewer_service/replay_links.py viewer-service/src/viewer_service/api/replay.py viewer-service/tests/test_replay_links.py
git commit -m "feat(viewer-service): dedicated REPLAY_SIGNING_SECRET + sub-second replay iat

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: VS — per-session revocation

**Files:**
- Modify: `viewer-service/src/viewer_service/store/schema.sql`
- Create: `viewer-service/src/viewer_service/store/replay_revocation.py`
- Modify: `viewer-service/src/viewer_service/api/replay.py`
- Test: `viewer-service/tests/test_replay_revocation_api.py`

**Interfaces:**
- Consumes: `_replay_secret`, `iat`-bearing tokens (Task 1).
- Produces: `revoke_session(conn, *, deployment_id, session_id) -> datetime` (the new `revoked_at`); `revoked_at(conn, session_id) -> datetime | None`; `POST /v1/deployments/{id}/sessions/{sid}/replay-link/revoke` (researcher-gated) → `{revoked_at}`; `GET /v1/replay` returns 401 `replay_link_revoked` for a token minted before the revoke.

- [ ] **Step 1: Write the failing endpoint tests**

Create `viewer-service/tests/test_replay_revocation_api.py`:

```python
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


def _stub_bundle(monkeypatch):
    monkeypatch.setattr(runtime_mod, "fetch_resolution_bundle", lambda base, qid, ver: BUNDLE)


def test_dedicated_secret_rotation_invalidates(client, monkeypatch):
    monkeypatch.setenv("REPLAY_SIGNING_SECRET", "replay-secret-1")
    dep_id, sid = _setup(client, monkeypatch)
    tok = client.post(f"/v1/deployments/{dep_id}/sessions/{sid}/replay-link").json()["token"]
    _stub_bundle(monkeypatch)
    assert client.get(f"/v1/replay?token={tok}").status_code == 200
    monkeypatch.setenv("REPLAY_SIGNING_SECRET", "replay-secret-2")   # rotate
    assert client.get(f"/v1/replay?token={tok}").status_code == 401


def test_revoke_then_remint(client, monkeypatch):
    dep_id, sid = _setup(client, monkeypatch)
    tok1 = client.post(f"/v1/deployments/{dep_id}/sessions/{sid}/replay-link").json()["token"]
    _stub_bundle(monkeypatch)
    assert client.get(f"/v1/replay?token={tok1}").status_code == 200
    r = client.post(f"/v1/deployments/{dep_id}/sessions/{sid}/replay-link/revoke")
    assert r.status_code == 200 and r.json()["revoked_at"]
    assert client.get(f"/v1/replay?token={tok1}").status_code == 401       # revoked
    tok2 = client.post(f"/v1/deployments/{dep_id}/sessions/{sid}/replay-link").json()["token"]
    _stub_bundle(monkeypatch)
    assert client.get(f"/v1/replay?token={tok2}").status_code == 200       # re-mint works


def test_revoke_requires_researcher(client, monkeypatch, auth_header):
    dep_id, sid = _setup(client, monkeypatch)
    assert client.post(f"/v1/deployments/{dep_id}/sessions/{sid}/replay-link/revoke",
                       headers=auth_header(["participant"])).status_code == 403


def test_revoke_unknown_404(client, monkeypatch):
    dep_id, sid = _setup(client, monkeypatch)
    assert client.post(f"/v1/deployments/nope/sessions/{sid}/replay-link/revoke").status_code == 404
    assert client.post(f"/v1/deployments/{dep_id}/sessions/sess_nope/replay-link/revoke").status_code == 404


def test_revoke_is_per_session(client, monkeypatch):
    dep_id, sid_a = _setup(client, monkeypatch)
    sid_b = client.post("/v1/sessions/new", json={
        "deployment_id": dep_id, "viewer_id": "web", "viewer_version": "v26.0610"}).json()["session_id"]
    tok_b = client.post(f"/v1/deployments/{dep_id}/sessions/{sid_b}/replay-link").json()["token"]
    client.post(f"/v1/deployments/{dep_id}/sessions/{sid_a}/replay-link/revoke")
    _stub_bundle(monkeypatch)
    assert client.get(f"/v1/replay?token={tok_b}").status_code == 200      # B unaffected
```

- [ ] **Step 2: Run to verify failure**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps && DOCKER_CONFIG=/tmp/lib_docker pytest viewer-service/tests/test_replay_revocation_api.py -q`
Expected: FAIL — the revoke route 404s (undefined) and the revocation check is absent.

- [ ] **Step 3: Add the schema table**

Append to `viewer-service/src/viewer_service/store/schema.sql`:

```sql
-- Per-session replay-link revocation (#7-4). A token whose iat predates revoked_at is rejected.
CREATE TABLE IF NOT EXISTS replay_revocation (
  session_id     text PRIMARY KEY REFERENCES session (session_id),
  deployment_id  text NOT NULL,
  revoked_at     timestamptz NOT NULL DEFAULT now()
);
```

- [ ] **Step 4: Add the store module**

Create `viewer-service/src/viewer_service/store/replay_revocation.py`:

```python
import psycopg


def revoke_session(conn: psycopg.Connection, *, deployment_id: str, session_id: str):
    """Mark all of a session's replay links revoked as of now(); returns the new revoked_at."""
    row = conn.execute(
        "INSERT INTO replay_revocation (session_id, deployment_id) VALUES (%s, %s) "
        "ON CONFLICT (session_id) DO UPDATE SET revoked_at = now(), deployment_id = EXCLUDED.deployment_id "
        "RETURNING revoked_at", (session_id, deployment_id)).fetchone()
    return row[0]


def revoked_at(conn: psycopg.Connection, session_id: str):
    row = conn.execute(
        "SELECT revoked_at FROM replay_revocation WHERE session_id=%s", (session_id,)).fetchone()
    return row[0] if row else None
```

- [ ] **Step 5: Add the revoke endpoint + revocation check**

In `viewer-service/src/viewer_service/api/replay.py`, add the import near the other store imports:

```python
from ..store import replay_revocation as revocation_store
```

Add the revoke endpoint after `mint_link`:

```python
@router.post("/deployments/{deployment_id}/sessions/{session_id}/replay-link/revoke")
def revoke_link(deployment_id: str, session_id: str, conn=Depends(get_conn),
                claims=Depends(require_researcher)):
    if dep_store.get_deployment(conn, deployment_id) is None:
        raise HTTPException(status_code=404, detail="deployment not found")
    session = session_store.get_session(conn, session_id)
    if session is None or session["deployment_id"] != deployment_id:
        raise HTTPException(status_code=404, detail="session not found in this deployment")
    ts = revocation_store.revoke_session(conn, deployment_id=deployment_id, session_id=session_id)
    return {"revoked_at": ts.isoformat()}
```

In `bundle`, after the session/deployment match check (the `if session is None or ...` block) and before the `try:`, add:

```python
    revoked = revocation_store.revoked_at(conn, payload["session_id"])
    if revoked is not None:
        iat = payload.get("iat")
        if not isinstance(iat, (int, float)) or iat < revoked.timestamp():
            return JSONResponse(status_code=401, content={"error": {"code": "replay_link_revoked",
                "message": "this replay link has been revoked"}})
```

- [ ] **Step 6: Run the revocation tests + full suite**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps && DOCKER_CONFIG=/tmp/lib_docker pytest viewer-service/tests/test_replay_revocation_api.py -q` (expected: 6 passed), then `DOCKER_CONFIG=/tmp/lib_docker pytest viewer-service/ -q` (expected: full suite green).

- [ ] **Step 7: Commit**

```bash
cd /home/pedro/Repos/Cursor/questionnaire_apps
git add viewer-service/src/viewer_service/store/schema.sql viewer-service/src/viewer_service/store/replay_revocation.py viewer-service/src/viewer_service/api/replay.py viewer-service/tests/test_replay_revocation_api.py
git commit -m "feat(viewer-service): per-session replay-link revocation (revoke endpoint + iat check)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: participant-app — Revoke button

**Files:**
- Modify: `participant-app/src/studies/api.ts`
- Modify: `participant-app/src/studies/api.test.ts`
- Modify: `participant-app/src/studies/StudiesView.tsx`
- Modify: `participant-app/src/studies/StudiesView.test.tsx`

**Interfaces:**
- Consumes: the revoke endpoint (Task 2).
- Produces: `revokeReplayLinks(vs, authFetch, depId, sid)`; a per-session "Revoke links" button.

- [ ] **Step 1: Write failing tests**

In `participant-app/src/studies/api.test.ts`, add:

```ts
import { revokeReplayLinks } from './api'

test('revokeReplayLinks POSTs to the revoke endpoint', async () => {
  const authFetch = ((url: string, init?: RequestInit) => {
    expect(url).toBe('http://vs/v1/deployments/d1/sessions/s1/replay-link/revoke')
    expect(init?.method).toBe('POST')
    return Promise.resolve(new Response('{"revoked_at":"2026-07-03T00:00:00Z"}', { status: 200 }))
  }) as unknown as import('@behaverse/participant-session').AuthFetch
  await expect(revokeReplayLinks('http://vs', authFetch, 'd1', 's1')).resolves.toBeUndefined()
})
```

In `participant-app/src/studies/StudiesView.test.tsx`, extend the researcher test's route mock to handle
the revoke endpoint and add a test (add `/replay-link/revoke` to the `authed` route handler in the
researcher test, returning `new Response('{"revoked_at":"x"}', { status: 200 })`), then:

```tsx
test('researcher: revokes replay links for a session', async () => {
  authed(['researcher'], (url, init) => {
    if (url.endsWith('/v1/deployments')) return new Response(JSON.stringify({ items: [{ deployment_id: 'd1', questionnaire_ref: 'q@v1' }] }), { status: 200 })
    if (url.endsWith('/v1/deployments/d1/sessions')) return new Response(JSON.stringify({ sessions: [{ session_id: 's1', session_index: 1, status: 'submitted', participant_sub: null, started_at: null, completed_at: null, submitted_at: null }] }), { status: 200 })
    if (url.endsWith('/replay-link/revoke') && init?.method === 'POST') return new Response('{"revoked_at":"x"}', { status: 200 })
    return null
  })
  render_()
  expect(await screen.findByText(/s1/)).toBeInTheDocument()
  await userEvent.click(screen.getByRole('button', { name: /revoke links/i }))
  expect(await screen.findByText(/revoked/i)).toBeInTheDocument()
})
```

- [ ] **Step 2: Run to verify failure**

Run: `cd participant-app && npx vitest run src/studies/api.test.ts src/studies/StudiesView.test.tsx`
Expected: FAIL — `revokeReplayLinks` undefined / no "Revoke links" button.

- [ ] **Step 3: Implement**

In `participant-app/src/studies/api.ts`, add:

```ts
export async function revokeReplayLinks(vsBaseUrl: string, authFetch: AuthFetch, deploymentId: string, sessionId: string): Promise<void> {
  const resp = await authFetch(`${vsBaseUrl}/v1/deployments/${deploymentId}/sessions/${sessionId}/replay-link/revoke`, { method: 'POST' })
  if (!resp.ok) throw new Error(`revoke ${resp.status}`)
}
```

In `participant-app/src/studies/StudiesView.tsx`, update the import to include `revokeReplayLinks`, add a
handler next to `copyLink`:

```tsx
  async function revokeLinks(sid: string) {
    try {
      await revokeReplayLinks(vsBaseUrl, session.authFetch, selected, sid)
      setCopied((c) => ({ ...c, [sid]: 'Revoked ✓' }))
    } catch {
      setCopied((c) => ({ ...c, [sid]: 'Could not revoke' }))
    }
  }
```

and add the button after the "Copy replay link" button in the per-session `<li>` action group:

```tsx
                  <button onClick={() => void revokeLinks(s.session_id)}
                    className="rounded-full border border-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-500 transition hover:bg-red-50 hover:text-red-700">
                    Revoke links
                  </button>
```

- [ ] **Step 4: Run green + full suite + build**

Run: `cd participant-app && npx vitest run src/studies/api.test.ts src/studies/StudiesView.test.tsx` (expected: pass), then `npm test && npm run build` (full suite green, build clean).

- [ ] **Step 5: Commit**

```bash
cd /home/pedro/Repos/Cursor/questionnaire_apps
git add participant-app/src/studies/api.ts participant-app/src/studies/api.test.ts participant-app/src/studies/StudiesView.tsx participant-app/src/studies/StudiesView.test.tsx
git commit -m "feat(participant-app): revoke replay links button in /studies

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: Docs + status (docs-only; controller merges)

**Files:**
- Modify: `web-viewer/docs/replay.md`, `web-viewer/FOLLOWUPS.md`, `viewer-service/FOLLOWUPS.md`, `HANDOFF.md`

- [ ] **Step 1: Doc the secret + revocation**

In `web-viewer/docs/replay.md`, add a short subsection under the CORS/limitations area (no-space em-dashes):
rotating `REPLAY_SIGNING_SECRET` invalidates all replay links (falls back to `INVITE_SIGNING_SECRET` when
unset); a researcher can revoke all links for a session via the `/studies` "Revoke links" button (or
`POST .../replay-link/revoke`), and re-minting afterwards issues a fresh working link.

- [ ] **Step 2: Mark #7-4 done in FOLLOWUPS + HANDOFF**

Match each legacy file's spaced-em-dash strike-through idiom, dated 2026-07-03:
- `viewer-service/FOLLOWUPS.md` — the "Dedicated `REPLAY_SIGNING_SECRET` + link revocation" RP3 bullet.
- `web-viewer/FOLLOWUPS.md` — the mirror line if present.
- `HANDOFF.md` — remove "dedicated `REPLAY_SIGNING_SECRET` + revocation" from the #7 "Remaining (RP3 follow-ons)" list (leaving live-follow as the last remaining #7 item).

- [ ] **Step 3: Commit**

```bash
cd /home/pedro/Repos/Cursor/questionnaire_apps
git add web-viewer/docs/replay.md web-viewer/FOLLOWUPS.md viewer-service/FOLLOWUPS.md HANDOFF.md
git commit -m "docs: dedicated REPLAY_SIGNING_SECRET + revocation done (#7-4); refresh follow-ups + HANDOFF

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 5 (controller): final review + merge

- [ ] Full green: `DOCKER_CONFIG=/tmp/lib_docker pytest viewer-service/ -q`; `( cd participant-app && npm test && npm run build )`.
- [ ] `git fetch origin && git switch master && git merge --ff-only origin/master && git merge --no-ff work/replay-revocation && git push origin master` (rebase on reject; never force-push).

---

## Self-Review

**1. Spec coverage:**
- Dedicated `REPLAY_SIGNING_SECRET` + `_effective_replay_secret` at mint+verify + `iat` → Task 1. ✅
- `replay_revocation` table + `revoke_session`/`revoked_at` → Task 2. ✅
- `POST .../replay-link/revoke` (researcher, 404 scoping) + `GET /v1/replay` 401 check → Task 2. ✅
- VS tests: dedicated-secret rotation + fallback (existing tests) + revoke/re-mint/gating/scoping/isolation → Tasks 1-2. ✅
- participant-app `revokeReplayLinks` + Revoke button + tests → Task 3. ✅
- Doc + FOLLOWUPS + HANDOFF → Task 4. ✅

**2. Placeholder scan:** No TBD/vague. All code blocks complete; the `iat`-vs-`revoked_at` condition and the `now`-explicit-vs-`None` precision split are explicit.

**3. Type/name consistency:** `_replay_secret` used at both mint and verify (Task 1) — a single source. `revoke_session` returns the `revoked_at` datetime used by the endpoint's `.isoformat()`; `revoked_at(conn, sid)` returns the tz-aware datetime whose `.timestamp()` compares against the token `iat` (float from Task 1). Frontend `revokeReplayLinks` POSTs the exact `.../replay-link/revoke` path the endpoint defines. Same-second correctness rests on the sub-second `iat` (Task 1 constraint) — the `test_revoke_then_remint` test exercises it.
