# Questionnaire Editor — ED-A + ED-B + ED-C1

The custom React + TypeScript questionnaire **Editor** is being built in stages (ED-A..F). **ED-A** (structural foundation), **ED-B** (inline WYSIWYG preview), and **ED-C1** (inline Option editor) are shipped; see the decomposition table below.

ED-A is the structural foundation of the custom React + TypeScript questionnaire **Editor** — the authoring tool researchers use to create, adapt, version, and translate questionnaires, producing canonical Schema 2 JSON. ED-A ships a static SPA (Vite · React 19 · TypeScript · Tailwind; Zustand + Immer state; dnd-kit; Ajv in-browser validation) with **no backend**: it opens/creates/loads/saves a Schema-2 questionnaire, renders the five-concept structure tree (Block ▸ Page ▸ Section ▸ Item/Message) in a 3-pane shell, lets you restructure + edit metadata, validates, and exports canonical JSON that round-trips Schema-2-valid. Persistence is browser-local (IndexedDB autosave) plus file open/save and open-from-Library.

## Dev quickstart

```bash
cd editor
npm install          # install dependencies (incl. @playwright/test)
npm run dev          # start the Vite dev server
npm test             # vitest unit + RTL suite
npm run typecheck    # tsc -b + tsc -p tsconfig.test.json
npm run build        # typecheck + vite production build
npm run e2e          # Playwright chromium smoke (needs: npx playwright install chromium)
```

The Playwright smoke (`tests/e2e/smoke.spec.ts`) boots the built+previewed app, opens the kitchensink fixture, reorders/selects, exports, and writes a screenshot to `tests/e2e/screenshots/ed-a-workspace.png` (gitignored). A second smoke loads a self-contained preview bundle (`src/__fixtures__/preview_bundle.json`), stubs the Library `/v1/entities/**` endpoint, toggles the preview, asserts the resolved prompt + option render via the renderer, and writes `tests/e2e/screenshots/ed-b-preview.png` (gitignored).

## ED-B — Inline preview

The topbar `▢ Preview` button opens a split-pane WYSIWYG preview that renders the loaded questionnaire using the **Web Viewer renderer library** (`@behaverse/questionnaire-renderer`, OD-03) — the same component the live Web Viewer ships. The renderer is built from `web-viewer/dist-lib` and made available via the `ensure-renderer` prepare step (the `predev` / `prebuild` / `pretest` / `pretypecheck` hooks run `scripts/ensure-renderer.mjs`) plus a Vite alias.

The preview re-renders live on edit, and exposes **language**, **device-frame**, and **scope** (selected page / whole questionnaire) pickers. Leaf `{ref}` entity bodies (prompts, options, etc.) are resolved on demand against the Library via `fetchEntityBody` — `GET {base}/v1/entities/{type}/{id}?version=` — debounced and cached per `ref@version` in-memory for the session.

The preview is **static structural** only: it renders every element unconditionally. Logic (`show_if` / skip / branching / piping), validation, and scoring are **not** evaluated in the preview — those arrive in **ED-D** when the expression evaluator + logic engine are wired into the preview.

## ED-C1 — Option editor

Selecting an **inline item** (an element carrying an inline `option`) — or a matrix **Section's shared option** (`shared_option`) — opens a type-aware **Option editor** in the canvas. The editor edits the response-spec (the OD-15 `Option`) directly, with the ED-B preview reflecting edits live:

- **Type triple** — `input_data_type` (choice / number / text) · `measurement_type` (nominal / ordinal / interval / ratio) · `selection` (single / multiple, for choice).
- **Choice rows** — one row per option with its `value` + per-locale `text`; add (`+ Add choice`), remove, and reorder, keeping structural + per-locale content indices aligned.
- **Numeric bounds** — `min` / `max` / `step` + per-locale `units` for `number`.
- **Text validation** — an `input_validation` regex for `text`.
- **Inline placeholder / help** — language-keyed inline text for non-choice types (help for all).
- **Derived-widget hint** — a "Renders as: …" chip computed from the renderer's `deriveWidget` (Radio / Checkbox / Number input / Text input).

Edits push to the canonical model via the existing `updateNodeProps`; the questionnaire round-trips Schema-2-valid and the preview re-renders live. ED-C1 edits the **primary-language** (`metadata.language`) content; multi-locale translation is **ED-E**. Authoring brand-new items / Prompts (ED-C2), picking from the Library (ED-C3), and editing/forking a referenced Option (ED-C4) are still deferred — the canvas shows a read-only note for `{ref}` options.

## Environment variables

| Var | Default | Purpose |
|---|---|---|
| `VITE_LIBRARY_BASE_URL` | `https://questionnaire-library.vercel.app` | Base URL of the Library read API used by **Open from Library** (fetches the unresolved definition, refs intact). |

## Editor decomposition (ED-A → ED-F)

| Stage | Contents | Depends on | Gate |
|---|---|---|---|
| **ED-A** (this stage) | New `editor/` SPA. Open/create/load/save a Schema-2 questionnaire; in-memory canonical model + Ajv round-trip validation; the 5-concept tree (Block ▸ Page ▸ Section ▸ Item/Message) in a left rail with drag-reorder + move-across-parents; main canvas + right-hand inspector for **structural** nodes + `metadata` (`style`/`flow`). Leaf content is reorder/delete/move-only (ref chips). Persistence = browser-local (IndexedDB autosave) + file open/save + open-from-Library. | Schema 2 (built), Library read API (live) | Load a real Library questionnaire → edit structure/metadata → export → **round-trips Schema-2-valid** |
| **ED-B** | Inline WYSIWYG preview: split-pane using `@behaverse/questionnaire-renderer` (OD-03) directly; live re-render on edit; language + device-frame pickers. Resolves the **denormaliser-for-preview** question (port a JS denormaliser / wasm / service — a real design question for that stage). | ED-A, renderer lib, denormaliser | Loaded questionnaire renders in-pane identically to the Web Viewer |
| **ED-C** | Item / Question / Option authoring + the OD-15 reusable-entity workflow: type-aware item editor; pick-from-Library (embedded read-only browser) vs create-inline; hard-pin `@vYY.MMDD` (OD-06) + the OD-05 override/fork surface. | ED-A, Library read API | Author a new item end-to-end; references hard-pinned; round-trips valid |
| **ED-D** | Logic + validation + scoring builders: structured skip/visibility/piping/branching/randomization + per/cross-question validation + `scores[]` (OD-16). Live checks via `@behaverse/expression-evaluator` (OD-11) + the reference Scorer. | ED-A/C, evaluator, Scorer | Authored expressions validate + preview-evaluate identically to the viewer |
| **ED-E** | Translation interface: side-by-side source/target, one row per translatable text element, per-row status, completeness indicator (over the language-keyed `content` map). | ED-A/C | Add a locale, translate, round-trips valid |
| **ED-F** | Preview deployment + export: "Open in viewer" → ephemeral VS `preview` deployment; export canonical JSON / PDF / printable summary. | ED-A.., VS deployment API | Real preview deployment opens in the live Web Viewer; JSON re-validates |

Build order: **ED-A → ED-B → ED-C → ED-D → ED-E → ED-F**.

## What ED-A does / doesn't do

**Does:**
- Open / create / load / save a canonical Schema-2 questionnaire (file open + Export download).
- Open from Library (id + version) — unresolved definition, references intact.
- Restructure blocks / pages / sections; reorder / move-across-parents / delete items + messages (ref chips, structural only).
- Edit `metadata` + node title; `style` / `flow` panel scaffolding.
- Validate (Ajv over bundled Schema 2 + Schema 1) on demand and on load; export allowed when invalid (with a warning).
- IndexedDB autosave + restore-on-reload.
- **Live WYSIWYG inline preview** (ED-B): the `▢ Preview` button opens a split-pane rendered by the Web Viewer renderer, with language / device / scope pickers and on-demand Library ref resolution.
- **Edit an existing inline Option** (ED-C1): select an inline item or a matrix section's shared option → the type-aware Option editor (type triple, choice rows, numeric bounds, text validation, inline placeholder/help, derived-widget hint) opens in the canvas; edits round-trip valid + the preview updates live.

**Doesn't yet (deferred):**
- Authoring **new** items + their Prompts/Questions (the entity pool) → **ED-C2**.
- Pick-from-Library (embedded read-only browser) → **ED-C3**.
- Editing / forking a **referenced** Option (`{ref}`) or saved-Item ref → **ED-C4** (read-only note for now).
- Live logic / branching / scoring / validation **in the preview** (the preview is static structural — every element renders unconditionally) → **ED-D**.
- Logic / validation builders / scoring / `show_if` expressions (authoring) → **ED-D**.
- Translation interface — multi-locale Option text/units beyond `metadata.language` (locale indicator is inert) → **ED-E**.
- Preview deployment, PDF / printable-summary export → **ED-F**.

See `FOLLOWUPS.md` for known limitations and open items carried out of ED-A.
