# Editor ED-C3a (Library Body Endpoint + Pick-from-Library) — Design Spec

**Date drafted:** 2026-06-14
**Author:** Editor ED-C3 brainstorming session (2026-06-14)
**Component:** **Editor**, sub-project **ED-C** (item/Question/Option authoring + OD-15 reusable-entity workflow); ED-C is sliced C1..C4, **C3** sub-sliced **C3a** (this spec) + **C3b**. C3a delivers picking existing entities from the Library and inserting hard-pinned refs — plus the additive Library entity-body read endpoint that makes it (and ED-B's preview of Library refs) work.
**Builds on:** ED-A..ED-C2b (the editor authors from scratch; entity pool + live preview + bundle). The Library Core (`library/`, FastAPI+Postgres, live at questionnaire-library.vercel.app). Memories `project_editor_ed_c2b`, `project_editor_ed_b`, `project_library_core`.
**Stack:** editor — Vite·React 19·TS·Tailwind·Zustand·vitest+RTL·Playwright; library — Python·FastAPI·Postgres (testcontainers).
**Authoritative source documents:**

- [design/07_editor.md](../../../design/07_editor.md) §3 (reusable-component workflow; pick-from-Library; OD-06 hard-pinning). OD-06 (hard-pin + CalVer, never silent upgrade).
- Library API: `library/src/library/api/entities.py` (`/v1/entities/{etype}` list+`q`, `/entities/{etype}/{eid}`, `/entities/{etype}/{eid}/versions/{version}` — all return `EntitySummary` METADATA only), `library/src/library/api/resolve.py` `_entity_content` (the server-side `content_json` read), `library/src/library/api/questionnaires.py` `definition` (the handler shape to mirror), `library/src/library/entity_types.py` (`ENTITY_TYPES`, prefix↔type). `library/src/library/models.py` `EntitySummary {id, version, entity_type, title, status, effective_license}`.
- Editor: `editor/src/persistence/library.ts` (`fetchEntityBody`/`parseRef`/`fetchFromLibrary`, `FetchOpts`), `editor/src/preview/resolver.ts` (`FetchEntity`), the canvas `ItemEditor`/`Canvas`, the store (`pool`/`upsertPoolEntity`/`applyEdit`/`select`), `editor/src/model/tree.ts` (`updateNodeProps`/`insertNode`).

---

## 1 — The discovery this slice fixes

The public Library API has **no per-entity body endpoint**: `/v1/entities/{etype}/{eid}` (latest) and `…/versions/{version}` return `EntitySummary` (metadata — `id/version/entity_type/title/status/effective_license`), never `content_json`. Entity bodies are only reached server-side (the `resolution-bundle`'s `_entity_content`). Therefore (a) picking can't fetch/preview entity content, and (b) **ED-B's `fetchEntityBody` is broken** — it calls `/v1/entities/{type}/{id}?version=` (which routes to the latest-metadata handler, `?version=` ignored) and inlines metadata, so Library-pinned prompts/options silently preview as placeholders (ED-B FOLLOWUPS g). ED-C3a adds the missing endpoint and repoints both consumers at it.

---

## 2 — Scope (ED-C3a)

### 2.1 In scope

- **Library: entity-body read endpoint** (`library/src/library/api/entities.py`): `GET /v1/entities/{etype}/{eid}/versions/{version}/definition` → the entity's `content_json` (raw body). Mirrors the questionnaire `/definition` handler: `404` unknown `etype`/missing row, `410` withdrawn (`status == 'withdrawn'` or `content_json is None`), else the body. (Reuses the same `SELECT status, content_json, withdrawn_at FROM entity WHERE id=%s AND version=%s` read.) + a `library/tests/` integration test.
- **Editor: fix `fetchEntityBody`** (`editor/src/persistence/library.ts`) to call `GET {base}/v1/entities/{type}/{id}/versions/{version}/definition` (built from `parseRef`). Returns the body or `null` on non-OK/error (unchanged contract). This makes Library-pinned refs resolve + preview correctly through the existing pool-first resolver.
- **Editor: browse client** (`editor/src/persistence/library.ts`): `searchEntities(etype, q, opts)` → `{ items: {id, version, title, entity_type}[], total }` from `GET /v1/entities/{etype}?q=&limit=&offset=` (the `Paginated`<`EntitySummary`>). Injectable `fetchImpl`/`baseUrl` like the existing client.
- **Library picker** (`editor/src/library/`): a **modal** `LibraryPicker` opened with `{ etype, onPick(ref: string), onClose }`:
  - debounced search box (the `etype` is fixed by the calling slot); results list (id · title · version);
  - selecting a result fetches its **body** (the new endpoint) and shows a small content snippet (prompt text / option label / message text) so title-less entities (prompts have no `title`) are pickable;
  - **Insert** → `onPick("<id>@<version>")` with the **latest** version the list returned (hard-pin); closes.
  - "Library unavailable" state on fetch failure; empty-results state.
- **Pick wiring** (hard-pinned ref insertion):
  - **ItemEditor:** a "Pick from Library" button beside each "+ Add …": **Prompt / Context / Instruction** → `applyEdit(updateNodeProps(question, { <slot>: { ref } }))`; **Option** → `applyEdit(updateNodeProps(item, { option: { ref } }))`. Picking replaces a pool draft (and may drop the orphaned pool entity it replaced, mirroring C2b remove — see §4).
  - **Canvas (page/section):** **"+ Pick item"** → pick `item` → insert `{ ref: it_…@v }` (a `PageElementSavedItem`); **"+ Pick message"** → pick `message` → insert `{ ref: msg_…@v }`.
  - A Library-pinned ref renders **read-only** in the editor (content is the Library's) with the existing "fork to edit (ED-C4)" note; it previews live via the fixed resolver.
- **Pure helper** (`editor/src/library/picker.ts`): `buildRef(id, version)` + result-shaping (so the modal's logic is testable without a DOM).
- **Tests:** library/ endpoint integration test; editor `searchEntities`/`fetchEntityBody` client tests (injected fetch); `LibraryPicker` RTL (injected client → search → select → snippet → insert); ItemEditor/Canvas pick-wiring tests; a Playwright pick smoke (stub `/v1/entities/**` for both list + body) + screenshot.

### 2.2 Non-goals (deferred)

- **No newer-version notification / upgrade** (→ ED-C3b); C3a **pins the latest** version at pick time — no version-picker UI, no staleness detection.
- **No editing/forking of Library-pinned content** (→ ED-C4) — picked refs are read-only.
- **No translation** (→ ED-E).
- **No full library-catalogue browse experience** — this is a focused, slot-scoped picker, not the `library-web` SPA. No facets/instrument-grouping in the picker (just type + text search).
- **No new Library write/contribution** (OD-08-blocked) — read-only picking only.
- **No live-Vercel redeploy in this slice** — the endpoint lands in `library/`; deploying it to the live Library is a follow-up the owner triggers (editor tests + the Playwright smoke stub the API, so the editor work is verifiable without the deploy).

---

## 3 — Architecture

- **Library** (`entities.py`): one new route handler (the body endpoint), reusing the existing DB read + the `ENTITY_TYPES` guard. + one integration test in `library/tests/integration/`.
- **Editor client** (`persistence/library.ts`): `fetchEntityBody` repointed; new `searchEntities`. Both injectable.
- **`editor/src/library/picker.ts`** (pure): `buildRef`, result normalisation.
- **`editor/src/library/LibraryPicker.tsx`** — modal UI (local state for query/results/selected/body); takes an injected client (default the real one) so RTL can drive it.
- **Picker open/close state** — a small store slice `picker: { open, etype, onPick } | null` + `openPicker(etype, onPick)`/`closePicker`, OR local state lifted to a `PickerHost` rendered once in the app shell. Recommend the **store slice** (slot buttons anywhere can `openPicker`; the host renders the modal once). Confirm during build.
- **Slot buttons:** `ItemEditor` (prompt/context/instruction/option) + `Canvas` (item/message) call `openPicker(etype, (ref) => applyEdit(...))`.

Dependency direction: `library/` (picker UI + client) → `persistence` + store + model; reuses C2b's read-only-ref rendering. The Library change is isolated to `entities.py`.

## 4 — Pick → insert details

- **Ref format:** `<id>@<version>` (e.g. `pr_aiss_q_1@v26.0609`) — the version is the latest published the list returned (OD-06 hard-pin; explicit, never auto-upgraded).
- **Replacing a pool draft:** when picking a Prompt/Option/Context/Instruction for a slot that currently holds a *pool* ref, set the slot to the Library ref AND drop the now-orphaned pool entity (`removePoolEntity`) — mirrors C2b's remove cleanup. A slot holding a Library ref already is simply repointed.
- **Saved Item ref on a page** (`+ Pick item`): inserts `{ ref: it_…@v }` (a `PageElementSavedItem`; `required`/`show_if` overrides are OD-05 — not edited in C3a). Selecting it routes to a read-only view (its content is the Library Item; editing = fork, C4).
- **Preview:** the fixed `fetchEntityBody` resolves the pinned ref's body → the pool-first resolver (pool miss → Library) renders it live. For a saved Item ref, the body is the Item entity (`{question, option}` with nested refs) — the resolver follows them transitively (already supported).

## 5 — Decisions / to verify during build

- **Body endpoint path:** `/v1/entities/{etype}/{eid}/versions/{version}/definition` (matches the questionnaire `/definition` naming). Confirm `parse_ref`/`content_json` types; reuse the questionnaire handler's 404/410 logic verbatim.
- **`fetchEntityBody` version path:** uses the versioned path (no `?version=` query). Update the ED-B client + its test; verify the existing ED-B PreviewPane/resolver tests still pass (they inject fetchers, so they should be unaffected; the library.test.ts `fetchEntityBody` test asserts the URL — update it).
- **Latest version for picking:** `/v1/entities/{etype}?q=` returns the latest published version per id (the list CTE). So the picked `version` is whatever the list row carries — that IS the latest. No separate "list versions" call needed in C3a.
- **Picker state:** store slice vs lifted host — pick the cleaner; the modal must render above the 3-pane shell.
- **Snippet extraction:** from a fetched body, show `content.<locale>.text` (prompt/context/instruction/message) or `content.<locale>.label` (option); fall back to the id. A tiny pure `bodySnippet(body, locale)` helper (tested).
- **etype mapping:** the slot → Library etype: prompt→`prompt`, context→`context`, instruction→`instruction`, option→`option`, item→`item`, message→`message` (matches `ENTITY_TYPES`).

## 6 — Success criteria

ED-C3a is done when: the Library serves entity bodies (`…/versions/{version}/definition`); ED-B previews of Library-pinned refs render real content (not placeholders); and in the editor an author can open a Library picker from a prompt/option/context/instruction slot (or "+ Pick item"/"+ Pick message" on a page), search, see a content snippet, and **insert a hard-pinned `@vYY.MMDD` ref** that previews live and round-trips Schema-2-valid; all suites green (editor + the new library test) + a screenshot delivered.
