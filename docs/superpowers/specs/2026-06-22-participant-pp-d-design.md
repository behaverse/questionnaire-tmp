# PP-D — Participant catalogue / home (design)

**Date:** 2026-06-22
**Status:** approved (brainstorm complete) — ready for implementation planning
**Components:** `viewer-service/` (modify) + `web-viewer/` (modify; new `home.html` entry). Identity (ID-A) FROZEN.
**Decision basis:** owner goal (2026-06-22) — "pick a questionnaire and complete it". PP-D is the final
participant-flow (PP) slice (the convenience entry point); follows PP-A/B/C. See
[[project_identity_roadmap]].

---

## 0. Context

A participant can only *start* a questionnaire via a **deployment** (a questionnaire configured to
run — `viewer-service`'s `deployment` row). Today: `deployment` stores only `questionnaire_ref`
(`qst_id@version`) with no human title; `GET /v1/deployments` is researcher-gated (ID-B); there is no
participant-facing catalogue. The runner (`index.html`, `?deployment=<id>`) already handles every auth
mode: anonymous starts immediately; an `authenticated` deployment returns `401 auth_required` → the
runner shows the PP-A login screen → re-mints with the token; `invite_link` needs a per-person token.
`viewer_service.deployments.check_deployable(deployment, now, session_count)` is a pure gate (active
window + quota). PP-C added the `mydata.html` portal; the runner + mydata reuse `parseParams`.

PP-D adds a participant **catalogue/home**: browse the questionnaires a researcher chose to publish and
start one — reusing the runner for the actual start.

---

## 1. Scope (locked)

**In scope:** a `listed` opt-in flag + optional `title`/`description` on deployments; a **public**
`GET /v1/catalogue` listing `listed` + currently-open + browse-startable deployments; a new
`home.html` Web Viewer participant home that renders catalogue cards with Start buttons (→ the runner)
+ a "My data" link.

**Out of scope:** auto-filling title/description from the Library (a cross-service call — deferred);
merging home + my-data into one tabbed portal; per-participant *assignment* (the Phase-5 Participant
Platform study model); catalogue search/filter/categories; quota "full" badges; any change to the
runner's auth flow, the researcher deployment list, or `identity-service/` (frozen).

---

## 2. Decisions

- **`listed` opt-in.** A deployment is in the participant catalogue only if `listed = true` (set at
  create). Existing deployments default `listed = false` (no surprise exposure of study links).
- **Catalogue = listed + open + browse-startable.** "Open" = passes `check_deployable` (within the
  active window, not over quota). "Browse-startable" = `dimensions.auth in {"none", "identity"}`
  (NOT `invite_link` — those require a per-person token reached via the invite link itself).
- **Titles stored on the deployment.** The deployment carries optional `title` + `description`
  (the researcher provides a participant-facing title when listing); the catalogue falls back to
  `questionnaire_ref` when `title` is absent. No live Library dependency. (Library auto-fill deferred.)
- **Public catalogue.** `GET /v1/catalogue` needs no token — browsing available questionnaires is
  public; auth (if any) happens when the participant clicks Start and the runner mints the session.
- **"Start" just links to the runner.** A card's Start navigates to `index.html?deployment=<id>`
  (carrying `?viewer_url=`/`?identity_url=` overrides); the runner handles anonymous/login. The
  catalogue contains no session logic.
- **A new `home.html` Vite entry** (shipped in prod + dev), separate from the runner + mydata.

---

## 3. Architecture & units

### Viewer Service

- **`store/schema.sql`** + migration — `deployment` gains (idempotent `ALTER … ADD COLUMN IF NOT
  EXISTS`): `listed boolean NOT NULL DEFAULT false`, `title text`, `description text`.
- **`models.py`** — `DeploymentCreate` gains `listed: bool = False`, `title: str | None = None`,
  `description: str | None = None`.
- **`api/deployments.py` `create`** — persist the three new fields (pass them to
  `store.insert_deployment`); `store/deployments.py insert_deployment` already takes `**fields` — add
  the three to its column list.
- **`store/deployments.py`** — `list_catalogue_candidates(conn) -> list[dict]`: rows where `listed`
  AND `dimensions->>'auth' IN ('none','identity')`, returning `deployment_id, questionnaire_ref, title,
  description, dimensions, active_from, active_until, quota` (newest first).
- **`api/catalogue.py`** (new router) — `GET /v1/catalogue` (NO auth dependency): fetch candidates,
  filter through `check_deployable(dep, now, count_for_deployment(...))` (drop those that raise), and
  return `{"items":[{deployment_id, title (or questionnaire_ref), description, questionnaire_ref,
  auth}]}`.
- **`api/app.py`** — include the catalogue router.

### Web Viewer

- **`home.html`** (new entry, root `home-root`, script `/src/home/main.tsx`) + **`src/home/main.tsx`**
  (mounts `<HomeApp/>` + imports `../index.css`) + **`vite.config.ts`** (add `home` to prod + dev input).
- **`src/home/client.ts`** — `fetchCatalogue(vsBaseUrl) -> {ok, items} | {ok:false, error}`
  (GET `/v1/catalogue`, no auth) + `CatalogueItem` type.
- **`src/home/HomeApp.tsx`** — on mount, `fetchCatalogue(params.vsBaseUrl)` (reuse `parseParams`);
  render a card per item (title + description) with a **Start** link/button → `index.html?deployment=
  <id>` (preserving `viewer_url`/`identity_url` query params); an empty state ("No questionnaires
  available right now."); a "My data" link → `mydata.html` (preserving the same params).

Each unit is small and independently testable; "Start" is a plain navigation (no session logic).

---

## 4. Data model

`deployment` gains `listed boolean NOT NULL DEFAULT false`, `title text` (nullable), `description text`
(nullable). No other tables. (Idempotent ALTERs for existing DBs; the column added to the CREATE TABLE
for fresh DBs — matching the VS-C/PP-A migration style.)

---

## 5. API surface

- `POST /v1/deployments` (researcher) — now accepts `listed`/`title`/`description` (all optional;
  default `listed=false`).
- `GET /v1/catalogue` (PUBLIC) → `200 {"items":[{deployment_id, title, description, questionnaire_ref,
  auth}]}` — only `listed` + open + browse-startable deployments. Empty → `{"items":[]}`.
- No new Identity calls. Error envelope unchanged.

---

## 6. Security / privacy

- The catalogue exposes ONLY deployments a researcher explicitly opted into (`listed=true`) — no
  study link is leaked by default. The returned fields are non-sensitive (deployment id, the
  researcher-authored title/description, the questionnaire ref, the auth mode). No participant data,
  no session data, no quota internals are exposed.
- Read-only, parameterless query (no injection surface); no auth required (intentionally public).
- Starting still enforces the deployment's auth at mint (an `authenticated` card → the runner's login
  gate; quota/active-window re-checked at mint).

---

## 7. Testing

- **VS** (the conftest `client`/`auth_header`): creating a deployment with `listed=true` + a title
  surfaces it in `GET /v1/catalogue` (public — works with the default client AND with the auth header
  stripped); an unlisted deployment is absent; an `invite_link`-listed deployment is excluded (not
  browse-startable); a closed (past `active_until`) listed deployment is excluded (reuses
  `check_deployable`); a listed deployment with no `title` falls back to `questionnaire_ref`. Full VS
  suite stays green (the additive deployment columns don't break existing tests).
- **Web Viewer** (vitest + `fetch` stub): `fetchCatalogue` GETs `/v1/catalogue`; `HomeApp` renders a
  card per item with a Start link to `index.html?deployment=<id>` and a "My data" link; the empty
  state renders. `npm run build` adds the `home` entry (`dist/home.html`).

---

## 8. Deliverable gate

- A researcher lists a deployment (`listed=true` + title); a participant opens the home page, sees the
  card, and Start takes them into the runner for that deployment (anonymous starts; authenticated →
  login). Unlisted / closed / invite / over-quota deployments never appear.
- The runner, mydata portal, and researcher deployment list are unchanged.
- Full `viewer-service/` + `web-viewer/` suites pass + clean build; no `identity-service/` change.

---

## 9. References

- `viewer-service/src/viewer_service/{store/schema.sql,store/deployments.py,models.py,api/deployments.py,deployments.py,api/app.py}` — the deployment model + `check_deployable` PP-D extends/reuses.
- `web-viewer/{vite.config.ts,mydata.html}` + `src/app/bootstrap.ts` (`parseParams`) + `src/mydata/MyDataApp.tsx` — the second-entry + portal pattern PP-D mirrors; `src/app/App.tsx` (the runner's auth flow that "Start" relies on).
- [[project_participant_pp_a]] (auth flow at Start), [[project_participant_pp_c]] (the portal pattern + mydata link), [[project_identity_roadmap]].
