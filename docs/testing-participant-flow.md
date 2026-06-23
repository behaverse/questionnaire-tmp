# Testing the participant flow (end-to-end)

How to run the questionnaire platform locally and walk the whole participant journey:
**create an account → pick a questionnaire from the catalogue → complete it → see/download your own data.**

This exercises the participant-flow slices **PP-A** (authenticated sessions), **PP-B** (invite links),
**PP-C** (my-data), and **PP-D** (the catalogue / "pick a questionnaire" home).

---

## 0. The pieces

| Service | Dir | Port | Role |
|---|---|---|---|
| **Identity** | `identity-service/` | **8100** | accounts, login, JWT/JWKS |
| **Library** | `library/` | **8000** | the questionnaire catalogue (definitions) |
| **Viewer Service (VS)** | `viewer-service/` | **8001** | deployments, public catalogue, sessions, response storage |
| **Web Viewer** | `web-viewer/` | **5173** | the participant UI (runner + home + my-data) |

The ports above are the **web-viewer's built-in defaults** (`vsBaseUrl=http://localhost:8001`,
`identityBaseUrl=http://localhost:8100`), so if you use these exact ports you need **no** web-viewer
env config. (Library runs on 8000; VS talks to it; the browser never calls the Library directly.)

**Prerequisites:** Python 3.12 + a virtualenv, Node 20+, and a local **PostgreSQL** you can create
databases in. The repo venv is uv-managed; `source .venv/bin/activate` (or use `.venv/bin/python`).

---

## 1. Fastest taste — no backend at all (fixture mode)

If you just want to *see a questionnaire render and fill it out*, the web-viewer ships bundled
fixtures that run fully client-side — no Identity/Library/VS needed:

```bash
cd web-viewer
npm install
npm run dev
```

Then open any of:

- http://localhost:5173/?fixture=phq9 — the full PHQ-9
- http://localhost:5173/?fixture=mini — 2 pages of radios
- http://localhost:5173/?fixture=branch — branching logic demo
- http://localhost:5173/?fixture=branch_score — scoring + branching

This proves the renderer works but does **not** exercise accounts, the catalogue, or data
collection. For the real participant journey, do the full setup below.

---

## 2. Full local stack (4 terminals)

Create the three databases once (names are the service defaults):

```bash
createdb identity_service
createdb library
createdb viewer_service
```

### Terminal A — Identity (port 8100)

```bash
cd identity-service
pip install -e '.[dev]'
export DATABASE_URL=postgresql://localhost/identity_service
export IDENTITY_ISSUER=http://localhost:8100
export IDENTITY_CORS_ORIGINS=http://localhost:5173   # let the browser log in from the web-viewer

identity migrate         # create tables + seed the "questionnaire-apps" client
identity generate-key    # mint the first Ed25519 signing key (required to issue tokens)

uvicorn identity_service.api.app:create_app --factory --reload --port 8100
```

### Terminal B — Library (port 8000) + seed a questionnaire

```bash
cd <repo-root>
pip install -e ./library
export DATABASE_URL=postgresql://localhost/library

library migrate
library ingest library/tests/fixtures/content --release v26.0601   # seeds qst_min@v26.0601

uvicorn library.api.app:create_app --factory --port 8000
```

This seeds one ready-to-run questionnaire: **`qst_min@v26.0601`** (a small multi-item form, English +
Portuguese). That `id@version` is what you deploy in the next steps.

> Want the *real* catalogue (PHQ-9, GAD-7, BIS/BAS, …)? Ingest the full content per
> `scripts/seed-supabase.md`. For this walkthrough `qst_min@v26.0601` is enough.

### Terminal C — Viewer Service (port 8001)

```bash
cd viewer-service
pip install -e ../questionnaire-runtime-denormaliser   # VS's denormaliser dependency
pip install -e '.[dev]'
export DATABASE_URL=postgresql://localhost/viewer_service
export LIBRARY_BASE_URL=http://localhost:8000
export IDENTITY_JWKS_URL=http://localhost:8100/.well-known/jwks.json
export IDENTITY_ISSUER=http://localhost:8100
export IDENTITY_AUDIENCE=questionnaire-apps
export VS_CORS_ORIGINS=http://localhost:5173           # let the browser call VS from the web-viewer

viewer-service migrate

uvicorn viewer_service.api.app:create_app --factory --reload --port 8001
```

### Terminal D — Web Viewer (port 5173)

```bash
cd web-viewer
npm install
npm run dev
```

All four are now up. Identity = 8100, Library = 8000, VS = 8001, Web Viewer = 5173.

---

## 3. Walkthrough — the full participant journey

### Step 1 — Create an account

Self-registration is built into the web viewer.

1. Open **http://localhost:5173/account** in your browser.
2. Fill in the **Create account** form (email, password, display name) and click **Create account**.
3. On success you are automatically logged in and the page switches to your profile view (showing your email).

Alternatively, if you need a token for the researcher API calls below, you can register via curl:

```bash
curl -s -X POST http://localhost:8100/v1/auth/register \
  -H 'content-type: application/json' \
  -d '{"email":"alice@example.com","password":"password1","display_name":"Alice","audience":"questionnaire-apps"}'
# → {"id":"…","email":"alice@example.com","roles":["researcher"], …}
```

> **Note:** The in-app form and the curl call create the same account; use whichever is convenient.

### Step 2 — Log in and grab a token

```bash
TOKEN=$(curl -s -X POST http://localhost:8100/v1/auth/login \
  -H 'content-type: application/json' \
  -d '{"email":"alice@example.com","password":"password1","audience":"questionnaire-apps"}' \
  | python3 -c 'import sys,json; print(json.load(sys.stdin)["access_token"])')
echo "$TOKEN"
```

### Step 3 — Publish a questionnaire to the catalogue (researcher)

Create a deployment of `qst_min@v26.0601`, marked **`listed`** (so it appears in the participant
catalogue) and **`authenticated`** (so the completion is tied to the logged-in account and shows up in
"my data"):

```bash
curl -s -X POST http://localhost:8001/v1/deployments \
  -H "authorization: Bearer $TOKEN" \
  -H 'content-type: application/json' \
  -d '{
    "questionnaire_ref": "qst_min@v26.0601",
    "runtime_policy": {"scorer_impl_preference": ["wasm"], "show_score": false},
    "default_locale": "en",
    "available_locales": ["en", "pt"],
    "mode_preset": "authenticated",
    "listed": true,
    "title": "Mini wellbeing check-in",
    "description": "A short sample questionnaire."
  }'
# → {"deployment_id":"dep_xxxxxxxx"}
```

Confirm it's in the **public** catalogue (no token needed):

```bash
curl -s http://localhost:8001/v1/catalogue
# → {"items":[{"deployment_id":"dep_xxxxxxxx","title":"Mini wellbeing check-in",
#              "description":"A short sample questionnaire.","questionnaire_ref":"qst_min@v26.0601",
#              "auth":"identity"}]}
```

### Step 4 — Pick it and complete it (participant)

1. Open the **participant catalogue**: http://localhost:5173/
2. You'll see the **"Mini wellbeing check-in"** card. Click **Start**.
3. Because the deployment is `authenticated`, the runner shows a **login screen** — log in with
   `alice@example.com` / `password1`.  If you are already signed in (e.g. you used the Account form
   in Step 1), Start runs immediately — the runner silently refreshes from the stored token and mints
   the session without re-prompting.  You only see the login screen if you were not already signed in
   (e.g. a fresh browser).
4. Answer the questions and submit. Your responses are stored in VS, tagged with your Identity id.

> The catalogue card links to `index.html?deployment=<id>`; the runner handles auth itself. For
> an **anonymous** deployment (`"mode_preset":"anonymous_link"`) there's no login — Start runs it
> immediately (but anonymous sessions won't appear in "my data", since there's no account to tie them
> to).  To log in to the Account/Account page: go to **http://localhost:5173/account**.

### Step 5 — See and download your own data

1. Open the **my-data page**: http://localhost:5173/my-data
   (or click **My data** in the top nav while on http://localhost:5173/).
2. If not already signed in, the page redirects you to **http://localhost:5173/account** — log in
   there and then navigate back to My data.
3. You'll see the session you just completed. Click **Download my data (CSV)** to get a
   BDM-native CSV of your responses.

Everything is strictly self-scoped: my-data returns only sessions tied to *your* Identity id — never
anyone else's.

---

## 4. The other two start modes (optional)

**Anonymous link** — anyone with the link can run it, no account:

```bash
# create with "mode_preset":"anonymous_link"  (and "listed":true to show it in the catalogue)
# Start it directly:  http://localhost:5173/?deployment=dep_xxxxxxxx
```

**Invite link** — a researcher mints a per-participant, tamper-proof link (no account, no data
recovery). Requires `INVITE_SIGNING_SECRET` to be set on VS (a 32+ char secret):

```bash
# Set on Terminal C before starting VS:  export INVITE_SIGNING_SECRET=$(openssl rand -hex 32)
# Create a deployment with "mode_preset":"invite_link", then mint an invite:
curl -s -X POST http://localhost:8001/v1/deployments/dep_xxxxxxxx/invites \
  -H "authorization: Bearer $TOKEN" -H 'content-type: application/json' \
  -d '{"participant_id":"p001","ttl_seconds":86400}'
# → {"invite_token":"…","url":"…", …}
# Open:  http://localhost:5173/?deployment=dep_xxxxxxxx&invite=<invite_token>
```

Invite deployments are intentionally **excluded** from the public catalogue (you reach them only via
the invite link).

---

## 5. Troubleshooting

| Symptom | Cause / fix |
|---|---|
| `http://localhost:5173/` is empty ("No questionnaires available right now.") | No deployment is `listed` + open + browse-startable. Create one with `"listed": true` and `mode_preset` `anonymous_link`/`demo`/`authenticated` (not `invite_link`). |
| Browser console CORS error calling VS or Identity | Set `VS_CORS_ORIGINS=http://localhost:5173` (Terminal C) and `IDENTITY_CORS_ORIGINS=http://localhost:5173` (Terminal A), then restart that service. |
| Start fails with **404 "questionnaire not found in library"** | The deployment's `questionnaire_ref` doesn't match a seeded questionnaire. Use exactly `qst_min@v26.0601`, and make sure Terminal B ran `library ingest …` before starting VS. |
| Start fails with **502 "library unreachable"** | The Library (port 8000) isn't running, or `LIBRARY_BASE_URL` is wrong on VS. |
| Runner shows a login screen for an anonymous deployment | The deployment was created `authenticated` — that's expected; log in, or recreate it `anonymous_link`. |
| **401** creating a deployment | Missing/expired `Authorization: Bearer $TOKEN`. Re-run Step 2 (tokens expire in 15 min). |
| `/my-data` shows nothing after completing | The session was anonymous or invite (no account). Use an **`authenticated`** deployment and log in with the same account in both the runner and my-data. |

---

## 6. Email flows — verify email + forgot/reset password

These flows require the Identity service to be running (Terminal A). No SMTP server is needed
by default — the **ConsoleMailer** prints the link to the Identity service's **stdout**.

### 6a. Verify email after registration

When a new account is created the Identity service sends a verification email.

1. Register (via the Account form at `http://localhost:5173/account` or via `curl`).
2. Watch the **Identity terminal (Terminal A)** for a log line like:

   ```
   INFO identity.mailer EMAIL to=alice@example.com subject=Verify your email address body=...
   verify-email?token=<raw_token>
   ```

3. Copy the full `http://localhost:5173/verify-email?token=<raw_token>` URL from the log and
   open it in the browser.
4. `VerifyEmailView` reads the `?token=` parameter, calls `POST /v1/auth/verify-email`
   automatically, and shows "Email verified!" on success.

> **Set `SMTP_HOST`** to use Mailpit (or a real SMTP relay) instead of the console.
> With Mailpit:
> ```bash
> export SMTP_HOST=localhost
> export SMTP_PORT=1025    # Mailpit SMTP default
> ```
> Open http://localhost:8025 (Mailpit UI) to read the email.

### 6b. Forgot / reset password

1. Open `http://localhost:5173/account` and click **"Forgot password?"** on the login tab
   (or navigate directly to `http://localhost:5173/reset-password`).
2. Enter the account email address and click **Send reset link**.
3. Watch the **Identity terminal (Terminal A)** for:

   ```
   INFO identity.mailer EMAIL to=alice@example.com subject=Reset your password body=...
   reset-password?token=<raw_token>
   ```

4. Copy the full `http://localhost:5173/reset-password?token=<raw_token>` URL and open it.
5. Enter and confirm a new password (≥ 8 chars) and click **Set new password**.
6. On success, you are redirected to `/account` where you can log in with the new password.

> **No-enumeration guarantee:** the request-reset form always shows "If that email is
> registered, a reset link has been sent" — it never reveals whether an address exists.

> **Reset send failures are swallowed (202):** if the Identity service fails to send the
> email (e.g. SMTP unreachable), the endpoint still returns `202 Accepted` — the participant
> sees the confirmation screen and the failure is logged server-side.

---

## 7. Where the code lives

- Email views: `web-viewer/src/account/VerifyEmailView.tsx`, `web-viewer/src/account/ResetPasswordView.tsx`.
- Email client functions: `web-viewer/src/session/client.ts` (`verifyEmail`, `requestPasswordReset`, `resetPassword`).
- Identity mailer: `identity-service/src/identity_service/mailer.py` (`make_mailer`, `ConsoleMailer`, `SmtpMailer`).
- Catalogue endpoint: `viewer-service/src/viewer_service/api/catalogue.py` (public `GET /v1/catalogue`).
- Deployment fields (`listed`/`title`/`description`) + filter: `viewer-service/src/viewer_service/store/deployments.py`, `models.py`, `api/deployments.py`.
- Participant shell (nav + routes): `web-viewer/src/shell/` (router, NavShell, ParticipantApp).
- Catalogue view: `web-viewer/src/home/CatalogueView.tsx`.
- My-data view: `web-viewer/src/mydata/MyDataView.tsx`.
- Account / register: `web-viewer/src/account/AccountView.tsx`.
- Runner: `web-viewer/src/app/`; SPA entry: `web-viewer/src/main.tsx`.
- Per-service run details: each service's own `README.md`.
- Design/spec: `docs/superpowers/specs/2026-06-22-participant-pp-d-design.md` (+ pp-a/b/c).
