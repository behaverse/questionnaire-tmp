# Editor ED-F (Standalone Shareable Preview) — Design Spec

**Date drafted:** 2026-06-16
**Author:** Editor ED-F brainstorming session (2026-06-16)
**Component:** **Editor**, sub-project **ED-F** (the final planned editor stage, "preview deployment + export"). **Scoped to a standalone, no-backend shareable preview** (owner decision 2026-06-16). Real Viewer-Service deployment is OD-08-blocked and deferred.
**Builds on:** ED-B/D (the in-app preview: `PreviewPane`, `projectForPreview`, `resolveEntities`/`makePoolFetcher`, the renderer lib `@behaverse/questionnaire-renderer`, the bundled OD-11 wasm evaluator, `applyPiping`/`filterPageVisible`/`collectPerQuestionErrors`/`collectCrossQuestionErrors`), ED-A/C2a (`exportToFile`/`exportBundle`/`bundleData`). Memories `project_editor_ed_d3b`, `project_editor_ed_e`, `project_editor_ed_b`.
**Stack:** Vite (multi-entry) · React 19 · TS · Tailwind · vitest+RTL · Playwright (editor-only).

**Authoritative source documents:**

- [design/07_editor.md](../../../design/07_editor.md) §8: "Open in viewer" creates a **Preview deployment** in the Viewer Service (preset `preview`) — a shareable URL for non-Editor collaborators.
- **Feasibility (from the ED-F exploration):** real VS `preview` deployment is **NOT buildable** — the VS rejects the `preview` preset (`modes.py` supports only `anonymous_link`/`demo`; `preview` → 422 "requires Identity/Platform/host integration"), OD-08 Identity doesn't exist (`editor_session` auth unimplemented), and the VS mints runtimes by resolving the questionnaire **from the Library** (drafts with pool `.devN` entities aren't in the Library; the Library has no write API — GitHub-PR ingest only). → deployment deferred; **ED-F = a self-contained standalone preview** reusing the renderer + the editor's projection, no backend.
- Editor: `editor/src/preview/PreviewPane.tsx` (store-driven preview: `resolveEntities` + `projectForPreview` → render with locale/device/scope/answers + evaluator), `editor/src/preview/{project,resolver,flatten}.ts`, `editor/src/persistence/file.ts` (`bundleData` = `{questionnaire, entities}`, `exportBundle`, `readQuestionnaireFile`), `editor/vite.config.ts` (single `index.html` entry; renderer aliased to `web-viewer/dist-lib`), `editor/src/app/Topbar.tsx`.

---

## 1 — Scope (ED-F)

### 1.1 In scope

- **Extract `PreviewView`** (`editor/src/preview/PreviewView.tsx`) — the reusable runtime-rendering core, props `{ runtime, problems, initialLocale? }`: owns `locale`/`device`/`scope`/`answers` state + `useEvaluator` + the pipe→filter→validate→`StepRenderer` render + the language/device/scope toolbar + the problems banner. No store access. `scope` defaults to `'all'` in standalone.
- **`PreviewPane` → thin wrapper** — keeps its store→`resolveEntities`→`projectForPreview` pipeline + selection-driven page scope, then renders `<PreviewView>`. Existing PreviewPane RTL tests (PreviewVisibility/Piping/Validation) stay green unchanged (behaviour preserved).
- **Standalone entry** — `editor/preview.html` + `editor/src/preview-main.tsx` (mounts `<StandalonePreview/>` + `./index.css`); `vite.config.ts` `build.rollupOptions.input` = `{ main: index.html, preview: preview.html }`.
- **`StandalonePreview`** (`editor/src/preview/StandalonePreview.tsx`) — loads a bundle (`sessionStorage['qv-preview-bundle']` handoff, else a "Load a bundle (.bundle.json)" file input), runs `resolveEntities(questionnaire, makePoolFetcher(() => entities))` + `projectForPreview` → renders `<PreviewView>`. Header: title + "read-only preview — not a deployment" note. No store, no backend.
- **`parseBundle`** (`editor/src/persistence/file.ts`) — `(text) → { questionnaire, entities }`, validates shape, throws on non-bundle.
- **Editor action** — Topbar **"Open preview"**: `sessionStorage.setItem('qv-preview-bundle', JSON.stringify(bundleData(model, pool)))` (try/catch) then `window.open('/preview.html', '_blank')`.
- **Tests:** `PreviewView` RTL; `PreviewPane` regression (existing); `parseBundle`; `StandalonePreview` RTL (sessionStorage + file + malformed + missing-entity); Topbar action; a Playwright standalone-preview smoke + screenshot.

### 1.2 Non-goals (deferred → FOLLOWUPS)

- **Real Viewer-Service `preview` deployment** — OD-08-blocked (no Identity; VS rejects `preview`; drafts not Library-resolvable). Deferred until OD-08.
- **Fully-inlined zero-hosting single-file HTML** (renderer JS + wasm base64-inlined) — the standalone page is served from the editor's build (or run locally); a hosting-free single file is a heavier follow-on.
- **Library-ref resolution in the standalone** — no network → Library refs not in the bundle render as placeholders (fork into the pool to include them).
- **Scores in the standalone** — `score()` null (no scorer runtime; D4b deferred).
- **PDF / printable-summary exports**; the Logic/Validation/Scoring → Inspector tabs consolidation.

---

## 2 — Architecture & components

- **`editor/src/preview/PreviewView.tsx`** — `PreviewView({ runtime, problems, initialLocale }: { runtime: Runtime; problems: RefProblem[]; initialLocale?: string })`. Hooks: `useState` locale (init `initialLocale ?? runtime.metadata.language`)/device/scope(`'all'` default)/answers, `useEvaluator`. Body = the current PreviewPane render (lines ~59–110): `makeBindings(answers, {score: () => null})` → `applyPiping` → `filterPageVisible` → `collectPerQuestionErrors` + `collectCrossQuestionErrors` → per-page `StepRenderer` with `requiredErrors`/`errorMessages` + the toolbar + problems banner. Pure w.r.t. props (no store).
- **`editor/src/preview/PreviewPane.tsx`** — keeps the store reads (`model`, `pool`, `selection`) + the `resolveEntities`/`projectForPreview` effect + the selection→`selectedPageId` logic; passes the resulting `runtime`/`problems` (and a page-scope hint) to `<PreviewView>`. Net: same rendered output, behaviour-preserving.
- **`editor/preview.html`** — mirrors `index.html`, `<script type="module" src="/src/preview-main.tsx">`.
- **`editor/src/preview-main.tsx`** — `createRoot(...).render(<StrictMode><StandalonePreview/></StrictMode>)` + `import './index.css'`.
- **`editor/vite.config.ts`** — add `build: { rollupOptions: { input: { main: resolve(__dirname, 'index.html'), preview: resolve(__dirname, 'preview.html') } } }`.
- **`editor/src/preview/StandalonePreview.tsx`** — state: `bundle | null` + `error | null`. On mount: read `sessionStorage['qv-preview-bundle']`; if present `parseBundle` → set bundle (catch → error). Else render a file `<input>` ("Load a bundle (.bundle.json)") → on file → `parseBundle(text)`. When a bundle is set: `useMemo` `resolveEntities` (async via `makePoolFetcher(() => bundle.entities)`) → `entityMap` → `projectForPreview` → `{runtime, problems}` → `<PreviewView runtime problems />`. Header with title + read-only note.
- **`editor/src/persistence/file.ts`** — `export function parseBundle(text: string): { questionnaire: Questionnaire; entities: Record<string, EntityBody> }` (JSON.parse; assert `questionnaire?.metadata` + `entities` object; throw `Error('Not a valid questionnaire bundle')` otherwise).
- **`editor/src/app/Topbar.tsx`** — "Open preview" button: `try { sessionStorage.setItem('qv-preview-bundle', JSON.stringify(bundleData(model, pool))) } catch {}` then `window.open('/preview.html', '_blank')`.

**Dependency direction:** `PreviewView` (props-driven) ← reused by `PreviewPane` (store wrapper) + `StandalonePreview` (bundle wrapper). `StandalonePreview` reuses `resolveEntities`/`makePoolFetcher`/`projectForPreview`/`parseBundle`. The standalone entry shares the editor build's renderer alias + bundled evaluator wasm. No store/backend in the standalone path.

## 3 — Data flow + edge semantics

**Author self-preview:** "Open preview" → write `bundleData(model, pool)` to sessionStorage → open `/preview.html` → `StandalonePreview` reads it → resolve/project → `<PreviewView>` (live throwaway answers + show_if/piping/validation). Same-browser handoff; read once on mount.

**Recipient:** export bundle (`<id>.bundle.json`) + share → recipient opens the standalone page → file-open → same pipeline.

**Edges:** no bundle → file-open prompt + hint (not an error); malformed/non-bundle → inline "Not a valid questionnaire bundle", no crash; missing referenced entities (e.g. Library refs not in the bundle) → `projectForPreview` `problems[]` → amber "N referenced entities not loaded (showing placeholders)" banner (no network fallback in standalone); scores → null; sessionStorage setItem failure (quota) → try/catch, page falls back to the file-open prompt. The page header notes "read-only preview — not a deployment" (no data collected/forwarded; not the OD-08 VS deployment).

**Refactor safety:** the `PreviewView` extraction must preserve `PreviewPane` behaviour; the existing PreviewVisibility/Piping/Validation RTL tests are the regression guard (stay green unchanged).

## 4 — Test plan

- `PreviewView` (RTL) — renders a runtime; toolbar (locale/device/scope) works; live show_if/piping/validation; problems banner when `problems.length>0`.
- `PreviewPane` regression — existing PreviewVisibility/Piping/Validation suites stay green unchanged.
- `parseBundle` — valid bundle parses; non-bundle throws; round-trips `bundleData`.
- `StandalonePreview` (RTL) — sessionStorage path renders; file-open path renders; malformed file → inline error, no crash; missing-entity bundle → placeholders banner, no crash.
- Topbar (RTL) — "Open preview" writes the bundle to `sessionStorage['qv-preview-bundle']` + calls `window.open('/preview.html', …)` (spied).
- Playwright — drive `preview.html` with a bundle seeded via `page.addInitScript` (sessionStorage), assert the prompt renders + answering a control reveals a `show_if` element; screenshot.

## 5 — Success criteria

1. Reusable `PreviewView` renders a runtime with live answers + logic/validation; `PreviewPane` is a thin wrapper; all prior preview tests stay green.
2. A standalone `preview.html` renders an exported bundle full-page with no store/backend; logic/validation work; malformed/missing-entity cases degrade gracefully.
3. "Open preview" opens the standalone page for the current draft (sessionStorage); the file-open path loads a shared `.bundle.json`.
4. The page is clearly labelled read-only / not-a-deployment.
5. All suites green; a screenshot delivered showing the standalone preview rendering a questionnaire.

Real Viewer-Service deployment remains the OD-08-gated follow-on; ED-F delivers the no-backend shareable preview that realizes the "share a preview with collaborators" intent today.
