# Questionnaire Editor — feature-complete (ED-A..ED-K), built + live

The custom React + TypeScript questionnaire **Editor** is built through **ED-K** and live at [editor-static.vercel.app](https://editor-static.vercel.app). Authoring is feature-complete (ED-A..ED-K); the Phase-3 gate—Library write-back + a real Viewer-Service preview deployment—remains **OD-08 / Identity**-blocked. See the decomposition table below.

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

The preview re-renders live on edit, and exposes **language**, **device-frame**, and **scope** (selected page / whole questionnaire) pickers. Leaf `{ref}` entity bodies (prompts, options, etc.) are resolved on demand against the Library via `fetchEntityBody` — `GET {base}/v1/entities/{type}/{id}/versions/{version}/definition` (the per-entity body endpoint added in ED-C3a) — debounced and cached per `ref@version` in-memory for the session.

The preview now evaluates logic, validation, and scoring **live**: `show_if` / skip / branching / piping and per/cross-question validation run through the expression evaluator (OD-11), and scoring—including a live PHQ-9 score preview—runs through the renderer's scoring engine (**ED-D** + **ED-D4b**).

## ED-C1 — Option editor

Selecting an **inline item** (an element carrying an inline `option`) — or a matrix **Section's shared option** (`shared_option`) — opens a type-aware **Option editor** in the canvas. The editor edits the response-spec (the OD-15 `Option`) directly, with the ED-B preview reflecting edits live:

- **Type triple** — `input_data_type` (choice / number / text) · `measurement_type` (nominal / ordinal / interval / ratio) · `selection` (single / multiple, for choice).
- **Choice rows** — one row per option with its `value` + per-locale `text`; add (`+ Add choice`), remove, and reorder, keeping structural + per-locale content indices aligned.
- **Numeric bounds** — `min` / `max` / `step` + per-locale `units` for `number`.
- **Text validation** — an `input_validation` regex for `text`.
- **Inline placeholder / help** — language-keyed inline text for non-choice types (help for all).
- **Derived-widget hint** — a "Renders as: …" chip computed from the renderer's `deriveWidget` (Radio / Checkbox / Number input / Text input).

Edits push to the canonical model via the existing `updateNodeProps`; the questionnaire round-trips Schema-2-valid and the preview re-renders live. ED-C1 edits the **primary-language** (`metadata.language`) content; multi-locale translation is **ED-E**. Picking from the Library (**ED-C3a** / **ED-C3b**) and editing/forking a referenced Option (**ED-C4**) have shipped—a `{ref}` option carries a **`Fork to edit`** action.

## ED-C2a — entity pool + new items

Selecting a page or section reveals a **`+ Add item`** action in the canvas. It mints a brand-new draft **Prompt** into an editor-local **entity pool** and appends an inline item (a `Question` referencing the new prompt + a default choice `Option`) to the structure, selecting it for editing:

- **Draft `.devN` versions** — minted prompts get a draft id (`pr_new_<n>`) at a draft version derived from `metadata.version` (the CalVer `+ .dev1`), so pool refs (`pr_new_1@v26.0609.dev1`) never collide with Library-pinned refs.
- **Edit in the canvas** — the selected item opens a `PromptEditor` (per-locale **Prompt text** + `name` / `construct` / `dimension` / comma-separated `topics` / `reversed`) above the ED-C1 Option editor; edits write straight back into the pool.
- **Live preview (pool-resolved)** — the preview fetcher resolves pool entities first (re-resolving fresh on every pool edit) and falls back to the Library for non-pool refs, so the new prompt + option render in the WYSIWYG preview as you type.
- **Pool persists in the draft** — the pool is autosaved alongside the model in IndexedDB and restored on reload (legacy drafts load with an empty pool).
- **Export bundle** — a topbar **`Export bundle`** button emits a self-contained `{ questionnaire, entities }` JSON bundle (the pool is the `entities` map), the only way to carry pool entities out of the editor.

## ED-C2b — Context / Instruction + Message authoring

ED-C2b extends new-content authoring beyond Prompts to the remaining content-bearing entities, all minted as draft pool entities (`.devN`) that live-preview and ride along in the bundle export:

- **Add Context / Instruction to a question** — selecting an inline item shows **`+ Add context`** and **`+ Add instruction`** sections in the canvas (between the Prompt block and the Option editor). Each mints a draft pool entity (`ctx_new_<n>` / `ins_new_<n>`) and points the `Question`'s `context` / `instruction` ref at it. Edit the per-locale text inline; an **Instruction** also carries a `dimension` (e.g. `agreement`), which is deleted from the body when cleared. **`Remove context` / `Remove instruction`** unsets the ref and drops the (per-add minted) pool entity.
- **Add a standalone Message to a page** — selecting a page or section shows **`+ Add message`** beside `+ Add item`. It mints a draft `Message` (`msg_new_<n>`, default `type: ['information']`) and appends a `MessageRef` element, selecting it to open the **MessagePane**: a comma-separated `type`-tag input + per-locale **Message text** field.
- **Live preview + bundle export** — Context / Instruction / Message all resolve through the same pool-first preview path and export inside the `{ questionnaire, entities }` bundle. Library-pinned (`{ref}`) Context / Instruction / Message bodies show a read-only "fork to edit (ED-C4)" note.

## ED-C3a — pick from Library

ED-C3a lets an author insert an **existing Library entity** into a slot instead of authoring a new pool draft. A modal **Library picker** (`src/library/LibraryPicker.tsx`) opens, searches the Library by entity type, shows a content snippet of the selected entity, and inserts a **hard-pinned `@vYY.MMDD` ref** on confirm:

- **Where it opens** — per-slot **Pick from Library** buttons in the ItemEditor (`Pick prompt` / `Pick option` / `Pick context` / `Pick instruction`), and the page/section **`+ Pick item`** / **`+ Pick message`** actions in the Canvas.
- **Search → snippet → insert** — type in the **Search** field (debounced) to list matching entities (`searchEntities` → `GET /v1/entities/{etype}?q=…`); selecting one fetches its body and shows a per-locale **content snippet** (prompt/option text or label); **Insert** pins `id@version` into the slot. Picking a slot that held a pool draft drops the orphaned draft.
- **Hard-pinned latest** — C3a pins the **latest** version surfaced at pick time. Explicit version selection + newer-version detection/upgrade (OD-06) is **ED-C3b**.
- **Read-only + live preview** — picked refs are **read-only** in the editor (forking / editing a referenced entity is **ED-C4**); they preview live via the same resolver, now fixed (ED-B FOLLOWUP (g)).
- **Library endpoint dependency** — the picker's snippet and the preview both rely on the new per-entity **body endpoint** `GET /v1/entities/{etype}/{eid}/versions/{version}/definition` (added in `library/`). `fetchEntityBody` now targets this versioned `/definition` path (the old `?version=` query path returned metadata, which broke the ED-B Library-ref preview). The live Vercel Library must be redeployed to expose it (tests + the Playwright smoke stub it).

## ED-C3b — newer-version upgrade (OD-06)

ED-C3b flags Library-pinned refs whose entity has a **newer published version** and lets the author upgrade each one **explicitly — never silently**:

- **Staleness check** — on each model load (boot restore + New / Open file / Open from Library), and on demand via a topbar **`Check for updates`** button, the editor reads each Library-pinned ref's **latest published version** (`GET /v1/entities/{etype}/{eid}` → `EntitySummary.version`, the `max(published)`) and compares it to the pinned CalVer (`isNewer`, in `src/library/staleness.ts`). Pool drafts (`.devN`) and refs the Library doesn't resolve are **not** flagged.
- **Per-chip flag** — a stale Library ref shows a **`newer: vX [Upgrade]`** badge (`UpgradeBadge`) inline on its read-only chip across the **ItemEditor** (prompt / context / instruction / option-ref slots), the **MessagePane** (message ref), and the **Canvas** element list (saved-item / message refs). The badge self-hides when the ref isn't stale.
- **Topbar count** — when anything is stale, the topbar shows a **`⬆ N updates`** badge beside the buttons.
- **Explicit upgrade** — clicking **Upgrade** re-points the ref to the newer version across **all occurrences** in the questionnaire (`upgradeRef`, an immutable replace-all tree op) and clears that entry's badge; the preview re-resolves at the new version. There is **no auto-upgrade** — the version only ever changes when the author clicks Upgrade.
- **No content diff** — ED-C3b surfaces the version + one-click upgrade only; a pinned-vs-latest content diff view is deferred (see FOLLOWUPS). Staleness is **not transitive** — refs nested *inside* a Library entity's body are owned by the Library, not re-checked here.

## ED-C4 — override + fork (OD-05)

ED-C4 turns read-only Library-pinned refs into **forkable, study-scoped local copies** and adds the OD-05 `required` override — **completing ED-C**:

- **Fork to edit** — every read-only Library-pinned ref chip (prompt / context / instruction / option / message / saved-item, across the **ItemEditor**, the **MessagePane**, and the **Canvas** element list) now shows a **`Fork to edit`** button in place of the old static "fork to edit (ED-C4)" note.
- **Fork dialog** — clicking it opens a `ForkDialog` modal offering three actions: **Derive locally** (enabled), **Propose a new shared version** (disabled — needs Identity / Library write, **OD-08**), and **Cancel**.
- **Derive locally** — fetches the pinned entity's body and copies it into the editor-local **entity pool** as `<id>@<pinnedVer>.dev1` (reusing the C2a `draftVersion` minting), then **repoints all occurrences** of the original ref to the new pool draft (`repointRef`, the generalized C3b replace-all tree op). The forked entity becomes **editable** in the pool editors (PromptEditor / ContentTextEditor / Option editor), previews live (pool-resolved), and rides along in the `{questionnaire, entities}` bundle export. A failed body fetch leaves the model unchanged and surfaces an error in the dialog.
- **`required` override** — item rows in the Canvas element list carry a **`Required`** checkbox bound to the element's `required` flag (the first of OD-05's free overrides). Position is overridable via reorder; `show_if` (the third OD-05 override) arrives with the **ED-D** logic builder.
- **Never writes the Library** — forking is purely local; the Library is read-only from the editor (promotion → OD-08).

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
- **Author new items + Prompts** (ED-C2a): `+ Add item` mints a draft Prompt into the local entity pool (`.devN` versions), edit its text + metadata (`PromptEditor`) in the canvas, see it live in the pool-resolved preview; the pool persists in the draft and exports as a `{questionnaire, entities}` bundle (`Export bundle`).
- **Author new Context / Instruction / Message** (ED-C2b): add a Context and/or an Instruction (with a `dimension`) to a question, and standalone Messages (with `type` tags + text) to a page (`+ Add message`); all are draft pool entities that live-preview and ride along in the bundle export; remove drops the per-add pool entity.
- **Pick from Library** (ED-C3a): a modal picker (search by entity type + content snippet) opens from per-slot **Pick from Library** buttons (prompt / option / context / instruction) and the page **`+ Pick item`** / **`+ Pick message`** actions; inserts a hard-pinned latest `@vYY.MMDD` ref that previews live and is read-only. Relies on the new Library per-entity body endpoint (which also fixed the ED-B Library-ref preview).
- **Newer-version upgrade** (ED-C3b): on load + via the topbar **`Check for updates`** button, stale Library-pinned refs are flagged per-chip with **`newer: vX [Upgrade]`** plus a topbar **`⬆ N updates`** badge; **Upgrade** re-points all occurrences of the ref explicitly (never silent) and re-resolves the preview.
- **Override + fork** (ED-C4): a Library-pinned ref shows **`Fork to edit`** → a fork dialog (**Derive locally** enabled; **Propose a new shared version** disabled per OD-08; Cancel); deriving copies the entity into the local pool as `<id>@<pinnedVer>.dev1`, repoints all occurrences, and makes it editable; the OD-05 `required` override is a **`Required`** checkbox on item rows. Forking never writes the Library.

**Doesn't yet (deferred):**
- A pinned-vs-latest **content diff** view (ED-C3b surfaces the version + one-click upgrade only); **transitive** staleness of refs nested inside a Library entity's body → out of scope (the Library owns its entities' internal pinning).
- Standalone **Placeholder / Help / RegEx / Solution** editors (Placeholder / Help are inline-editable inside the Option editor) → later.
- Renaming pool-entity ids (minted `pr_new_<n>` ids stick) → later nicety.
- Promoting pool drafts to real Library versions → **OD-08** (needs Identity / write).
- A real Viewer-Service **`preview` deployment** ("Open in viewer") → **OD-08** (the standalone shareable `preview.html` + Markdown / SurveyJS export have shipped).

See `FOLLOWUPS.md` for known limitations and open items carried out of ED-A.
