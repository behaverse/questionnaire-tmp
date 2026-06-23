# PA-4 — Consent gate + completion polish — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the runner honor a deployment's consent + completion config — a consent gate before the first question (Accept/Decline, recorded as events) and the deployment's `confirmation_message` + `redirect_url` on finish.

**Architecture:** Viewer Service adds a `consent` locale-map to the deployment and returns `consent`/`confirmation_message`/`redirect_url` in the mint. The runner adds a `consent` phase (a `ConsentScreen` before Q1 when consent is present, deferring `initialized`/`started` until Accept + posting `consented`/`consent_declined` events) and uses the deployment's message + redirect on the finished screen.

**Tech Stack:** Python 3.12 / FastAPI / psycopg3 / testcontainers (viewer-service); React 19 / TS / Vite / vitest (web-viewer).

## Global Constraints

- **Consent is a deployment locale-map** `consent: {locale: text}` (mirrors `confirmation_message`); **presence ⇒ the gate is shown** (no separate "required" flag). The unused `consent_text_ref` is untouched.
- **The mint returns three new keys:** `consent`, `confirmation_message`, `redirect_url` (all from the deployment).
- **The session starts at consent:** when `consent` is present the runner builds the pipeline but **defers `initialized`/`started`** until Accept; on Accept it posts `initialized` + `started` + a **`consented`** (`bdm:consented`) event; on Decline it posts a **`consent_declined`** (`bdm:consent_declined`) event, flushes, and shows an exit screen (no `started`, no responses). **No-consent deployments are unchanged** (immediate start).
- **Consent + confirmation text render with the existing `renderer/RichText` (markdown).** Localize via the active locale, falling back to the first value in the map.
- **Completion:** the finished screen renders `confirmation_message[locale]` (RichText) when present, else the existing `strings.ts` thank-you; the optional score summary stays. If `redirect_url` is set, schedule a navigation (~3 s) and always show a manual "click here" link.
- Out of scope: versioned/re-consent/withdrawal (Phase 5); `consent_text_ref`; resume-path completion config (a resumed session uses the default finished screen — note in FOLLOWUPS).
- VS tests: own pytest, `DOCKER_CONFIG=/tmp/lib_docker .venv/bin/python -m pytest viewer-service/ -q` from repo root (or `cd viewer-service && DOCKER_CONFIG=/tmp/lib_docker ../.venv/bin/python -m pytest <path> -q`). web-viewer: `cd web-viewer && npm test -- <substr>` / `npm test && npm run build`.
- Spec: `docs/superpowers/specs/2026-06-23-participant-pa-4-design.md`.

---

### Task 1: VS — deployment `consent` + mint returns consent/confirmation_message/redirect_url

**Files:**
- Modify: `viewer-service/src/viewer_service/store/schema.sql`
- Modify: `viewer-service/src/viewer_service/store/deployments.py`
- Modify: `viewer-service/src/viewer_service/models.py`
- Modify: `viewer-service/src/viewer_service/api/deployments.py`
- Modify: `viewer-service/src/viewer_service/sessions.py`
- Create: `viewer-service/tests/test_mint_consent.py`

**Interfaces:**
- Produces: deployment `consent` column + `DeploymentCreate.consent`; the mint return includes `consent`/`confirmation_message`/`redirect_url`.

- [ ] **Step 1: Write the failing test** (`tests/test_mint_consent.py`)

```python
MINI = "qst_min@v26.0101"
_RP = {"scorer_impl_preference": ["wasm"], "show_score": False}
_VIEWER = {"viewer_id": "behaverse-web-viewer", "viewer_version": "v26.0612"}


def _register_viewer(client):
    import json, pathlib
    mani = json.loads(pathlib.Path("../web-viewer/public/manifest.json").read_text())
    client.post("/v1/viewers", json=mani)


def _seed_runtime(monkeypatch):
    # mint needs the Library bundle; stub the library client to a 1-item en runtime fixture
    from viewer_service import runtime as rt
    monkeypatch.setattr(rt, "fetch_resolution_bundle", lambda *a, **k: _BUNDLE)


def test_mint_returns_consent_confirmation_redirect(client, monkeypatch):
    _register_viewer(client)
    _seed_runtime(monkeypatch)
    dep = client.post("/v1/deployments", json={
        "questionnaire_ref": MINI, "runtime_policy": _RP, "default_locale": "en",
        "available_locales": ["en"], "mode_preset": "anonymous_link",
        "consent": {"en": "Please consent."}, "confirmation_message": {"en": "All done."},
        "redirect_url": "https://example.org/done"}).json()["deployment_id"]
    r = client.post("/v1/sessions/new", json={"deployment_id": dep, **_VIEWER, "locale": "en"})
    assert r.status_code == 201, r.text
    body = r.json()
    assert body["consent"] == {"en": "Please consent."}
    assert body["confirmation_message"] == {"en": "All done."}
    assert body["redirect_url"] == "https://example.org/done"


def test_mint_consent_null_when_absent(client, monkeypatch):
    _register_viewer(client)
    _seed_runtime(monkeypatch)
    dep = client.post("/v1/deployments", json={
        "questionnaire_ref": MINI, "runtime_policy": _RP, "default_locale": "en",
        "available_locales": ["en"], "mode_preset": "anonymous_link"}).json()["deployment_id"]
    body = client.post("/v1/sessions/new", json={"deployment_id": dep, **_VIEWER, "locale": "en"}).json()
    assert body["consent"] is None and body["confirmation_message"] is None and body["redirect_url"] is None
```

> Before writing: open an existing mint test (e.g. `tests/test_sessions_api.py`) to copy its real `_BUNDLE`/runtime-stub + viewer-registration setup verbatim — reuse that fixture rather than the sketch above, so the mint succeeds. The two assertions (the three keys present / null) are the point.

- [ ] **Step 2: Run to verify it fails**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps && DOCKER_CONFIG=/tmp/lib_docker .venv/bin/python -m pytest viewer-service/tests/test_mint_consent.py -q`
Expected: FAIL (`consent` rejected by DeploymentCreate / not in the mint body).

- [ ] **Step 3: Add the column** — `store/schema.sql`: in the `deployment` `CREATE TABLE` add `consent jsonb,` and append `ALTER TABLE deployment ADD COLUMN IF NOT EXISTS consent jsonb;` to the deployment ALTER block.

- [ ] **Step 4: `store/deployments.py`** — add `"consent"` to `_COLS` and to `_JSONB` (it's a dict).

- [ ] **Step 5: `models.py`** — add to `DeploymentCreate`: `consent: dict | None = None`.

- [ ] **Step 6: `api/deployments.py` `create`** — add `consent=body.consent,` to the `store.insert_deployment(...)` call.

- [ ] **Step 7: `sessions.py` `new_session`** — extend the return dict (the function already has the `deployment` dict) with:

```python
            "consent": deployment.get("consent"),
            "confirmation_message": deployment.get("confirmation_message"),
            "redirect_url": deployment.get("redirect_url"),
```

- [ ] **Step 8: Run to verify it passes**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps && DOCKER_CONFIG=/tmp/lib_docker .venv/bin/python -m pytest viewer-service/tests/test_mint_consent.py -q`
Expected: 2 passed.

- [ ] **Step 9: Commit**

```bash
git add viewer-service/src/viewer_service/store/schema.sql viewer-service/src/viewer_service/store/deployments.py viewer-service/src/viewer_service/models.py viewer-service/src/viewer_service/api/deployments.py viewer-service/src/viewer_service/sessions.py viewer-service/tests/test_mint_consent.py
git commit -m "feat(vs): deployment consent locale-map; mint returns consent/confirmation_message/redirect_url"
```

---

### Task 2: Runner — `ev.consented` + `ev.consentDeclined`

**Files:**
- Modify: `web-viewer/src/app/events.ts`
- Modify: `web-viewer/src/app/events.test.ts`

**Interfaces:**
- Produces: `ev.consented(actor, sid, ts)`, `ev.consentDeclined(actor, sid, ts)` → `BdmEvent` with verbs `bdm:consented` / `bdm:consent_declined`, object = the runtime instance.

- [ ] **Step 1: Add the failing tests** — append to `events.test.ts`:

```typescript
test('consented + consent_declined build runtime-instance events', () => {
  const a = engineActor('web@v1')
  const c = ev.consented(a, 's1', '2026-01-01T00:00:00Z')
  expect(c.verb).toBe('bdm:consented')
  expect(c.object).toEqual({ objectType: 'bdm:RuntimeInstance', id: 's1' })
  expect(c.context?.extensions['bdm:session_id']).toBe('s1')
  const d = ev.consentDeclined(a, 's1', '2026-01-01T00:00:00Z')
  expect(d.verb).toBe('bdm:consent_declined')
  expect(d.object).toEqual({ objectType: 'bdm:RuntimeInstance', id: 's1' })
})
```

(If `engineActor`/`ev` aren't imported in the test file, add them to the existing import from `./events`.)

- [ ] **Step 2: Run to verify it fails**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps/web-viewer && npm test -- app/events`
Expected: FAIL (`ev.consented`/`ev.consentDeclined` undefined).

- [ ] **Step 3: Add the builders** — in `events.ts`, inside the `ev` object (after `submitted`):

```typescript
  consented: (a: Actor, sid: string, ts: string): BdmEvent => ({ timestamp: ts, actor: a, verb: 'bdm:consented', object: runtimeObj(sid), ...ctxExt({ sessionId: sid }) }),
  consentDeclined: (a: Actor, sid: string, ts: string): BdmEvent => ({ timestamp: ts, actor: a, verb: 'bdm:consent_declined', object: runtimeObj(sid), ...ctxExt({ sessionId: sid }) }),
```

- [ ] **Step 4: Run to verify it passes**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps/web-viewer && npm test -- app/events`
Expected: pass.

- [ ] **Step 5: Commit**

```bash
git add web-viewer/src/app/events.ts web-viewer/src/app/events.test.ts
git commit -m "feat(web-viewer): ev.consented + ev.consentDeclined event builders"
```

---

### Task 3: Runner — `MintOk` carries consent/confirmation_message/redirect_url

**Files:**
- Modify: `web-viewer/src/app/bootstrap.ts`
- Modify: `web-viewer/src/app/bootstrap.test.ts` (or the file where `mintSession` is tested — if none, add a focused test in a new `bootstrap.test.ts`)

**Interfaces:**
- Produces: `MintOk` adds `consent: Record<string,string> | null`, `confirmation_message: Record<string,string> | null`, `redirect_url: string | null`; `mintSession` parses them.

- [ ] **Step 1: Write the failing test** — add to the mint tests (in `bootstrap.test.ts`; create it if absent, mirroring the existing `mintSession` test style with `vi.stubGlobal('fetch', …)`):

```typescript
import { test, expect, vi } from 'vitest'
import { mintSession } from './bootstrap'

test('mintSession surfaces consent / confirmation_message / redirect_url', async () => {
  const body = { session_id: 's1', session_token: 't1', agent_id: 'a', session_index: 1, runtime: { metadata: { title: 'x' }, pages: [] }, theme: null, ephemeral: false, participant_sub: null, consent: { en: 'C' }, confirmation_message: { en: 'D' }, redirect_url: 'https://x/done' }
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status: 200 })))
  const r = await mintSession('http://vs', 'dep_1', null)
  expect(r.ok).toBe(true)
  if (r.ok) {
    expect(r.consent).toEqual({ en: 'C' })
    expect(r.confirmation_message).toEqual({ en: 'D' })
    expect(r.redirect_url).toBe('https://x/done')
  }
})

test('mintSession defaults the new fields to null when absent', async () => {
  const body = { session_id: 's1', session_token: 't1', agent_id: 'a', session_index: 1, runtime: { metadata: { title: 'x' }, pages: [] }, theme: null, ephemeral: false, participant_sub: null }
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status: 200 })))
  const r = await mintSession('http://vs', 'dep_1', null)
  expect(r.ok && r.consent).toBeNull()
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps/web-viewer && npm test -- app/bootstrap`
Expected: FAIL (fields not on `MintOk`).

- [ ] **Step 3: Extend `MintOk` + `mintSession`** — in `bootstrap.ts`, add to the `MintOk` type: `consent: Record<string, string> | null; confirmation_message: Record<string, string> | null; redirect_url: string | null`. In `mintSession`'s success branch (where it builds the `{ ok: true, … }` object from `body`), add:

```typescript
      consent: body.consent ?? null,
      confirmation_message: body.confirmation_message ?? null,
      redirect_url: body.redirect_url ?? null,
```

- [ ] **Step 4: Run to verify it passes**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps/web-viewer && npm test -- app/bootstrap`
Expected: pass.

- [ ] **Step 5: Commit**

```bash
git add web-viewer/src/app/bootstrap.ts web-viewer/src/app/bootstrap.test.ts
git commit -m "feat(web-viewer): MintOk carries consent/confirmation_message/redirect_url"
```

---

### Task 4: Runner — state machine: consent + declined phases

**Files:**
- Modify: `web-viewer/src/app/session.ts`
- Modify: `web-viewer/src/app/session.test.ts` (the reducer test file — if none, create one)

**Interfaces:**
- Produces: `phase` adds `'consent' | 'declined'`; `SessionState` adds `consent: Record<string,string>|null`, `confirmationMessage: Record<string,string>|null`, `redirectUrl: string|null`; actions `boot_consent`, `consent_accepted`, `consent_declined`; `boot_success` carries `confirmationMessage`/`redirectUrl`.

- [ ] **Step 1: Write the failing test** — add to `session.test.ts` (or create it):

```typescript
import { test, expect } from 'vitest'
import { reducer, initialState } from './session'

const S = { id: 's1', token: 't1' }
const RT = { metadata: { title: 'x' }, locale: 'en' } as never

test('boot_consent → consent phase carrying consent + completion config', () => {
  const s = reducer(initialState, { type: 'boot_consent', session: S, runtime: RT, theme: null, steps: [], consent: { en: 'C' }, confirmationMessage: { en: 'D' }, redirectUrl: 'u' })
  expect(s.phase).toBe('consent')
  expect(s.consent).toEqual({ en: 'C' })
  expect(s.confirmationMessage).toEqual({ en: 'D' })
  expect(s.redirectUrl).toBe('u')
})

test('consent_accepted → ready, consent_declined → declined', () => {
  const c = reducer(initialState, { type: 'boot_consent', session: S, runtime: RT, theme: null, steps: [], consent: { en: 'C' }, confirmationMessage: null, redirectUrl: null })
  expect(reducer(c, { type: 'consent_accepted' }).phase).toBe('ready')
  expect(reducer(c, { type: 'consent_declined' }).phase).toBe('declined')
})

test('boot_success carries completion config', () => {
  const s = reducer(initialState, { type: 'boot_success', session: S, runtime: RT, theme: null, steps: [], confirmationMessage: { en: 'D' }, redirectUrl: 'u' })
  expect(s.phase).toBe('ready')
  expect(s.confirmationMessage).toEqual({ en: 'D' })
  expect(s.redirectUrl).toBe('u')
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps/web-viewer && npm test -- app/session`
Expected: FAIL.

- [ ] **Step 3: Edit `session.ts`** — (a) extend `phase` union with `| 'consent' | 'declined'`; (b) add to `SessionState` the three fields and to `initialState` `consent: null, confirmationMessage: null, redirectUrl: null`; (c) add to `Action`:

```typescript
  | { type: 'boot_consent'; session: { id: string; token: string }; runtime: Runtime; theme: Theme; steps: Step[]; consent: Record<string, string> | null; confirmationMessage: Record<string, string> | null; redirectUrl: string | null }
  | { type: 'consent_accepted' }
  | { type: 'consent_declined' }
```

and update `boot_success`'s action type to also carry `confirmationMessage: Record<string,string> | null; redirectUrl: Record<string,string> | string | null` — use `redirectUrl: string | null`. Then in the reducer:

```typescript
    case 'boot_success':
      return { ...state, phase: 'ready', session: action.session, runtime: action.runtime, theme: action.theme, steps: action.steps, stepIndex: 0, confirmationMessage: action.confirmationMessage, redirectUrl: action.redirectUrl }
    case 'boot_consent':
      return { ...state, phase: 'consent', session: action.session, runtime: action.runtime, theme: action.theme, steps: action.steps, stepIndex: 0, consent: action.consent, confirmationMessage: action.confirmationMessage, redirectUrl: action.redirectUrl }
    case 'consent_accepted':
      return { ...state, phase: 'ready' }
    case 'consent_declined':
      return { ...state, phase: 'declined' }
```

- [ ] **Step 4: Run to verify it passes**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps/web-viewer && npm test -- app/session`
Expected: pass.

- [ ] **Step 5: Commit**

```bash
git add web-viewer/src/app/session.ts web-viewer/src/app/session.test.ts
git commit -m "feat(web-viewer): session state — consent + declined phases, completion config"
```

---

### Task 5: Runner — `ConsentScreen` + strings

**Files:**
- Create: `web-viewer/src/app/chrome/ConsentScreen.tsx`
- Create: `web-viewer/src/app/chrome/ConsentScreen.test.tsx`
- Modify: `web-viewer/src/app/chrome/strings.ts`

**Interfaces:**
- Consumes: `RichText` (`src/renderer/RichText`), `strings.ts` `t`.
- Produces: `<ConsentScreen text onAccept onDecline locale />`; new strings `consent_title`, `consent_agree`, `consent_decline`, `declined_title`, `declined_body`.

- [ ] **Step 1: Write the failing test** (`ConsentScreen.test.tsx`)

```tsx
import { test, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ConsentScreen } from './ConsentScreen'

test('renders the consent text and fires Accept / Decline', async () => {
  const onAccept = vi.fn(); const onDecline = vi.fn()
  render(<ConsentScreen text={'Please **consent** to take part.'} onAccept={onAccept} onDecline={onDecline} locale="en" />)
  expect(screen.getByText(/consent/i)).toBeInTheDocument()
  await userEvent.click(screen.getByRole('button', { name: /i agree/i }))
  expect(onAccept).toHaveBeenCalledOnce()
  await userEvent.click(screen.getByRole('button', { name: /do not agree/i }))
  expect(onDecline).toHaveBeenCalledOnce()
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps/web-viewer && npm test -- chrome/ConsentScreen`
Expected: FAIL (module not found).

- [ ] **Step 3: Add the strings** — in `strings.ts`, add to each locale's string map (at least the `en` map; mirror for any other locales present): `consent_title: 'Before you begin'`, `consent_agree: 'I agree'`, `consent_decline: 'I do not agree'`, `declined_title: 'You declined to take part'`, `declined_body: 'You can close this window.'` (Match the file's existing structure — open it first to see the per-locale shape and the `t(locale, key)` accessor.)

- [ ] **Step 4: Create `ConsentScreen.tsx`**

```tsx
import { RichText } from '../../renderer/RichText'
import { t } from './strings'

type Props = { text: string; onAccept: () => void; onDecline: () => void; locale: string }

export function ConsentScreen({ text, onAccept, onDecline, locale }: Props) {
  return (
    <main className="min-h-screen grid place-items-center px-6 font-theme">
      <div className="qv-step-enter w-full max-w-xl space-y-6">
        <h1 className="text-2xl font-semibold tracking-tight">{t(locale, 'consent_title')}</h1>
        <div className="prose prose-sm max-w-none text-zinc-700"><RichText text={text} /></div>
        <div className="flex flex-col gap-3 sm:flex-row-reverse">
          <button onClick={onAccept} className="qv-button qv-focusable px-5 py-2.5">{t(locale, 'consent_agree')}</button>
          <button onClick={onDecline} className="rounded-full px-5 py-2.5 text-sm font-medium text-zinc-500 transition hover:bg-zinc-100">{t(locale, 'consent_decline')}</button>
        </div>
      </div>
    </main>
  )
}
```

> Check `RichText`'s actual prop name first (open `src/renderer/RichText.tsx`); if it takes `markdown`/`source`/`children` rather than `text`, use that. Adjust the one prop accordingly.

- [ ] **Step 4b: Run to verify it passes**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps/web-viewer && npm test -- chrome/ConsentScreen`
Expected: pass.

- [ ] **Step 5: Commit**

```bash
git add web-viewer/src/app/chrome/ConsentScreen.tsx web-viewer/src/app/chrome/ConsentScreen.test.tsx web-viewer/src/app/chrome/strings.ts
git commit -m "feat(web-viewer): ConsentScreen + consent/declined strings"
```

---

### Task 6: Runner — App wiring (consent gate + completion polish)

**Files:**
- Modify: `web-viewer/src/app/App.tsx`
- Modify: `web-viewer/src/app/App.test.tsx`

**Interfaces:**
- Consumes: `boot_consent`/`consent_accepted`/`consent_declined` (T4), `ConsentScreen` (T5), `ev.consented`/`ev.consentDeclined` (T2), `MintOk` fields (T3), `RichText`.

- [ ] **Step 1: Write the failing tests** — add to `App.test.tsx` (use the existing `mintOk` fixture + `setUrl`/`renderApp` helpers; clone `mintOk` and add the new fields per test):

```tsx
test('consent: shows the consent screen before Q1; Accept posts a consented event then starts', async () => {
  setUrl('?deployment=dpl_1')
  const fetchMock = vi.fn(); respond202(fetchMock)
  fetchMock.mockImplementation(async (url: string, init?: RequestInit) => {
    if ((url as string).endsWith('/v1/sessions/new')) return new Response(JSON.stringify({ ...mintOk, consent: { en: 'Please consent.' } }), { status: 200 })
    return new Response('{}', { status: 202 })
  })
  vi.stubGlobal('fetch', fetchMock)
  renderApp()
  expect(await screen.findByText(/please consent/i)).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: /next/i })).not.toBeInTheDocument()  // no question yet
  await userEvent.click(screen.getByRole('button', { name: /i agree/i }))
  await screen.findByRole('button', { name: /next/i })                              // Q1 now renders
  // a consented event was posted to /events
  const evCalls = fetchMock.mock.calls.filter((c) => (c[0] as string).includes('/events'))
  const verbs = evCalls.flatMap((c) => JSON.parse((c[1] as RequestInit).body as string).events.map((e: { verb: string }) => e.verb))
  expect(verbs).toContain('bdm:consented')
})

test('consent: Decline shows the exit screen, posts consent_declined, and no responses', async () => {
  setUrl('?deployment=dpl_1')
  const fetchMock = vi.fn(async (url: string) =>
    (url as string).endsWith('/v1/sessions/new')
      ? new Response(JSON.stringify({ ...mintOk, consent: { en: 'Please consent.' } }), { status: 200 })
      : new Response('{}', { status: 202 }))
  vi.stubGlobal('fetch', fetchMock)
  renderApp()
  await userEvent.click(await screen.findByRole('button', { name: /do not agree/i }))
  expect(await screen.findByText(/declined/i)).toBeInTheDocument()
  expect(fetchMock.mock.calls.some((c) => (c[0] as string).includes('/responses'))).toBe(false)
})

test('completion: confirmation_message + redirect link are shown on finish', async () => {
  setUrl('?deployment=dpl_1')
  vi.stubGlobal('fetch', vi.fn(async (url: string) =>
    (url as string).endsWith('/v1/sessions/new')
      ? new Response(JSON.stringify({ ...mintOk, confirmation_message: { en: 'Custom thanks!' }, redirect_url: 'https://example.org/done' }), { status: 200 })
      : new Response('{}', { status: 202 })))
  renderApp()
  // advance to the end (mirror the existing 'finishing shows the thank-you screen' test's clicks)
  await userEvent.click(await screen.findByRole('button', { name: /next/i }))
  await userEvent.click(await screen.findByRole('radio', { name: /Not at all/ }))
  await screen.findByRole('heading', { name: /How many hours/ }, { timeout: 2000 })
  await userEvent.click(screen.getByRole('button', { name: /next/i }))
  expect(await screen.findByText(/custom thanks/i)).toBeInTheDocument()
  const link = screen.getByRole('link', { name: /here/i })
  expect(link.getAttribute('href')).toBe('https://example.org/done')
})
```

> Match the "completion" test's click sequence to the existing `finishing shows the thank-you screen` test (same fixture `mini`). The first two tests are the load-bearing ones.

- [ ] **Step 2: Run to verify it fails**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps/web-viewer && npm test -- app/App`
Expected: FAIL (no consent screen / no custom confirmation).

- [ ] **Step 3: Defer start in `buildPipeline`** — add a trailing param `deferStart = false` to `buildPipeline`, and guard its final two lines:

```tsx
    if (!deferStart) {
      batcher.add(ev.initialized(pipeline.current.engine, sessionId, nowIso()))
      batcher.add(ev.started(pipeline.current.engine, sessionId, nowIso()))
    }
```

Add a small helper inside the component for the deferred path:

```tsx
  function startEvents(sid: string, withConsent: boolean) {
    const p = pipeline.current!
    p.batcher.add(ev.initialized(p.engine, sid, nowIso()))
    p.batcher.add(ev.started(p.engine, sid, nowIso()))
    if (withConsent) p.batcher.add(ev.consented(p.engine, sid, nowIso()))
  }
```

- [ ] **Step 4: Route mint to consent vs success** — in `runBoot`'s mint-success branch (`if (res.ok) { … }`), replace the single `dispatch({ type: 'boot_success', … })` so consent is honoured:

```tsx
      buildPipeline(evaluator, scorerSet, res.session_id, res.session_token, res.agent_id, res.session_index, res.runtime, undefined, !!res.consent)
      const steps = flattenSteps(res.runtime)
      if (res.consent) {
        dispatch({ type: 'boot_consent', session: { id: res.session_id, token: res.session_token }, runtime: res.runtime, theme: res.theme as Theme, steps, consent: res.consent, confirmationMessage: res.confirmation_message, redirectUrl: res.redirect_url })
      } else {
        dispatch({ type: 'boot_success', session: { id: res.session_id, token: res.session_token }, runtime: res.runtime, theme: res.theme as Theme, steps, confirmationMessage: res.confirmation_message, redirectUrl: res.redirect_url })
      }
```

(Keep the existing `store.put`/`document.title`/`lang` lines that follow.) For the **fixture** + **resume** + **boot_success** dispatches elsewhere, add `confirmationMessage: null, redirectUrl: null` to their `boot_success` payloads (the fixture path's `boot_success` and any other) so the action type is satisfied. `buildPipeline` for the fixture/resume paths keeps `deferStart` defaulting false (started fires as before).

- [ ] **Step 5: Render the consent + declined branches** — in App's render, before the step-rendering fallthrough (and after the existing `needLogin`/`booting`/`finishing`/`error`/`finished`/`completed` branches), add:

```tsx
  if (state.phase === 'consent' && state.consent) {
    const text = state.consent[locale] ?? Object.values(state.consent)[0] ?? ''
    return <ConsentScreen text={text} locale={locale}
      onAccept={() => { startEvents(state.session!.id, true); dispatch({ type: 'consent_accepted' }) }}
      onDecline={() => { const p = pipeline.current!; p.batcher.add(ev.consentDeclined(p.engine, state.session!.id, nowIso())); p.batcher.flush(); dispatch({ type: 'consent_declined' }) }} />
  }
  if (state.phase === 'declined') {
    return (
      <main className="min-h-screen grid place-items-center px-6 font-theme text-center">
        <div className="qv-step-enter max-w-md space-y-3">
          <h1 className="text-3xl font-semibold">{t(locale, 'declined_title')}</h1>
          <p className="text-lg text-slate-600">{t(locale, 'declined_body')}</p>
        </div>
      </main>
    )
  }
```

Import `ConsentScreen` (`from './chrome/ConsentScreen'`) and ensure `t` + `ev` + `RichText` are imported.

- [ ] **Step 6: Completion polish** — in the `phase === 'finished'` branch, replace the title/body so a `confirmation_message` (RichText) is used when present, and add the redirect link + effect. Replace the heading+body block with:

```tsx
        {state.confirmationMessage ? (
          <div className="prose prose-sm mx-auto max-w-none text-zinc-700"><RichText text={state.confirmationMessage[locale] ?? Object.values(state.confirmationMessage)[0] ?? ''} /></div>
        ) : (
          <>
            <h1 className="text-3xl font-semibold">{t(locale, 'finished_title')}</h1>
            <p className="text-lg text-slate-600">{t(locale, 'finished_body')}</p>
          </>
        )}
        {state.redirectUrl ? (
          <p className="text-sm text-slate-500">{t(locale, 'redirecting') /* add this string: 'Redirecting you…' */} <a className="underline" href={state.redirectUrl}>{t(locale, 'redirect_here') /* 'click here' */}</a></p>
        ) : null}
```

Add the two strings (`redirecting`, `redirect_here`) to `strings.ts` (Task 5 added the others — add these in this task's commit). And add a redirect effect near the App's other effects:

```tsx
  useEffect(() => {
    if (state.phase !== 'finished' || !state.redirectUrl) return
    const url = state.redirectUrl
    const id = setTimeout(() => { window.location.href = url }, 3000)
    return () => clearTimeout(id)
  }, [state.phase, state.redirectUrl])
```

(Use the `RichText` prop name confirmed in Task 5.)

- [ ] **Step 7: Run to verify it passes**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps/web-viewer && npm test -- app/App`
Expected: all App tests pass (the 3 new + existing — the existing no-consent run + thank-you tests still pass because `boot_success` now also carries the two null fields and the finished screen falls back to the strings when `confirmationMessage` is null).

- [ ] **Step 8: Commit**

```bash
git add web-viewer/src/app/App.tsx web-viewer/src/app/App.test.tsx web-viewer/src/app/chrome/strings.ts
git commit -m "feat(web-viewer): consent gate + completion polish wired into the runner"
```

---

### Task 7: Full-suite gate + docs

**Files:**
- Modify: `viewer-service/README.md`, `viewer-service/FOLLOWUPS.md`
- Modify: `web-viewer/README.md`, `web-viewer/FOLLOWUPS.md`, `docs/testing-participant-flow.md`

- [ ] **Step 1: Run the full VS suite**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps && DOCKER_CONFIG=/tmp/lib_docker .venv/bin/python -m pytest viewer-service/ -q`
Expected: all pass (existing + the 2 new mint tests; the additive `consent` column + mint keys don't break existing tests). If a pre-existing mint-shape assertion breaks on the additive keys, update it minimally. Genuine/unrelated failure → STOP + report BLOCKED. Capture the total.

- [ ] **Step 2: Run the full web-viewer suite + build**

Run: `cd /home/pedro/Repos/Cursor/questionnaire_apps/web-viewer && npm test && npm run build`
Expected: all vitest pass; clean build. If a real failure → STOP + report BLOCKED. Capture totals.

- [ ] **Step 3: Update `viewer-service/README.md` + `FOLLOWUPS.md`** — README: document the deployment `consent` locale-map and that `POST /v1/sessions/new` now returns `consent`/`confirmation_message`/`redirect_url`. FOLLOWUPS: full consent lifecycle (versioned forms / re-consent / withdrawal / recording against a version) is Phase-5 Platform; the legacy `consent_text_ref` (external-ref) is still unused.

- [ ] **Step 4: Update `web-viewer/README.md` + `FOLLOWUPS.md` + `docs/testing-participant-flow.md`** — web-viewer README: the consent gate (ConsentScreen before Q1 when the deployment has `consent`; Accept records a `bdm:consented` event; Decline → exit + `bdm:consent_declined`) + the finished screen honouring `confirmation_message`/`redirect_url`. FOLLOWUPS: resumed sessions use the default finished screen (the deployment's confirmation/redirect aren't carried through resume); consent is not versioned (Phase 5). testing-participant-flow.md: add a short "Consent + completion" note — create a deployment with `"consent": {"en": "…"}` / `"confirmation_message"` / `"redirect_url"` to see the gate + custom completion.

- [ ] **Step 5: Commit**

```bash
git add viewer-service/README.md viewer-service/FOLLOWUPS.md web-viewer/README.md web-viewer/FOLLOWUPS.md docs/testing-participant-flow.md
git commit -m "docs: document the consent gate + completion polish; PA-4 followups; PA-4 complete"
```

---

## Self-Review

**1. Spec coverage:**
- §2 consent locale-map + presence-gates → T1 (column/model) + T6 (render). ✓
- §2 mint returns the 3 fields → T1 (VS) + T3 (MintOk). ✓
- §2 session starts at consent (defer initialized/started; consented on Accept; declined on Decline + flush; no-consent unchanged) → T6 (buildPipeline deferStart + startEvents + onAccept/onDecline) + T2 (events). ✓
- §2 markdown render + locale fallback → T5 (ConsentScreen RichText) + T6 (consent/confirmation `[locale] ?? first`). ✓
- §2 completion (confirmation_message else strings; redirect + manual link) → T6. ✓
- §3 units (VS; events; bootstrap; session; ConsentScreen; App; finished) → T1–T6. ✓
- §5 error handling (empty consent → no gate via `if state.consent`; locale fallback; decline terminal; redirect best-effort + manual link) → T6. ✓
- §6 testing → T1 (VS) + T2–T6 (runner) + gate T7. ✓
- §7 deliverable → T7 + the flows. ✓

**2. Placeholder scan:** No "TBD"/"add validation"/"similar to". Each code step carries complete code or an exact edit. Two spots intentionally say "open the file first to confirm" (the VS mint test's real `_BUNDLE`/viewer-setup fixture; the `RichText` prop name) — these are *verification* directives with the exact change named, not placeholders; the implementer copies an existing fixture / confirms one prop. The redirect/confirmation strings (`redirecting`, `redirect_here`) are added in T6; the consent/declined strings in T5.

**3. Type consistency:** `MintOk.consent/confirmation_message/redirect_url` (T3) → consumed by App boot (T6) → passed into `boot_consent`/`boot_success` actions (T4) → state `consent/confirmationMessage/redirectUrl` → read by ConsentScreen (T5 `text`) + finished branch (T6). `ev.consented/consentDeclined(actor, sid, ts)` (T2) called in App (T6). VS mint keys `consent/confirmation_message/redirect_url` (T1, snake) ↔ `MintOk` fields (T3, same snake for the two; `consent` same) — the runner reads `body.confirmation_message`/`body.redirect_url`/`body.consent` (snake) into `MintOk` of the same names. `ConsentScreen` props `{text, onAccept, onDecline, locale}` (T5) match the App call (T6). Consistent.

Note for execution: T6 must add `confirmationMessage: null, redirectUrl: null` to **every** other `boot_success` dispatch (the fixture path, and any in the resume/other branches) so the updated action type compiles — `tsc -b` (in `npm run build`, run at T7) would otherwise fail; T6 Step 7 runs `npm test` (esbuild, lenient on this) but the implementer must satisfy the type at edit time. The reducer's `boot_success` now reads `action.confirmationMessage`/`action.redirectUrl`.
