# Cross-origin SSO handoff (#1-SSO) — design

**Date:** 2026-06-24
**Status:** approved (brainstorm complete) — ready for implementation (staged)
**Components:** `identity-service/` (new grant) + `participant-session/` (client + provider) +
`participant-app/` (mint at launch) + `web-viewer/` (exchange on boot).
**Roadmap:** #1-SSO (the deferred half of #1). Owner decision (2026-06-24): **one-time handoff code**.

---

## 0. Context

After the untangle (#1), the portal (origin A, :5174) holds the participant's session (a refresh token
in *its* localStorage). For an **authenticated** deployment, the player (origin B, :5173) reads its
*own* origin's localStorage → empty → it re-prompts login (the player's `LoginView`). We want the
player to get the participant's identity **without a re-login** and **without a reusable token in the
URL**. Identity issues an access JWT (`sub`/`aud`/`roles`) + an opaque rotating refresh token
(`service/auth.py::_issue_tokens`). The catalogue already exposes each card's `auth` (`none`/`identity`),
so the portal knows which launches need the handoff.

---

## 1. Scope (locked)

**In scope:** an Identity **handoff grant** (mint a single-use code from a valid access token; exchange
it for a fresh token pair); the shared session client + provider support; the portal minting a code at
launch for `identity` cards when signed in; the player exchanging `?handoff=<code>` on boot (no
re-login). Falls back to the existing player login on any failure.

**Out of scope:** changing the access/refresh token model; SSO for the researcher/editor apps; logout
propagation across origins (each origin logs out independently); the silent-iframe alternative.

---

## 2. Decisions

- **The handoff code is a one-time capability, not a token.** Opaque (like a refresh token), **hashed
  at rest**, **single-use** (consumed on exchange), **short TTL (60 s)**, bound to the **user + client
  (audience)** of the access token that minted it. It cannot call any API — it can only be exchanged
  once for tokens. This is the OAuth-style redirect handoff; what transits the URL is a code, never an
  access/refresh token.
- **Portal mints at launch (no extra redirect).** Because the catalogue knows a card is `identity`,
  the portal — when the participant is signed in — mints a code and includes `&handoff=<code>` in the
  launch URL. Not signed in, or a `none` card → plain launch (the player handles auth as today).
- **Player exchanges on boot, then owns its own session.** The exchange returns a normal token pair;
  the player stores the refresh token in *its* localStorage (so subsequent visits stay signed in) and
  proceeds to mint authenticated. The `?handoff` param is stripped from the URL after exchange.
- **Fail-safe:** an invalid/expired/used code → the exchange fails → the player falls back to its
  `LoginView` (no worse than today). Single-use + 60 s TTL bound the blast radius of a leaked URL.

---

## 3. Architecture & units

### Identity service
- **store** — a `handoff_codes` table: `id, user_id, client_id, code_hash, expires_at, used_at`
  (migration + a `handoff` store mirroring the `refresh` store's hash-at-rest pattern).
- **`service/auth.py`** — `mint_handoff(conn, settings, *, user_id, audience) -> {handoff_code, expires_in}`
  (opaque code via `tokens.mint_refresh()`, store its `hash_token`, 60 s expiry); `exchange_handoff(conn,
  settings, *, code) -> {access_token, refresh_token, expires_in, token_type}` (look up hash → reject if
  missing/expired/used → mark used → issue a token pair for the bound user+client, reusing
  `_issue_tokens`).
- **`api/auth.py`** — `POST /v1/auth/handoff` (`require_access`; uses `claims["sub"]`/`claims["aud"]`)
  → `{handoff_code, expires_in}`; `POST /v1/auth/handoff/exchange` (public; body `{handoff_code}`) →
  the token pair. Reuse the `_handle()` envelope; bad code → a clean 401 (`handoff_invalid`).

### participant-session (shared)
- **`client.ts`** — `mintHandoff(identityBaseUrl, access) -> {ok, code} | {ok:false}` (POST /handoff,
  Bearer); `exchangeHandoff(identityBaseUrl, code) -> {ok, tokens} | {ok:false}` (POST /handoff/exchange).
- **`SessionProvider.tsx`** — gains an optional `handoffCode?: string` prop. On boot: if there is a
  stored refresh token, restore as today; **else if `handoffCode`**, `exchangeHandoff` → on success
  `saveRefreshToken` + set access + `authed` (+ `fetchMe`); on failure → `anon`. (The portal passes no
  `handoffCode`; only the player does.)

### participant-app (portal)
- **`home/CatalogueView.tsx`** — for an `item.auth === 'identity'` card **and** a signed-in session,
  Start becomes a click handler: `mintHandoff(identityBaseUrl, accessToken)` → navigate to
  `playerUrl + '&handoff=' + code`. Otherwise the existing plain `<a href>` (anon / `none` cards).
  Needs `useSession()` (status + accessToken + identityBaseUrl).

### web-viewer (player)
- **`bootstrap.ts`** — `Params.handoff` (`parseParams` reads `?handoff`).
- **`main.tsx`** — pass `handoffCode={params.handoff ?? undefined}` to `SessionProvider`; after the
  provider settles, strip `?handoff` from the URL (`history.replaceState`) so a reload doesn't re-try a
  consumed code.

---

## 4. Data flow

portal (signed in) → click Start on an `identity` card → `mintHandoff` (Bearer) → Identity returns a
60 s single-use code → launch `B/?deployment=X&handoff=<code>&return_url=A/?done=X` → player boots →
`SessionProvider` exchanges the code → token pair → player authed (refresh stored on B) → mint the
session authenticated (`participant_sub` set) → run → Done → back to A. No re-login; only a one-time
code crossed the URL.

---

## 5. Error handling

- Code missing/expired/used/forged → `exchange_handoff` → 401 `handoff_invalid` → provider goes `anon`
  → player shows `LoginView` (existing fallback). No crash, no partial state.
- `mintHandoff` failure on the portal (e.g. token expired) → fall back to a plain launch (the player
  re-prompts). The portal never blocks Start on the handoff.
- The exchanged refresh token lives only in the player origin's localStorage; logging out on the portal
  does not revoke it (documented; cross-origin logout propagation is out of scope).
- Single-use + 60 s TTL + hash-at-rest bound a leaked launch URL to one short-lived exchange.

---

## 6. Testing

- **Identity:** `mint_handoff` + `exchange_handoff` unit/service tests (round-trip issues a valid token
  pair for the right `sub`/`aud`); the code is single-use (second exchange → 401); expired → 401;
  forged → 401; `POST /v1/auth/handoff` requires a valid access token (401 without). Full Identity
  suite green.
- **participant-session:** `mintHandoff`/`exchangeHandoff` client tests (fetch-stub); `SessionProvider`
  with `handoffCode` and no stored token → exchanges → `authed` + stores the refresh token; a failed
  exchange → `anon`.
- **participant-app:** an `identity` card while signed in → Start mints a handoff code then navigates to
  a URL containing `handoff=`; a `none` card (or anon) → a plain Start link (no handoff).
- **web-viewer:** `parseParams('?handoff=abc').handoff === 'abc'`; main passes it to the provider (a
  light test); a `?handoff=` boot with a stubbed exchange reaches an authenticated mint (no `LoginView`).
- All suites + builds green.

---

## 7. Deliverable gate

Launching an **authenticated** deployment from the portal while signed in runs it on the player
**without a re-login**; only a single-use, 60 s code crosses the URL; the player then holds its own
session. Anonymous/`none` cards and the not-signed-in path are unchanged; any handoff failure falls
back to the player's login. All four packages' suites + builds green; no change to the token model.

---

## 8. References

- `identity-service/src/identity_service/{service/auth.py (_issue_tokens/login/refresh), api/auth.py,
  tokens.py, store/refresh.py (hash-at-rest pattern), store/ (migration)}`.
- `participant-session/src/{client.ts, SessionProvider.tsx}`; `participant-app/src/home/CatalogueView.tsx`
  (+ `useSession`); `web-viewer/src/{app/bootstrap.ts, main.tsx}`.
- Builds on [[project_untangle_two_apps]] (two origins; the player's own `LoginView` is the fallback)
  + [[project_participant_pa_1]] (the session layer). Roadmap #1-SSO.
