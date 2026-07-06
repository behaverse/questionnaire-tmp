# questionnaire-web-viewer (the player)

Participant-facing **custom React/TS viewer** (OD-01 S1) that renders **Schema 3
runtimes** minted by the Viewer Service. The default presentation is a
Typeform-like **focus mode** — one question per view, auto-advance on single
choice.

**This package is now the player only** (`index.html` → `<App/>`, the runner).
The participant **portal** (catalogue / account / my-data / nav shell) moved to
the sibling **`participant-app/`** package; the shared auth/session layer lives in
**`@behaverse/participant-session`** (consumed by both via a source alias). The
portal launches the player with `?deployment=…&return_url=…`; the player returns
the participant to the portal via the **Done** button / `return_url`.

- **Runner** (`?deployment=`, `?invite=`, or `?fixture=`): the full questionnaire
  runner (`<App/>`). No nav shell — intentional focus mode.
- **Auth**: anonymous / invite / demo deployments need no login. **Authenticated**
  deployments prompt login here (the player's own `LoginView`), unless the portal
  supplied a one-time SSO handoff code (`?handoff=`), which the player exchanges on
  boot so authenticated participants don't re-login.
- The **renderer** / **scoring** libraries (`build:lib` → `dist-lib`, consumed by
  the editor) are unchanged by the split.
- **Replay** (`?replay=<bundle_url>`): a read-only playback mode that reconstructs a
  recorded session from its `bdm:` event stream (+ optional mouse track) — question
  state, answers, and a cursor overlay — with play/seek/speed controls and a
  `?follow=1` live mode that tails an in-progress session. See
  [`docs/replay.md`](docs/replay.md).

Specs: `docs/superpowers/specs/2026-06-11-web-viewer-wv-a-design.md` and the
PA-1/PA-2 design docs in the same directory.

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
- `http://localhost:5173/?fixture=widgets` — every supported widget triple + Message + an unsupported combo. Numeric scales (`number.interval`/`number.ratio`) render via `numberPresentation`: a `style.layout: slider|rating|input` hint wins, else auto — ≤ 11-point integer scale → `NumberRating` (segmented buttons), wider/continuous → `Slider` (`<input type=range>`), unbounded → `NumberInput`.
- `http://localhost:5173/?fixture=branch` — a 3-page branch rule (`it_route == 1` skips to p3); proves in-browser logic
- `http://localhost:5173/?fixture=comments` — the per-question **QA comment** widget (`style.x_comments: true`): a bottom-right icon opens a comment + star-rating modal

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

## Consent gate + completion polish (PA-4)

### Consent gate

When `POST /v1/sessions/new` returns a non-null `consent` locale-map, the runner shows a
**ConsentScreen** before the first questionnaire step.

- The consent text is resolved from the locale-map using the session's active locale, falling
  back to the first available locale entry.
- The text is rendered as **rich text** (markdown + sanitised HTML — the same `RichText`
  component used for question prompts).
- **Accept**: posts a `bdm:consented` event to the VS outbox, then transitions to the first
  questionnaire step normally (the session is considered `started` at this point).
- **Decline**: posts a `bdm:consent_declined` event and shows an **exit screen** — a static
  message explaining the session was not started. No questionnaire steps are rendered and no
  response rows are emitted.
- When `consent` is null the screen is skipped entirely and the runner boots directly to step 1.

### Finished screen — confirmation message + redirect

The finished screen now honours two optional deployment-level fields (from the mint response):

| Field | Behaviour |
|---|---|
| `confirmation_message` | Locale-map of markdown text. Rendered in place of the default "Thank you" string. Locale + fallback resolution is the same as `consent`. |
| `redirect_url` | When set, an automatic redirect fires **3 seconds** after the completion screen appears. A manual **"click here"** link is always shown immediately so the participant is not blocked if the auto-redirect fails. |

Both are `null` when not configured on the deployment — the finished screen then shows the
built-in thank-you text and no redirect.

## Session layer (shared)

The persistent session (login / silent refresh / logout) is the shared **`@behaverse/participant-session`** package (`participant-session/`), consumed via a source alias and exposed as `useSession()`. The player uses it only for **authenticated-deployment login** (below); the full account/catalogue/my-data UI lives in the **`participant-app/`** portal. See `participant-session/README.md`.

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

The portal routes (catalogue / my-data / account / reset-password / verify-email) moved to the **`participant-app/`** package — see `participant-app/README.md`. The portal launches the player with `?deployment=<id>&return_url=<portal>` and the player returns the participant via the **Done** button.

## Presentation modes

- **focus** (default): one step per view, keyboard shortcuts, auto-advance after a
  single-choice answer.
- **classic**: all questions of a page at once — set `style.x_presentation: "classic"`
  on the questionnaire or via deployment style.
- `style.x_auto_advance: false` disables single-choice auto-advance in focus mode.
- `style.x_key_select: false` disables letter-key selection of choices **and** hides the
  letter badges, forcing a click on the option (text inputs still accept keyboard typing).
- `style.x_back_nav: false` hides the **Back** button so the participant cannot return to a
  prior question.
- `style.x_comments: true` (opt-in) shows a per-question **comment** widget for QA: a small icon
  that opens a modal capturing a free-text comment + an optional 1–5 star rating, POSTed to the VS
  (`POST /v1/sessions/{id}/comments`). Non-blocking and stored out-of-band from responses.
  Researchers read them via `GET /v1/deployments/{id}/comments` (JSON) or `…/comments.csv`
  (download). Authored questionnaire-level in the Editor (Presentation section); try it with
  `?fixture=comments`. ("Comment", not "feedback".)

> The player honours `x_key_select` / `x_back_nav` / `x_comments` today; authoring them from the
> deployment/questionnaire (VS denormaliser + Editor) is a follow-up — see `FOLLOWUPS.md`.

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
`score(id)` resolves live via the embedded scorer engine (OD-16); score-gated
branches fire on the computed score.

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
- Logic/branching is live (WV-D); `score(id)` is live via the embedded scorer
  engine (OD-16), so score-gated branches fire.

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
npm test            # vitest (326 tests) + Schema 7 manifest validation
npm run typecheck   # tests mock loadEvaluator — no prior wasm build needed
npm run build       # tsc + builds evaluator --target web + bundles the wasm
npm run build:lib   # renderer library (OD-03) → dist-lib/ (ESM + dts + CSS)
npm run test:lib    # renderer-library smoke (consumes the built dist-lib)
```
