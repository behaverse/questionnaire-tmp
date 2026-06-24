# library-web "Try" links + VS preview runtime — design

**Date:** 2026-06-24
**Status:** approved (brainstorm complete) — ready for implementation (staged)
**Components:** `viewer-service/` (new public endpoint) + `web-viewer/` (player `?preview=`) +
`library-web/` (a Try button). Roadmap item #5.

---

## 0. Context

`library-web/` is the public, read-only Library catalogue; its **DetailPage** (`/q/:id/:version`)
shows a questionnaire and already knows its `metadata.language` (default) + `available_languages`.
The owner wants a **"Try"** affordance there so anyone can *experience* a questionnaire. The player
(`web-viewer/`) already runs a runtime with **no data capture** via the `?fixture=` path
(`App.tsx` runBoot: load a runtime → `buildPipeline(..., stub-202 fetch)` → `boot_success`). VS builds
runtimes via `mint_runtime(conn, deployment, viewer, locale)` which takes a **deployment dict**
(`questionnaire_ref`, `available_locales`, `default_locale`, `runtime_policy`, `deployment_id`).

**Design model: render-only preview, no data captured.** "Try" = experience the questions; nothing is
stored — no session, no token, no outbox, no account. This is the simplest, most private fit, and it
reuses the player's existing no-capture path. (An ephemeral *capturing* session was considered and
rejected — preview collects no useful data.)

---

## 1. Scope (locked)

**In scope:**
1. **VS:** a **public** `GET /v1/preview/runtime?ref=<id@version>&viewer_id=&viewer_version=&locale=`
   that returns `{runtime}` for a Library questionnaire — no deployment, no session, no auth, no
   storage. Built by `mint_runtime` against a **synthesized pseudo-deployment** (a default
   runtime_policy; `available_locales=[locale]`, `default_locale=locale`).
2. **Player:** a `?preview=<id@version>` launch param (+ optional `locale`) → fetch the preview runtime
   from VS and run it with the no-capture pipeline (like `?fixture=`, but in prod and fetched). Honors
   `return_url` (the Done button already works).
3. **library-web:** a **"Try it"** button on the DetailPage → opens
   `${VITE_PLAYER_BASE_URL}/?preview=<id@version>&locale=<default lang>&viewer_url=<VS base>&return_url=<this page>`.

**Out of scope:** capturing/scoring-persistence of preview runs (render-only); previewing unpublished/
private questionnaires beyond what the Library already exposes; auth; a preview entry from the
participant-app catalogue (that path runs real deployments); changing the deployment/session flow.

---

## 2. Decisions

- **Render-only (no session).** Preview reuses the player's `?fixture=` no-capture pattern: a stub-202
  fetch means events/responses go nowhere; no IndexedDB resume; session id `'preview'`.
- **Locale comes from the Library.** library-web passes the questionnaire's own `metadata.language` as
  `locale`, so the synthesized pseudo-deployment's `available_locales=[locale]` always contains it —
  no `PreflightError`/500 (the locale-500 footgun, roadmap #7, is avoided here by construction).
- **Default runtime policy** for preview: `{scorer_impl_preference: ["wasm"], show_score: false}`
  (same shape researchers get by default). Scores still compute client-side for branching; just not
  displayed.
- **Public + cached.** The endpoint is anonymous (like `/v1/catalogue` and `/v1/scorers/*`); it reuses
  the 5-tuple runtime cache (attribution `deployment_id="preview"`).
- **`return_url`** is the Library detail page, so **Done** returns the visitor to the Library.

---

## 3. Architecture & units

### Viewer Service (`viewer-service/`)
- **`runtime.py`** — add `preview_runtime(conn, ref, viewer, requested_locale)`: synthesize
  `dep = {deployment_id:"preview", questionnaire_ref:ref, available_locales:[loc], default_locale:loc,
  runtime_policy: RuntimePolicy(...default...).to_canonical_dict()}` where `loc = requested_locale or
  "en"`; return `mint_runtime(conn, dep, viewer, loc)`.
- **`api/runtime.py`** — add `GET /preview/runtime` (public; no `require_researcher`): look up the
  viewer (404 if unregistered), call `preview_runtime`, map `PreflightError → 422`,
  `LibraryError → its status`. Returns `{"runtime": ...}`.

### Player (`web-viewer/`)
- **`bootstrap.ts`** — `Params` gains `preview: string | null` (`parseParams` reads `?preview`); add
  `fetchPreviewRuntime(vsBaseUrl, ref, viewerId, viewerVersion, locale)` → `GET /v1/preview/runtime` →
  `{runtime}` (or a typed error).
- **`main.tsx`** — `runQuestionnaire` includes `params.preview`.
- **`App.tsx` runBoot** — a `params.preview` branch (before/like the fixture branch, NOT DEV-gated):
  fetch the preview runtime, `buildPipeline(..., 'preview','preview','agent_preview',1, runtime, stub-202)`,
  `boot_success` (confirmation/redirect null). The resume-persistence effect must also skip when
  `params.preview` (mirror `params.fixture`). On fetch error → the existing error screen.

### library-web (`library-web/`)
- A **"Try it"** button/link on the DetailPage (`src/detail/` or `src/routes/DetailPage.tsx`) →
  builds the player URL from `VITE_PLAYER_BASE_URL` (default `http://localhost:5173`) + `VITE_VS_BASE_URL`
  (default `http://localhost:8001`, passed as `viewer_url`) + `preview=<id@version>` +
  `locale=<metadata.language>` + `return_url=<current Library URL>`.

---

## 4. Data flow

Library DetailPage → **Try it** → `player/?preview=qst_x@v26.0601&locale=en&viewer_url=…&return_url=…`
→ player fetches `GET /v1/preview/runtime?ref=qst_x@v26.0601&viewer_id=…&locale=en` → runs the
questionnaire with no capture → **Done** → back to the Library detail page. Nothing is stored anywhere.

---

## 5. Error handling

- Unknown/unregistered viewer → 404; unknown questionnaire_ref → `LibraryError` status (404); bad
  (questionnaire × viewer × locale) → 422 `preflight_failed`. The player shows its error screen on a
  non-200 preview fetch.
- `locale` absent → defaults to `"en"`; if the questionnaire lacks `en`, the 422 surfaces (library-web
  always passes the real default, so this only bites hand-crafted URLs).
- Preview never writes: no session row, no outbox, no IndexedDB — a leaked preview URL exposes only the
  (already public) questionnaire content.

---

## 6. Testing

- **VS** (`tests/`): `GET /v1/preview/runtime?ref=qst_min@v26.0601&viewer_id=…&viewer_version=…` →
  200 with a `runtime` whose provenance matches; **no auth header needed** (public); an unregistered
  viewer → 404; a bad locale → 422. No session/outbox rows created.
- **Player** (`bootstrap.test.ts` + `App.test.tsx`): `parseParams('?preview=qst_x@v1')` → `preview`
  set; a `?preview=` boot fetches `/v1/preview/runtime` and renders Q1; a `return_url` shows the Done
  link on finish; **no** `/sessions/new` and **no** `/responses` calls (render-only).
- **library-web** (`DetailPage.test.tsx`): the **Try it** link's `href` targets the player base with
  `preview=<id@version>`, `locale=<default>`, and a `return_url` back to the detail page.
- All three suites + builds green.

---

## 7. Deliverable gate

From a Library questionnaire's detail page, **Try it** opens the player, runs that questionnaire with
no data captured, and **Done** returns to the Library. VS preview endpoint is public + reuses the
runtime cache; the player has a `?preview=` no-capture path; library-web links to it. Three suites +
builds green; no new persistence.

---

## 8. References

- `viewer-service/src/viewer_service/runtime.py` (`mint_runtime`), `api/runtime.py`, `api/catalogue.py`
  (public-endpoint precedent), `models.py` (`RuntimePolicy`).
- `web-viewer/src/app/bootstrap.ts` (`Params`/`parseParams`/`mintSession`), `src/app/App.tsx`
  (the `?fixture=` no-capture branch + the resume effect), `src/main.tsx`.
- `library-web/src/routes/DetailPage.tsx`, `src/api/client.ts` (env pattern), `src/detail/`.
- Builds on [[project_viewer_return_url]] (Done/return_url) + [[project_untangle_two_apps]] (player at
  a configurable base). Roadmap #5; sidesteps #7 (locale-500) by passing the Library's default locale.
