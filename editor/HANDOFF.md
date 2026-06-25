# Editor — Handoff

**Path:** `editor/` · **Stack:** Vite + React 19 + TypeScript + Tailwind (Zustand + Immer state, dnd-kit, Ajv in-browser) · **Status:** ✅ built + LIVE (https://editor-static.vercel.app, incl. auto-translate) · **Suggested branch:** `work/editor`

> The visual authoring app researchers use to create, adapt, version, translate, and preview questionnaires, producing canonical **Schema-2 JSON**. It is the design-time front-end of the platform; the canonical JSON it emits is what the Viewer Service + Web Viewer run.
> For deep detail see [README.md](README.md); for the raw deferred-items backlog see [FOLLOWUPS.md](FOLLOWUPS.md); for the design spec see [design/07_editor.md](../design/07_editor.md).

## What it is
- **Static SPA, no backend of its own** (one optional serverless function, `api/translate`). Opens / creates / loads / saves a Schema-2 questionnaire; IndexedDB autosave + file open/save + open-from-Library. Exports canonical JSON that round-trips Schema-2-valid, and a self-contained `{questionnaire, entities}` **bundle**.
- **3-pane shell + 5-concept structure tree** (Block ▸ Page ▸ Section ▸ Item/Message) with drag-reorder + move-across-parents (`src/tree`, `src/canvas`, `src/inspector`).
- **Inline WYSIWYG preview** (`src/preview`) rendered by the **Web Viewer renderer lib** `@behaverse/questionnaire-renderer` (OD-03) via a Vite alias to `web-viewer/dist-lib`. Live logic (show_if/skip/branch/piping/validation) via the **WASM expression evaluator** (OD-11) + **live PHQ-9 score preview** (ED-D4b, reusing the renderer's `/scoring` engine).
- **OD-15 reusable-entity workflow** (`src/pool`, `src/library`): author inline (draft `.devN` pool entities) OR **pick-from-Library** with hard-pinned `@vYY.MMDD` refs; **OD-06** newer-version upgrade (explicit, never silent); **OD-05** override + **fork** (derive-locally into the pool).
- **Logic / validation / scoring builders** (`src/logic`, `src/option`) — `scores[]` (OD-16), per/cross-question validation, skip/branch/visibility/piping/randomization.
- **Translation** (`src/translate`): per-locale `content`, side-by-side source→target panel, and machine **auto-translate** via `api/translate` → Claude. **Library Entity Browser** (`src/library/browser`, ED-K) browses / edits / batch-translates Library entities into a local edit session (export-only).
- **Standalone shareable preview** (`src/preview-main.tsx`, builds `preview.html`) — no-network, runs an exported bundle.

## Run & test
```bash
cd editor
npm install
npm run dev        # Vite, PINNED to :5173 (live-Library CORS); serves /api/translate via dev shim if editor/.env.local has a key
npm test           # vitest unit + RTL (~435 tests)
npm run typecheck  # tsc -b + tsc -p tsconfig.test.json
npm run build      # typecheck + vite build → emits index.html + preview.html + wasm + samples
npm run e2e        # Playwright chromium (~24 specs); needs: npx playwright install chromium
```
- **Renderer dependency (the big one):** the preview consumes `@behaverse/questionnaire-renderer` built from `web-viewer/dist-lib`. The `pre*` hooks run `scripts/ensure-renderer.mjs` + `build-evaluator.mjs` + `ensure-scorers.mjs`. **After changing the renderer, re-run web-viewer `build:lib` and restart the editor** — a stale `dist-lib` silently serves the old renderer.
- **Auto-translate:** needs ONE of `ANTHROPIC_API_KEY` / `AI_GATEWAY_API_KEY` (+ optional `TRANSLATE_MODEL`). `editor/.env.local` is gitignored. Without a key, auto fails gracefully inline; manual translation is unaffected.
- **Library API:** `VITE_LIBRARY_BASE_URL` (default `https://questionnaire-library.vercel.app`). Picker + preview rely on the live per-entity body endpoint `GET /v1/entities/{etype}/{eid}/versions/{version}/definition` (live + auto-deployed; tests stub it).

## What's left to do
The editor is **feature-complete + LIVE** (ED-A..K shipped; modal a11y, M2 deploy/auto-translate, and ED-D4b live score preview are all DONE — do not treat those as open). Remaining work is the **OD-08 / schema-gap** backlog plus small polish.

### Now
- **(none blocking)** — the app ships. The items below are either blocked or optional.

### Next (small / unblocked)
- **Single-file offline preview** — `preview.html` is a second Vite entry served from the editor build, not a truly hosting-free single HTML (renderer JS + wasm base64-inlined). FOLLOWUPS `ed-f-2`.
- **Picker / search by body text** — Library server search indexes **title + description only**; authors can't find a prompt by its wording. Extending the index is a Library schema + reseed change. FOLLOWUPS `ed-g-1`.
- **Consolidate global panels into tabs** — Logic / Validation / Scoring still render as three stacked sections in the questionnaire-root Inspector; fold into Inspector tabs (`Tabs` infra already exists). FOLLOWUPS `ttt`.
- **Block-grouping + style/flow UI** — block create/delete/rename + page-membership editing isn't surfaced (model ops exist in `src/model/tree.ts`); `style`/`flow` inspector panels are stubs. FOLLOWUPS `(b)`, `(c)`.
- **Broader visual restyle** — ED-H tokenized the chrome end-to-end (zero `slate-*` in non-test src); a deeper visual redesign beyond the alignment pass is open.

### Deferred / blocked
- 🔒 **"Open in viewer" → real Viewer-Service `preview` deployment** (OD-08 / Identity). Blocked three ways: VS rejects the `preview` preset (only `anonymous_link`/`demo`), there is no `editor_session` Identity auth, and the VS mints runtimes from the **Library** — drafts with pool `.devN` entities aren't there and the Library has no write API. Ships the no-backend standalone preview instead. FOLLOWUPS `ed-f-1`.
- 🔒 **Write forked / translated entities BACK to the shared Library** (OD-08 / Identity). The fork dialog's "Propose a new shared version" is disabled; a translation done in one questionnaire rides the bundle but is **not** auto-shared to others. Needs the Library write / contribution API. FOLLOWUPS `kk`, `u`, `ed-e2-3`.
- 🔒 **Translate placeholder/help + page/section/block + metadata titles** (schema gap). Titles use a separate `translations[locale]` map and `metadata.title`/`description` + validation `message`s are **plain strings** in Schema 2 (not language-keyed) — making them per-locale is an upstream schema/owner decision. FOLLOWUPS `vvv`, `www`, `ed-e2-1/2`.

(Many remaining FOLLOWUPS entries are deliberate "noted so it's not mistaken for a bug" transient-invalid authoring states or per-stage code-review minors — curate from [FOLLOWUPS.md](FOLLOWUPS.md) before acting; don't treat them as bugs.)

## Conventions & gotchas
- **e2e rot is real:** after adding ANY global panel/modal, re-run the **FULL** `npm run e2e` suite, not just the new spec — selector ambiguity (strict-mode) has silently broken existing specs repeatedly (FOLLOWUPS `(e2e)`). Scope selectors to their panel/modal.
- **Vercel serverless ESM:** `api/translate.ts` deploys as raw Node ESM, so its relative imports MUST carry `.js` extensions or it fails `ERR_MODULE_NOT_FOUND`.
- **`api/` is excluded** from the SPA build/typecheck; the `ai` dep is server-only.
- **Hard-pin Library refs `@vYY.MMDD`; never silently upgrade** — upgrade is always an explicit author click (`upgradeRef`). Forking is purely local (the Library is read-only from the editor).
- **`dev` is pinned to :5173** for live-Library CORS — don't change the port casually.
- Finish branches by **merging to master locally + pushing — no PRs** (owner preference).
- `git fetch` + ff/rebase before pushing — the **harvester agent shares this checkout** and pushes to `master`.

## References
- [README.md](README.md) — full ED-A..K decomposition + per-stage notes.
- [FOLLOWUPS.md](FOLLOWUPS.md) — raw deferred-items backlog (per-stage, lettered ids).
- [design/07_editor.md](../design/07_editor.md) — authoritative editor design spec.
- [editor_feedback.md](editor_feedback.md) · [editor_usecases.md](editor_usecases.md) — owner feedback + target use cases (ED-I round).
- [../HANDOFF.md](../HANDOFF.md) — system-wide / monorepo context.
