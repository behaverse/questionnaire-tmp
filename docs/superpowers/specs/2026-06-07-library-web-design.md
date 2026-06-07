# Library Web UI — Design Spec

**Date drafted:** 2026-06-07
**Author:** Library web UI brainstorming + grill-me session (2026-06-07)
**Component:** Library — sub-project 5 of 5 (web UI). See [design/14_repository_topology.md](../../../design/14_repository_topology.md) for the sub-project decomposition.
**Target repo:** `questionnaire-library-web` (built in the current monorepo under `library-web/` for now; migrates at the deferred reorg, mirroring how `library/` was built).
**Stack:** Vite · React 19 · TypeScript · Tailwind CSS · Radix-based headless primitives (shadcn-style) · TanStack Query · React Router · `openapi-typescript` + `openapi-fetch` (typed client) · Vitest + React Testing Library + Playwright.
**Authoritative source documents:**

- [HANDOFF.md](../../../HANDOFF.md) §"Delegation brief: Library web UI" — the brief this spec executes
- [design/06_library.md](../../../design/06_library.md) §1 (catalogue + search capabilities), §7 (read API)
- [design/04_architecture.md](../../../design/04_architecture.md) §"Deployment shape" — frontend stack is JS/TS; OD-01 custom React+TS, no SurveyJS
- [design/05a_reusable_entities.md](../../../design/05a_reusable_entities.md) §14–15 — page/element shapes the item renderer consumes
- [plan/02_mvp_scope.md](../../../plan/02_mvp_scope.md) — MVP outcome (open → search → view metadata+items → download JSON)
- The built read API in [library/src/library/api/](../../../library/src/library/api/)

The **Library Web UI** is a read-only, browser-based **catalogue / browse / search SPA** over the already-built Library Core read API. It delivers the MVP outcome: a researcher opens the web interface → searches the catalogue → views a questionnaire's metadata and items → downloads its canonical JSON. Programmatic API access is already served by the Core.

---

## 1 — Scope

### 1.1 In scope
- A **catalogue page**: list of published questionnaires with full-text search, faceted filters (domain / population / language / license), sort, and pagination.
- A **detail page** per questionnaire: full metadata, a read-only depiction of its items (with resolved stem + option text), version history, and a canonical-JSON download.
- **Multilingual item display**: render the questionnaire's primary language, with a switcher when more than one `available_languages`.
- Polished **loading / empty / error** states (including `404` not-found and `410` withdrawn).
- A small set of **Core API additions** (§3) that this UI requires — they ship with this work.
- **Tests** (unit + component + a Playwright end-to-end smoke against the live API).

### 1.2 Non-goals (deferred)
- **Not a questionnaire renderer.** No interactive form inputs, no SurveyJS, no answering. Rendering for participants is the Phase 2 Web Viewer.
- **No auth / login / accounts** (OD-08 — Identity sibling, not in scope).
- **No write surface** — no submitting, editing, drafts, or the contribution/review workflow (sub-project 3).
- **No community signals** — no comments, ratings, or usage statistics (sub-project 4).
- **No reusable-entity browse or `dependents` graph UI** — questionnaires-only for MVP; entity-browse is a fast-follow (the Core endpoints already exist; the resolved-content endpoint in §3.2 is the reusable building block it would need).
- **No translation-authoring / side-by-side translation comparison** — a later translation-verification feature; MVP shows one language at a time.
- **No UI-chrome internationalization** — chrome stays English for MVP (only questionnaire *content* is multilingual).
- **No SSR/SSG** — a static SPA; no Node server runtime to operate.

---

## 2 — Module layout

Built under `library-web/` in the current repo (becomes the `questionnaire-library-web` root at reorg):

```
library-web/
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.ts
├── index.html
├── .env.example                 # VITE_API_BASE_URL=http://localhost:8000
├── openapi-ts.config.ts         # codegen config (input: live /openapi.json)
├── src/
│   ├── main.tsx                 # app bootstrap (Router + QueryClient providers)
│   ├── App.tsx                  # routes + app shell (header/footer)
│   ├── api/
│   │   ├── schema.d.ts          # generated from /openapi.json (openapi-typescript)
│   │   ├── client.ts            # typed openapi-fetch client, baseUrl from env
│   │   └── queries.ts           # TanStack Query hooks (useCatalogue, useDefinition, useVersions, useFacets)
│   ├── routes/
│   │   ├── CataloguePage.tsx     # "/"
│   │   ├── DetailPage.tsx        # "/q/:id" and "/q/:id/:version"
│   │   └── NotFoundPage.tsx
│   ├── catalogue/
│   │   ├── SearchBar.tsx
│   │   ├── FacetSidebar.tsx      # domain/population/language/license groups
│   │   ├── SortSelect.tsx
│   │   ├── ResultRow.tsx         # one vertical list row
│   │   ├── Pagination.tsx
│   │   └── useCatalogueParams.ts # URL-query <-> state sync (search/filter/sort/page)
│   ├── detail/
│   │   ├── MetadataHeader.tsx    # title, badges, version selector, download
│   │   ├── SectionNav.tsx        # sticky in-page jump nav
│   │   ├── ClassificationBlock.tsx
│   │   ├── PsychometricsBlock.tsx
│   │   ├── CitationBlock.tsx
│   │   ├── ItemsBlock.tsx        # the read-only item depiction (pages → sections → items)
│   │   ├── ScoresBlock.tsx
│   │   ├── VersionList.tsx
│   │   ├── LanguageSwitcher.tsx
│   │   └── DownloadButton.tsx
│   ├── definition/
│   │   ├── renderModel.ts        # normalize a resolved Schema-2 definition → flat render model
│   │   └── types.ts              # hand-typed Schema-2 render shapes (resolved)
│   ├── components/               # shared UI: Badge, Skeleton, ErrorState, EmptyState, Breadcrumbs, ...
│   ├── shell/
│   │   ├── Header.tsx
│   │   └── Footer.tsx
│   └── lib/                      # formatting helpers (license labels, language names, downloadFile)
└── tests/
    ├── unit/                     # renderModel, useCatalogueParams, formatters
    ├── component/                # RTL tests for ResultRow, FacetSidebar, ItemsBlock, states
    └── e2e/                      # Playwright: search → open → switch version → download
```

Each unit has one responsibility and a typed interface. The `definition/renderModel.ts` boundary is deliberate: it converts the (somewhat heterogeneous) resolved Schema-2 `pages[].elements[]` into a flat, render-ready model so the React components stay dumb and testable.

---

## 3 — Core API additions (ship with this UI)

These are small, **additive** changes to `library/src/library/api/` (no schema/CalVer changes, no new tables). They belong with the UI per the brief.

### 3.1 CORS
Add FastAPI `CORSMiddleware` in `api/app.py`. Allowed origins from an env var (`LIBRARY_CORS_ORIGINS`, comma-separated; defaults to the Vite dev origin `http://localhost:5173`). Methods `GET, OPTIONS`; this read API needs nothing else.

### 3.2 Resolved-definition endpoint
**Why:** the canonical `/definition` holds Prompt/Option/Message **refs** (e.g. `pr_phq9_1@v26.0602`), not text; `EntitySummary` exposes no `content`. So showing real item text needs server-side resolution (the data — each entity's `content_json` — lives in the `entity` table).

**Endpoint:** `GET /v1/questionnaires/{id}/versions/{version}/definition?resolved=true`
(Query flag on the existing route; default `resolved=false` returns the unchanged canonical JSON.)

**Behaviour:** returns the Schema-2 definition with every content-bearing ref (`prompt`, `option`, `context`, `instruction`, `message`) replaced/augmented by the referenced entity's `content` map (and any structural fields the renderer needs, e.g. an Option's `options[]` value/index list). Refs that fail to resolve are left as `{ref, _unresolved: true}` (rendered as a graceful fallback, never a hard error). Withdrawn → still `410 Gone` (same as raw).

**Implementation:** a `resolve.py` helper walks the definition, looks up `entity.content_json` per `id@version`, and inlines. The raw download path is untouched — canonical bytes stay canonical.

### 3.3 Enriched catalogue card
**Why:** the list/search responses return thin `EntitySummary` (id, version, type, title, status, license). A useful catalogue row needs more — all already stored in `catalogue_entry`/`facet`.

Add a `CatalogueCard` response model (used by `GET /v1/questionnaires` and `GET /v1/search`) extending the summary with: `short_title`, `description`, `item_count`, `estimated_minutes`, `language`, `available_languages`, and `domain[]` + `population[]` tags (facet join). `query.list_entries` widens its `SELECT` and adds the tag aggregation; `EntitySummary` itself stays for the version/dependents endpoints.

### 3.4 Facet completeness for the sidebar
`GET /v1/facets` today serves `domain | population | administration_mode | tag` from the `facet` table. Extend it to also answer `facet_type=language` and `facet_type=license` by aggregating distinct values + counts directly from `catalogue_entry` (no reindex needed). Gives the sidebar all four filter groups from one consistent endpoint.

### 3.5 Versions enrichment (minor)
`GET /v1/questionnaires/{id}/versions` adds `severity` and a date (`ingested_at`) per version (read from the `entity` table) so the version list can show the severity tag + date. Additive fields on the existing response.

> All five additions get their own Core tests in `library/tests/` (TDD), alongside the existing suite.

---

## 4 — Frontend architecture

- **Routing (React Router):** `/` catalogue, `/q/:id` (latest published), `/q/:id/:version` (pinned), `*` not-found. Detail routes are deep-linkable and the version selector navigates between them.
- **Data layer (TanStack Query):** one hook per endpoint in `api/queries.ts`; caching keyed by the query params; `isLoading`/`isError` drive the skeleton/error states. The typed client (`openapi-fetch` over `openapi-typescript` types) gives compile-time-checked params/responses regenerated from the live `/openapi.json` after §3.
- **URL as state (catalogue):** `useCatalogueParams` reads/writes `q`, `domain`, `population`, `language`, `license`, `sort`, `page` to the URL query string (the single source of truth) → searches are shareable, bookmarkable, and the back button works. Search input is debounced (~300 ms) before it updates the URL.
- **Config:** `VITE_API_BASE_URL` (build-time) → client `baseUrl`; `.env.example` documents it.
- **Definition render model:** `renderModel.ts` turns a resolved definition into `{ pages: [{ title, blocks: [ Message | Item | Section ] }] }` where an `Item` carries `{ number, stem, context?, instruction?, option, required, subscale?, dimension? }` and a `Section` carries a shared option + child items (matrix). Components render this model only.

---

## 5 — Pages

### 5.1 Catalogue page (`/`)
- **Layout:** left **facet sidebar** + main **vertical result list**; top bar with **search box** + **sort select** + result count.
- **Facet sidebar:** four groups — domain, population, language, license — each a checkbox list with counts from `/v1/facets`. Selecting facets updates the URL and re-queries. A "clear filters" affordance.
- **Result row** (`ResultRow`): title (+ short_title) · description snippet · meta line (item count · est. minutes · language(s) · license badge) · domain/population tag chips. Clicking a row → `/q/:id`.
- **Sort:** relevance (default when searching) / title / recency.
- **Pagination:** numbered, from `total`/`limit`/`offset`; `limit` default 20.
- **Empty state:** "No questionnaires match these filters" + clear-filters action.

### 5.2 Detail page (`/q/:id`, `/q/:id/:version`)
- **Single scrolling page** with a **sticky in-page nav** (right rail / jump links). Section order: **header → description → classification → psychometrics → authors & citation → items → scores**.
- **Header (`MetadataHeader`):** title, short_title, status + license badges, DOI/citation link, **version selector** (switches route), **Download JSON** + **Copy API URL**, **language switcher** (when `available_languages > 1`), breadcrumbs.
- **Data:** one call to the **resolved-definition** endpoint (metadata + inlined item content) + one to `/versions` (for the version list). Download hits the **raw** `/definition`.
- **Classification / psychometrics / citation blocks:** render from `content_json.metadata` (domain, population, age range, administration mode; item count, estimated minutes, reliability/validity/norms; authors, publication, DOI, license, rights holder).
- **Items (`ItemsBlock`):** read-only depiction grouped by page → section. Each item = number + stem text + its option scale shown as a labelled read-only list (a matrix Section shows the shared scale once, items listed under it); a **required** marker; an optional **subscale/dimension** chip. **No interactive controls.** Unresolved refs render a subtle "content unavailable (`<ref>`)" placeholder.
- **Scores block:** lists declared `scores[]` (id, name, the scorer ref) — read-only.
- **Version list (`VersionList`):** collapsible; each version with date, status, severity tag; current version highlighted; links to its pinned route.

---

## 6 — States, i18n, visual direction

### 6.1 States
| State | Surface |
|---|---|
| Loading | Skeleton placeholders (rows on catalogue; section blocks on detail) |
| Empty results | Friendly empty state + clear-filters |
| `404` unknown id | Not-found page with a link back to the catalogue |
| `410` withdrawn | Withdrawn notice (definition gone); download disabled |
| `422` bad params | Surface near the offending filter; otherwise a generic invalid-query message |
| Network/5xx | Inline error with a retry button |
| Any uncaught render error | Global React error boundary (one bad fetch never blanks the app) |

### 6.2 Internationalization (content)
Render the questionnaire's primary `language` by default. When `available_languages` has more than one, a **language switcher** in the detail header re-renders item stems + option labels from the resolved `content` map. One language shown at a time (side-by-side translation comparison is deferred). UI chrome is English-only for MVP.

### 6.3 Visual direction
**Clean academic / scholarly.** Content-first, generous whitespace, strong typographic hierarchy, a calm neutral palette with a single accent, subtle license/status badges — reads like a quality research repository, not a consumer app. Light theme (optional dark later). Responsive/mobile and accessible (Radix primitives + keyboard nav) are baseline. The `frontend-design` skill executes the visual polish at build time.

---

## 7 — Configuration & deployment

- **Env:** `VITE_API_BASE_URL` (frontend, build-time). `LIBRARY_CORS_ORIGINS` (Core).
- **Build:** `npm run build` → static assets in `dist/`, servable by any static host / CDN.
- **Dev:** `npm run dev` (Vite dev server, default `:5173`) against a locally-running Core (`uvicorn library.api.app:create_app --factory --reload`, per the brief's run recipe). `openapi-typescript` regenerates `api/schema.d.ts` from the live `/openapi.json` via an `npm run codegen` script.

---

## 8 — Testing strategy (TDD)

- **Core additions (pytest, in `library/tests/`):** resolved-definition inlining (refs replaced, unresolved-ref fallback, withdrawn→410); enriched `CatalogueCard` shape; `/facets` language + license; versions severity/date fields; CORS headers present. Run with the existing `DOCKER_CONFIG=/tmp/lib_docker pytest library/ -q` harness.
- **Frontend unit (Vitest):** `renderModel` (Message/Item/Section/matrix/inline-vs-saved shapes, unresolved refs), `useCatalogueParams` (URL↔state round-trip), formatters (license labels, language names, download filename).
- **Frontend component (RTL):** `ResultRow`, `FacetSidebar` (checkbox→URL), `ItemsBlock` (renders resolved items, required markers, language switch), `MetadataHeader` (version switch, download), each state (loading/empty/404/410/error).
- **End-to-end (Playwright):** against a live Core seeded with the importer output — **search → open a result → switch version → switch language → download JSON** (the MVP walkthrough). Driven via the `run`/`verify` skills.

---

## 9 — Definition of done

1. `library-web/` builds and runs against a live Core; the catalogue lists/searches/filters/sorts/paginates seeded questionnaires.
2. A detail page shows full metadata + a read-only item depiction with **real stem and option text** (via the resolved-definition endpoint), version history, language switching, and a working canonical-JSON download named `{id}@{version}.json`.
3. All five Core additions (§3) are implemented with passing tests; the existing `library/` suite stays green.
4. Loading / empty / 404 / 410 / 422 / network states all render correctly.
5. Frontend unit + component suites green; the Playwright MVP walkthrough passes against the seeded API.
6. Maps onto the MVP DoD row in [plan/02_mvp_scope.md](../../../plan/02_mvp_scope.md): "a researcher can search the catalogue and download a definition end-to-end" via the web UI.

---

## 10 — Open questions to finalize in the plan

- **Resolved-endpoint shape:** replace each ref in place with an inlined object vs add a sibling `_resolved` map keyed by ref — default: inline an augmented object that carries both the original `ref` and the `content`/structural fields, so the renderer has everything locally.
- **Typed-client tool:** `openapi-typescript` + `openapi-fetch` (default) vs a heavier generator (orval). Default keeps the client thin and TanStack-Query-friendly.
- **Pagination control:** numbered pages (default) vs "load more" — pick during build; both are trivial over `total`/`offset`.
- **Dark theme:** ship light-only for MVP (default) vs include a dark toggle — defer unless cheap with the chosen Tailwind setup.
- **License/language display labels:** map controlled-vocab tags + ISO-639 codes to human labels in `lib/` (confirm the label source — reuse doc 11's tag vocabulary).
