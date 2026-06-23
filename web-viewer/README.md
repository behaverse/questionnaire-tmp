# questionnaire-web-viewer (WV-A: shell + renderer)

Participant-facing **custom React/TS viewer** (OD-01 S1) that renders **Schema 3
runtimes** minted by the Viewer Service. The default presentation is a
Typeform-like **focus mode** — one question per view, auto-advance on single
choice. Stages WV-A (shell + Schema 3 renderer), WV-B (submission), and WV-C/D
(embedded expression evaluator + logic/branching/validation/scoring) are built;
resume (WV-E) comes later. Spec: `docs/superpowers/specs/2026-06-11-web-viewer-wv-a-design.md`.

> **Try the whole participant journey end-to-end** (create an account → pick a questionnaire from the
> catalogue → complete it → download your data): see [`docs/testing-participant-flow.md`](../docs/testing-participant-flow.md).

## Dev quickstart (no backend)

```bash
cd web-viewer
npm install
npm run dev
```

Then open a bundled fixture — renderer work needs no Postgres/VS:

- `http://localhost:5173/?fixture=mini` — 2 pages of radios
- `http://localhost:5173/?fixture=matrix` — Section + shared_option matrix
- `http://localhost:5173/?fixture=widgets` — every supported widget triple + Message + an unsupported combo
- `http://localhost:5173/?fixture=branch` — a 3-page branch rule (`it_route == 1` skips to p3); proves in-browser logic

## URL contract

| Param | Required | Meaning |
|---|---|---|
| `deployment` | yes | Deployment id to mint a session against. |
| `locale` | no | Requested locale (BCP-47); VS resolves it against the deployment's locales. |
| `viewer_url` | no | VS base URL override; default `VITE_VS_BASE_URL`, else `http://localhost:8001`. |
| `identity_url` | no | Identity service base URL for authenticated deployments; default `VITE_IDENTITY_BASE_URL`. |
| `invite` | no | Signed invite token for `invite_link` deployments. If present, passed to `POST /v1/sessions/new`. |
| `fixture` | dev only | Render a bundled fixture runtime; no network. |

## Invite links (PP-B)

When a deployment uses `invite_link` mode the participant receives a URL with a
`?invite=<token>` query parameter. No login is required.

**Flow:**
1. The viewer reads `?invite=<token>` from the URL on startup.
2. `POST /v1/sessions/new` is called with `{ deployment_id, invite: "<token>" }`.
3. On success, the session is minted (tagged `participant_sub=invite:<participant_id>` by the
   VS) and the questionnaire begins normally.
4. If the token is invalid, expired, or bound to a different deployment, the VS returns
   `401 invite_required` and the viewer shows the **InvalidInviteScreen** — a static error
   page explaining that the link is invalid or has expired, with no retry path.

**URL contract addition:**

| Param | Required | Meaning |
|---|---|---|
| `invite` | no | Signed invite token for `invite_link` deployments. If present, passed to `POST /v1/sessions/new`. |

**Token posture:** The invite token is passed once, at session-mint time. It is not stored
in IndexedDB and not sent on any subsequent VS call — the session token (`session_token`)
authorises all further participant requests. Because invite participants have no account, they
cannot resume from a different device (see FOLLOWUPS).

## Session layer (PA-1)

A shared **persistent session** (`src/session/`) replaces the one-shot access-token pattern that existed in PP-A..D.  All three entry points (runner `index.html`, MyData `mydata.html`, home `home.html`) now consume it via `useSession()`.

### Modules

| File | Responsibility |
|---|---|
| `src/session/storage.ts` | Read/write the opaque refresh token at `localStorage` key `behaverse.participant.refresh`. Throws are caught and surfaced as `null`. |
| `src/session/client.ts` | Typed `Tokens` / `User` shapes; `loginCall`, `refreshCall`, `meCall`, `revokeCall` — thin `fetch` wrappers around the Identity service. |
| `src/session/authFetch.ts` | `makeAuthFetch(getAccess, doRefresh)` — wraps any `fetch` call; on a `401` it single-flights a refresh and retries once. Concurrent callers share the same in-flight refresh promise. |
| `src/session/SessionProvider.tsx` | React context provider.  On mount it reads the stored refresh token and silently calls `/v1/auth/refresh` + `/v1/auth/me` (boot restore).  Exposes `{ status, user, accessToken, login, logout, authFetch }` via `useSession()`. |
| `src/session/SessionStrip.tsx` | Thin header bar: shows the logged-in user's email + a **Log out** button (used by `HomeApp` and `MyDataApp`); renders nothing while `status === 'anon'`. |

### Persistent login

- The **refresh token** is stored in `localStorage` (`behaverse.participant.refresh`) so a reload resumes the session without prompting for credentials.
- The **access token** is kept **in memory only** (never written to storage or the DOM).
- On boot the provider silently refreshes; on any `authFetch` `401` it silently refreshes and retries once.
- **Logout**: calls `POST /v1/auth/revoke` (best-effort), then clears the refresh token from storage and resets provider state to `anon` regardless of whether the revoke succeeded.

### Configuration

`VITE_IDENTITY_BASE_URL` (build-time env var) sets the default Identity service base URL.  It can be overridden per-request with the `?identity_url=` query param.

### Consuming `useSession()`

```tsx
const { status, user, accessToken, login, logout, authFetch } = useSession()
```

- `status`: `'loading' | 'anon' | 'authenticated'`
- `login(email, password)`: returns `{ok:true}` or `{ok:false, error:'invalid_credentials'|'network'}`
- `logout()`: revokes + clears
- `authFetch`: a `fetch`-compatible function that attaches `Authorization: Bearer <token>` and silently refreshes on 401

## Participant login (PP-A)

When the Viewer Service returns `401 auth_required` on session-mint, the viewer shows a
**login screen** (email + password) before the questionnaire begins.

**Flow:**
1. The viewer tries to mint a session anonymously.
2. If the deployment is `authenticated`, the VS returns `401 auth_required`.
3. The viewer presents `LoginView` — a minimal email/password form.
4. On submit, the viewer calls the Identity service (`POST /v1/auth/login`) at the URL
   resolved from `?identity_url=` or `VITE_IDENTITY_BASE_URL`.
5. On success, the access token is attached to the mint request (`Authorization: Bearer …`).
6. The VS mints the session, tags it with `participant_sub`, and returns `session_id` /
   `session_token` / `participant_sub` — the viewer proceeds normally.

**Configuration:**

| Source | Variable / Param | Purpose |
|---|---|---|
| URL param | `?identity_url=<base>` | Identity base URL for this session |
| Build-time env | `VITE_IDENTITY_BASE_URL` | Default Identity base URL |

If neither is set and the deployment requires auth, the login form still renders but
the submit call will fail with a network error (displayed inline).

**Token posture:** The access token is used **once**, at mint. It is not stored and not
sent on any subsequent VS call — the session token (`session_token`) authorises all
further participant requests. See FOLLOWUPS for deferred work on token refresh and the
"my data" view.

## MyData portal (`mydata.html`) (PP-C)

A lightweight single-page app bundled as a **separate Vite entry** (`mydata.html`)
that lets a logged-in participant view and download their own questionnaire history.

### URL contract

| Param | Required | Meaning |
|---|---|---|
| `identity_url` | no | Identity service base URL; default `VITE_IDENTITY_BASE_URL`, else `http://localhost:9000`. |
| `viewer_url` | no | Viewer Service base URL; default `VITE_VS_BASE_URL`, else `http://localhost:8001`. |

### Flow

1. Participant opens `mydata.html` (directly or via a link from the study platform).
2. The portal shows a `LoginView` (email + password) and calls
   `POST /v1/auth/login` on the Identity service.
3. On success, the access token is held in memory and passed as
   `Authorization: Bearer <token>` on every VS call.
4. The portal calls `GET /v1/me/sessions` → displays a table of the participant's
   completed questionnaire sessions (instrument id/version, status, session index,
   submitted-at timestamp).
5. A **"Download my responses (CSV)"** button calls `GET /v1/me/responses.csv` and
   triggers a browser file download.
6. If the participant has no sessions, the empty-state message
   **"No completed questionnaires yet."** is shown.

### Building

`mydata.html` is produced by `npm run build` alongside the main viewer.  The
compiled output lives at `dist/mydata.html` plus `dist/assets/mydata-*.js`.

### Configuration

| Source | Variable / Param | Purpose |
|---|---|---|
| URL param | `?identity_url=<base>` | Identity base URL for this session |
| Build-time env | `VITE_IDENTITY_BASE_URL` | Default Identity base URL |
| URL param | `?viewer_url=<base>` | VS base URL for this session |
| Build-time env | `VITE_VS_BASE_URL` | Default VS base URL |

## Participant home portal (`home.html`) (PP-D)

A lightweight participant entry-point bundled as a **separate Vite entry** (`home.html`).
It lets a participant browse all publicly listed questionnaires and launch one with a
single click.

### URL contract

| Param | Required | Meaning |
|---|---|---|
| `viewer_url` | no | VS base URL; default `VITE_VS_BASE_URL`, else `http://localhost:8001`. |
| `identity_url` | no | Identity service base URL carried through to the runner; default `VITE_IDENTITY_BASE_URL`. |

### Flow

1. Participant opens `home.html`.
2. The portal calls `GET /v1/catalogue` on the Viewer Service — no login required.
3. Each returned deployment is shown as a card with its `title` (falls back to
   `questionnaire_ref`) and `description`.
4. Clicking **Start** navigates to `index.html?deployment=<id>` with `viewer_url` and
   `identity_url` forwarded as query parameters so the runner uses the same service endpoints.
5. The portal also shows a **"My data"** link to `mydata.html` (carrying the same
   `viewer_url`/`identity_url`) so an authenticated participant can reach their history.
6. If the catalogue is empty, the empty-state message **"No questionnaires available right now."**
   is shown.

### Building

`home.html` is produced by `npm run build` alongside `index.html` and `mydata.html`.
The compiled output lives at `dist/home.html` plus `dist/assets/home-*.js`.

## Presentation modes

- **focus** (default): one step per view, keyboard shortcuts, auto-advance after a
  single-choice answer.
- **classic**: all questions of a page at once — set `style.x_presentation: "classic"`
  on the questionnaire or via deployment style.
- `style.x_auto_advance: false` disables single-choice auto-advance in focus mode.

## Data emitted (WV-B)

- **One Schema 5 `Response` row per attempt per item**, submitted when the
  participant advances past the step (Next / auto-advance), not on every
  keystroke.
- **ALL attempts are kept.** Going Back and changing an answer produces a *new*
  row carrying `x_response_revises` (the revised response id) and
  `x_response_revision` (the attempt counter). Dedup is **analysis-side, never
  storage-side** — the data is an exact reproduction of what happened.
- **Messages/instructions are full trials**: a row with
  `response_description: "acknowledged"`, `block_type: "instruction"`, and an
  RT equal to the seconds until the participant pressed Next.
- **ALL durations are in SECONDS** (Schema 5 / BDM convention) — `response_time`
  values are single-digit-ish floats, not milliseconds.
- **`bdm:` events** are batched every **5 s or 20 events** (whichever first)
  using the trial_started / presented / selected / clicked / trial_ended /
  completed / submitted grammar, plus a **keepalive flush on `pagehide`** so a
  closing tab still delivers its tail.
- **Finishing flow**: final queue flush → `POST .../complete` → thank-you
  screen. A failure surfaces a **visible retry** — the participant is never
  silently dropped.
- `style.x_summary_rt: false` strips RTs from emitted rows.

## Logic (WV-D)

Conditional logic runs entirely **in-browser** via the embedded
`questionnaire-expression-evaluator` (the WV-C WASM evaluator). It is built
`--target web` by `npm run build:evaluator` and runs **automatically** on
`dev`/`build` (the `predev`/`prebuild` hooks) — this **requires `cargo` +
`wasm-pack` on PATH** (`. "$HOME/.cargo/env"` first). The four logic actions:

- **skip** — a fired rule jumps navigation forward to its `skip_to` page.
- **branch** — same graph-walk jump, used for conditional routing.
- **visibility** — `show_if`: a rule whose `condition` is false hides its
  `target_id` element; hidden steps are skipped during navigation.
- **piping** — answer/score values are spliced into prompt text (v1: prompt-text
  only, matched by `field_path` prefix).

**Graph-walk navigation**: Next applies the first forward-firing skip/branch
rule, then scans to the next *visible* step (hidden steps are skipped). **Back
retraces the actually-visited path** (a visited stack), not the linear order, so
branches reverse correctly.

**Validation** runs before advancing: per-question (range / length / format) and
cross-question (condition) rules. A failing rule **blocks Next** and shows
per-item messages.

**Scoring at answer-commit**: `reversed_value` items emit the post-reversal
`score` into the Schema 5 `Response`, and Solution-bearing items emit `correct`.
The `score(id)` expression function resolves to an **unavailable sentinel** until
the Scorer host lands — so **score-gated branches do not fire** (by design, not a
bug).

**Progress**: when the runtime carries branch/skip rules, the bar shows a **step
counter** (current step, no fixed total — the total is path-dependent).

The Schema 7 **manifest** now declares `logic_actions: [skip, visibility, piping,
branch]` and an `evaluator` block (`v26.0612`), so the Viewer Service **no longer
strips logic** from minted runtimes for this viewer.

## Resume + locale (WV-E)

Per-question state **persists to IndexedDB** (DB `behaverse-web-viewer`, store
`resume`, keyed by deployment) — including the **session token** — so a reload
**resumes prior answers** and lands on the **first unanswered visible question**
in the **last-active locale**. The WV-A in-memory-token caveat is **now
RESOLVED**.

- A `LocaleSwitcher` (shown only when there is **>1 `available_locales`**) swaps
  runtime text via `POST /sessions/{id}/locale` with **answers intact**; the
  active locale is part of the persisted state.
- **Demo / ephemeral deployments never persist** and show a "this is a demo —
  prior session cleared" notice on return.
- A **completed** session shows **"already completed"** rather than restarting.

**Token posture**: the persisted token is **anonymous / opaque / origin-scoped**
(IndexedDB is same-origin), so storing it is acceptable for anonymous
deployments — revisit when authenticated deployments arrive (see FOLLOWUPS).
**Multi-tab** writes are **last-writer-wins** (no cross-tab coordination yet).

## Running against a live Viewer Service

1. Start Postgres and the **Library** (see `library/README.md` / `HANDOFF.md`:
   `python -m library.cli migrate`, ingest content, then
   `uvicorn library.api.app:create_app --factory --port 8000`).
2. Migrate + run the **Viewer Service** on :8001:

   ```bash
   export DATABASE_URL=postgresql://postgres:pg@localhost:55432/viewer_service
   viewer-service migrate
   export LIBRARY_BASE_URL=http://localhost:8000
   export VS_CORS_ORIGINS=http://localhost:5173
   uvicorn viewer_service.api.app:create_app --factory --port 8001
   ```

3. Register this viewer's Schema 7 manifest:

   ```bash
   curl -X POST http://localhost:8001/v1/viewers \
     -H 'content-type: application/json' -d @manifest.json
   ```

4. Create an `anonymous_link` deployment for a questionnaire in the Library:

   ```bash
   curl -X POST http://localhost:8001/v1/deployments \
     -H 'content-type: application/json' -d '{
       "questionnaire_ref": "qst_example@v26.0606",
       "runtime_policy": {"scorer_impl_preference": ["wasm"]},
       "default_locale": "en",
       "available_locales": ["en"]
     }'   # → {"deployment_id": "dep_..."}
   ```

5. Open `http://localhost:5173/?deployment=<dep_id>`.

## Caveats

- ~~The session token is held **in memory only** — a refresh restarts the
  session (resume is WV-E).~~ **RESOLVED (WV-E)**: token + answers persist to
  IndexedDB; a reload resumes — see "Resume + locale (WV-E)" above.
- Submission exists as of WV-B, but the submission queue is **in-memory** — a
  refresh loses any not-yet-sent rows/events; offline/PWA queue-and-sync is WV-F.
- Logic/branching is live (WV-D, see above); `score(id)` is still null (external
  Scorer deferred), so score-gated branches do not fire yet.

## Distribution (WV-F)

> **WV-A..F is COMPLETE** — with WV-F the Web Viewer is feature-complete (renderer
> library, PERF-01 overlap, iframe embedding, PWA shell, manifest-at-origin).

- **Renderer library (OD-03):** `npm run build:lib` produces `dist-lib/renderer.js`
  (ESM, React as a peer dependency — not bundled) + `dist-lib/renderer.css` + type
  declarations. The Editor preview imports it as `@behaverse/questionnaire-renderer`
  (the JS plus `@behaverse/questionnaire-renderer/renderer/style.css`). **The preview
  IS the deployed renderer** — there is no separate rendering engine to keep in sync.

- **iframe embedding:** a host page embeds the viewer in an
  `<iframe src="…/?deployment=<id>">` and listens for `message` events:
  - `behaverse:loaded` — `{type, sessionId}` once the session is minted and rendered
  - `behaverse:completed` — `{type, sessionId}` when the participant finishes
  - `behaverse:resize` — `{type, height}` on content height change, for auto-sizing

  Optional `?embed_origin=https://host.example` restricts the postMessage target
  origin (recommended in production; default posts to `'*'`). Host snippet:

  ```html
  <iframe id="qv" src="https://viewer.example/?deployment=dep_123&embed_origin=https://host.example"
          style="width:100%;border:0"></iframe>
  <script>
    addEventListener('message', (e) => {
      const d = e.data || {};
      if (d.type === 'behaverse:resize') document.getElementById('qv').style.height = d.height + 'px';
      if (d.type === 'behaverse:completed') console.log('done', d.sessionId);
    });
  </script>
  ```

- **PWA:** the viewer is installable (webmanifest + service worker). The SW precaches
  the app shell **and** the evaluator WASM for fast repeat loads. Offline reality: a
  **loaded** session survives a reload and submits-when-back-online (WV-B retry queue +
  WV-E IndexedDB durability); a **first** visit still needs the network to mint a
  session. The `/v1/` API is **NetworkOnly** — never cached.

- **Manifest:** the Schema 7 conformance manifest is served at `/manifest.json`
  (build-generated from `web-viewer/manifest.json`, declaring `resume` and
  `locale_switching` true). Register it with the Viewer Service via
  `POST /v1/viewers`.

- **PERF-01:** see [PERF.md](PERF.md) — the interactive shell is ~81 KB gzip; the
  evaluator WASM load overlaps the session mint and is SW-cached for repeat loads.

## Tests

```bash
npm test            # vitest (~265 tests) + Schema 7 manifest validation
npm run typecheck   # tests mock loadEvaluator — no prior wasm build needed
npm run build       # tsc + builds evaluator --target web + bundles the wasm
npm run build:lib   # renderer library (OD-03) → dist-lib/ (ESM + dts + CSS)
npm run test:lib    # renderer-library smoke (consumes the built dist-lib)
```
