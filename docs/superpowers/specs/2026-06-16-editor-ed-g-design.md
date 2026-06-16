# Editor ED-G (Usability & Onboarding Pass) — Design Spec

**Date drafted:** 2026-06-16
**Author:** Editor ED-G brainstorming session (2026-06-16)
**Component:** **Editor**, sub-project **ED-G** — a usability/onboarding pass after the feature-complete ED-A..F authoring arc. Driven by owner hands-on feedback (`editor_feedback.md`, 2026-06-16): the authoring engine is complete but the tool is hard to approach — no sample to explore, manual id+version typing to open from the Library, no way back to the home screen, a mis-ordered label, and a flaky preview caused by a Library fetch storm.
**Builds on:** ED-A (`StartScreen`, `App` shell, `newQuestionnaire` scaffold, `loadModel`, IndexedDB autosave), ED-B/F (`{questionnaire, entities}` bundle format, `StandalonePreview`, `resolveEntities`/`makePoolFetcher`), ED-C3a/b (`fetchEntityBody`, `latestVersion`, `fetchFromLibrary`), ED-C3a `LibraryPicker`. Memories `project_editor_ed_f`, `project_editor_ed_c3a`, `project_editor_ed_c3b`.
**Stack:** Vite · React 19 · TS · Tailwind · Zustand+Immer · vitest+RTL · Playwright (editor-only).

**Authoritative source documents:**
- Owner feedback: `editor_feedback.md` (the six items below map 1:1 to it).
- Editor: `editor/src/app/StartScreen.tsx` (manual New/Open-file/Open-from-Library only), `editor/src/app/App.tsx` (`model === null` ⇒ StartScreen; autosave restore on boot), `editor/src/app/Topbar.tsx` (no Home control; store `reset()` exists but is UI-unwired — `state/store.ts`), `editor/src/canvas/ItemEditor.tsx:108` (`"Response (Option)"` label), `editor/src/library/LibraryPicker.tsx` (entity search modal, `searchEntities`), `editor/src/persistence/library.ts` (`fetchFromLibrary` requires a version; `latestVersion`; `fetchEntityBody`), `editor/src/preview/resolver.ts` + `editor/src/pool/poolFetcher.ts` (entity resolution — no concurrency cap, no retry).
- Library API: `GET /v1/questionnaires/{qid}/versions/{version}/resolution-bundle` returns `{ definition, entities }` (entities keyed `<id>@<version>`); `GET /v1/questionnaires?q=` (instrument-grouped catalogue); full-text search indexes **title + description only** (`library/src/library/store/index.py:22-28`).

---

## 1 — Scope

Six independent, small items. All editor-side except the bundle generation, which reads the live Library once.

### 1.1 In scope

**(G1) StartScreen "Load a sample".** A fourth action on the home screen — **"Load a sample — explore a ready-made questionnaire"** — that loads a **self-contained `{questionnaire, entities}` bundle** shipped in the repo at `editor/src/samples/bisbas.bundle.json`, via `loadModel(questionnaire, { kind: 'sample', id: 'qst_x_bisbas' }, entities)`. Because prompts are ref-only (OD-15), the sample carries all referenced entities in its pool so it renders **fully offline** (no Library fetch). Source = **`qst_x_bisbas` ("Behavioral Approach/Inhibition Systems (BIS/BAS)"), latest `v26.0606`** (owner choice). The bundle is generated once at authoring time (see §3) and committed as a static asset; it is NOT fetched at runtime.

**(G2) Browse-from-Library picker.** Replace the StartScreen's two free-text inputs (id + version) as the *primary* affordance with a **"Browse Library…"** button that opens a modal listing questionnaires from `GET /v1/questionnaires?q=` (title + id + latest version, debounced search mirroring `LibraryPicker`). Selecting one loads its **latest version by default** (`latestVersion('questionnaire', id)` → `fetchFromLibrary(id, latest)`). The manual id+version inputs remain as a secondary fallback (collapsed/below), so power users keep the explicit path.

**(G3) Back-to-home button.** A **"← Home"** button in the `Topbar` (leftmost) that returns to the StartScreen by clearing the model (wire the store's existing `reset()`). If the model has unsaved changes (`source` dirty / autosave pending), guard with a `window.confirm`. The autosaved IndexedDB draft is **kept** (reload still resumes); ED-G adds no "resume last draft" StartScreen entry (reload already does that).

**(G4) Label flip.** `editor/src/canvas/ItemEditor.tsx:108` `"Response (Option)"` → `"Option (Response)"` (Option is the primary concept). Single hardcoded string; no shared label map.

**(G5) Search-scope hint.** A small caption — *"Searches title & description."* — under the search field in both the StartScreen Browse modal (G2) and the existing `LibraryPicker`. Sets correct expectations: the server full-text index covers title + description only, not ids or item body text.

**(G6) Library fetch throttle + retry.** Wrap the editor's Library fetches (entity-body resolution + `latestVersion` staleness checks) in a **concurrency-limited pool (max 5 in flight) + one retry with short backoff** on network/5xx failure. Fixes the boot-time fetch storm that makes ref-based questionnaires (e.g. AISS) render flaky "Unsupported element" placeholders. Implemented as a small reusable helper in the persistence layer; `fetchEntityBody`/`latestVersion`/the resolver route through it.

### 1.2 Non-goals (deferred → FOLLOWUPS)

- **Server-side search-index expansion** to item/prompt body text — a Library schema + reseed change, separate concern (G5 only sets UI expectations).
- **Multi-sample gallery / template chooser** — one curated sample (YAGNI).
- **"Resume last draft" StartScreen entry / draft manager** — reload already resumes the autosave.
- **Live score preview** (needs a bundled scorer runtime) and **real one-click deploy** (OD-08-blocked) — unchanged deferrals from ED-D4/ED-F.

---

## 2 — Architecture & components

- **`editor/src/samples/bisbas.bundle.json`** (NEW, static asset) — `{ questionnaire, entities }`, the frozen BIS/BAS resolution bundle. Imported directly (Vite JSON import) by the StartScreen loader; no runtime network.
- **`editor/scripts/build-sample.mjs`** (NEW, authoring-time only) — fetches `…/qst_x_bisbas/versions/v26.0606/resolution-bundle`, remaps `{ definition → questionnaire, entities }`, writes `src/samples/bisbas.bundle.json`. Run once by the implementer; documented in the file header. Not part of the app build.
- **`editor/src/app/StartScreen.tsx`** — add the "Load a sample" action (`onLoadSample`) and the "Browse Library…" button (`onBrowseLibrary`) above the now-secondary manual id+version inputs; add the G5 caption to any in-StartScreen search. Props extended: `onLoadSample: () => void`, `onBrowseLibrary: () => void`.
- **`editor/src/library/LibraryQuestionnairePicker.tsx`** (NEW) — modal mirroring `LibraryPicker`'s structure but querying `GET /v1/questionnaires?q=` and returning a chosen `{ id, version }` (latest). Reuses the debounced-search + error ("Library unavailable") pattern. Includes the G5 caption.
- **`editor/src/app/App.tsx`** — wire `onLoadSample` (`loadModel(bundle.questionnaire, { kind: 'sample', id }, bundle.entities)`), `onBrowseLibrary` (open the questionnaire picker → `latestVersion` → `fetchFromLibrary` → `loadModel`), and the Topbar Home action (`reset()` with dirty-guard).
- **`editor/src/app/Topbar.tsx`** — add the leftmost "← Home" button calling an `onHome` prop (or store `reset()` directly with a confirm).
- **`editor/src/canvas/ItemEditor.tsx`** — the G4 one-line label change.
- **`editor/src/persistence/concurrency.ts`** (NEW) — `mapLimit`/`withRetry` helper: a small promise pool (max N concurrent) + single-retry-with-backoff wrapper. Pure, unit-tested.
- **`editor/src/persistence/library.ts`** + **`editor/src/preview/resolver.ts`/`pool/poolFetcher.ts`** — route entity-body + latest-version fetches through the throttle/retry helper.

**Dependency direction:** StartScreen + Topbar (UI) → App (wiring) → store (`loadModel`/`reset`) and persistence (`fetchFromLibrary`/`latestVersion`/sample import). The throttle helper sits under the persistence/resolver fetches; the sample bundle is a leaf static asset.

---

## 3 — Data flow + edge semantics

**Load a sample:** StartScreen "Load a sample" → `loadModel(bisbas.questionnaire, {kind:'sample', id:'qst_x_bisbas'}, bisbas.entities)` → editor opens with the pool pre-populated → preview renders fully (NO "referenced entities not loaded" banner, because every ref is in the bundle). Autosaves like any draft.

**Browse Library:** StartScreen "Browse Library…" → modal searches `/v1/questionnaires?q=` → user picks a questionnaire → `latestVersion('questionnaire', id)` → `fetchFromLibrary(id, latest)` → `loadModel(..., {kind:'library', id, version:latest})`. Manual id+version fallback still calls the existing `onOpenLibrary` path.

**Back to Home:** Topbar "← Home" → if dirty, `window.confirm("Leave this questionnaire? Your draft is autosaved and will be here when you return.")` → `reset()` ⇒ `model` null ⇒ App renders StartScreen. The IndexedDB draft persists; a browser reload re-restores it (existing boot behaviour).

**Throttle/retry:** the resolver enqueues all entity fetches; the pool runs ≤5 concurrently; a failed fetch retries once after a short backoff, then resolves to a placeholder (existing behaviour) rather than throwing. Net: ref-based questionnaires resolve reliably; the preview stops flickering placeholders.

**Edges:** sample bundle import is synchronous + offline (can't fail at runtime); Browse modal with the Library unreachable shows "Library unavailable" (existing pattern), and the manual fallback remains; Home with no unsaved changes skips the confirm; throttle helper with an empty queue is a no-op.

**Generation safety (§3, authoring-time):** `build-sample.mjs` is run once by the implementer against the live Library; the committed JSON is the source of truth thereafter. If BIS/BAS is re-published at a new version, re-run the script to refresh the asset (documented in its header).

---

## 4 — Test plan

- **Sample (RTL):** "Load a sample" → editor mounts with the BIS/BAS title; preview shows **no** "entities not loaded" banner (self-contained). Assert the bundle import shape (`questionnaire.metadata` + non-empty `entities`).
- **Browse picker (RTL):** typing a query searches `/v1/questionnaires` (stubbed); selecting an item calls `latestVersion` then `fetchFromLibrary(id, latest)` (spied) — proves latest-default.
- **Back-to-home (RTL):** with a loaded model, clicking "← Home" (confirm stubbed true) → StartScreen renders; draft-keep verified (IndexedDB save not cleared).
- **Label (RTL/grep):** ItemEditor renders "Option (Response)", not "Response (Option)".
- **Throttle (unit):** `mapLimit` never exceeds N concurrent (instrument with a counter); `withRetry` retries once on failure then succeeds/falls back; deterministic, no real network.
- **Search-scope hint (RTL):** the caption renders in both pickers.
- **Playwright smoke:** home → "Load a sample" → BIS/BAS prompt renders in preview with no placeholder banner → "← Home" returns to StartScreen → screenshot. Plus a FULL `npm run e2e` re-run (the Topbar gains a button — watch for selector ambiguity, per the ED-E/ED-F e2e-rot lesson).

---

## 5 — Success criteria

1. The home screen offers a one-click **"Load a sample"** that opens BIS/BAS and renders fully offline (no placeholder banner).
2. Opening from the Library is **browsable** (search + pick) and defaults to the **latest version**; no required manual version typing for the primary path.
3. A **"← Home"** button returns to the StartScreen from any questionnaire (draft kept).
4. The item label reads **"Option (Response)"**.
5. Both Library search fields show the **"Searches title & description"** hint.
6. Ref-based questionnaire previews resolve **reliably** (throttle + retry); no flaky placeholders.
7. All suites green; full e2e re-run green; a screenshot of the sample loaded in the editor.

ED-G is a usability pass: it adds **no new authoring capability** but makes the feature-complete editor approachable and removes the rough edges the owner hit on first contact.
