# library-web — Handoff

**Path:** `library-web/` · **Stack:** Vite + React 19 + TS + Tailwind + TanStack Query · **Status:** ✅ built + deployed ([questionnaire-library.vercel.app](https://questionnaire-library.vercel.app)) · **Suggested branch:** `work/library-web`

> The public, **read-only catalogue** SPA for the Library: search → view metadata + items → **export** (canonical Schema-2 JSON, Markdown, or SurveyJS), plus a **"Try it"** demo that launches the live player render-only. SPA + the Library API are served same-origin on Vercel, reading Supabase.
> For deep detail see [README.md](README.md). There is **no FOLLOWUPS.md** for this component — remaining work is surfaced directly below.

## What it is
- **Catalogue** (`/`, `src/routes/CataloguePage.tsx`) — search / facet / sort. **Instrument-family grouping (OD-21)** collapses variants into expandable rows (`src/catalogue/CatalogueGroup.tsx`); collapsible facet sidebar (`src/catalogue/FacetSidebar.tsx`); homepage **stats bar** from `GET /v1/stats` (`src/api/queries.ts::useStats`).
- **Detail** (`/q/:id/:version`, `src/routes/DetailPage.tsx`) — metadata, items, scores, version list, a **Download ▾** menu (JSON / Markdown / SurveyJS), and **Try it**.
- **Export** (`src/export/`) — one-way downloads in the page's current language, via the accessible **`DownloadMenu.tsx`** dropdown in the detail header (`aria-haspopup`/`expanded`, `role=menu`/`menuitem`, closes on select / Escape / outside-click):
  - **JSON** — canonical Schema-2 (cross-origin blob fetch, `src/lib/download.ts`).
  - **Markdown** (`src/export/markdown.ts`) — title + metadata header + numbered questions with options.
  - **SurveyJS** (`src/export/surveyjs.ts`) — plain SurveyJS survey-JSON (no `survey-core` dep); widget map + simple `show_if`→`visibleIf`; scoring / complex logic / unmapped widgets go to a `dropped[]` list shown in an inline `role="status"` notice on the page.
  - Both serializers consume the per-language `RenderModel` (now enriched with derived `widget` + carried `showIf`); `src/export/index.ts` holds the browser wrappers.
- **Try it** (`src/lib/preview.ts::previewPlayerUrl`) — builds `<player>/?preview=<id@version>` against the questionnaire's own default language (avoids unsupported-locale 500); the player then fetches the render-only runtime from VS `GET /v1/preview/runtime`. No account, nothing stored.
- All API access goes through `src/api/client.ts` (base = `VITE_API_BASE_URL`, empty = same-origin in prod) + `src/api/queries.ts` (TanStack Query). Render projection in `src/definition/renderModel.ts` (also the single source of truth for export reference-resolution + widget derivation).
- Read-only: this app never writes. Comments/ratings (ID-C1) and Editor live in other components.

## Run & test
```bash
cd library-web
npm install
VITE_API_BASE_URL=http://localhost:8000 npm run dev -- --port 5175   # Library API on :8000
```
- **Use port 5175** (per README + root docs). Vite's config pins no port, so plain `npm run dev` lands on 5173 — but the Library API's `LIBRARY_CORS_ORIGINS` defaults to only `http://localhost:5173`; run the API with `LIBRARY_CORS_ORIGINS=http://localhost:5175` (or whatever port you use) or the catalogue silently shows *"Could not load questionnaires."* See [docs/operational-gotchas.md](../docs/operational-gotchas.md).
- **Try it locally** also needs the player (`web-viewer`, default `:5173`) and Viewer Service (`:8001`) up; override via `VITE_PLAYER_BASE_URL` / `VITE_VS_BASE_URL`.
- Tests: `npm test` (vitest + RTL; broad coverage across `api/`, `catalogue/`, `detail/`, `lib/`, `definition/`, `export/` — 84 tests). Build: `npm run build` (`tsc -b` + **`tsc -p tsconfig.test.json`** + `vite build`). ⚠ Only the build's `tsc -p tsconfig.test.json` typechecks **test** files — `npm test` and `tsc -b` do not, so always run `npm run build` to catch test-fixture type errors before merging.
- `npm run e2e` is a Playwright smoke (`tests/e2e/`, builds + previews on :4173) — **needs Chrome installed**, not present in this env.

## What's left to do
This component is **largely complete**. Open items are small or cross-cutting.

**Done (recent)**
- ✅ **Public Try-it live (2026-06-25)** — Vercel build sets `VITE_PLAYER_BASE_URL=https://player-sooty-six.vercel.app` + `VITE_VS_BASE_URL=https://viewer-service.vercel.app`; VS CORS allows this origin; browser-verified. ⚠ The player is **`player-sooty-six.vercel.app`**, *not* `web-viewer.vercel.app` (a squatted unrelated alias).
- ✅ **Markdown + SurveyJS export (2026-06-26, merged a8024de9)** — detail-page exports; see **Export** above. Browser-verified on prod.
- ✅ **Download ▾ dropdown (2026-06-26, merged f92edf11)** — the three download buttons collapsed into one accessible `DownloadMenu`; also nudges the a11y work below forward.

**Next**
- **Visual / UX & accessibility polish** — still genuinely open: facet sidebar, grouped rows, and stats bar have no a11y audit (keyboard nav, ARIA on expand/collapse, focus management). The new `DownloadMenu` is already accessible; use it as the pattern. Curate against the live site before investing.

**Deferred / blocked**
- **Domain / Population / Instrument facets only cover classified content** 🔒 — those facet values come from the `survey_db` classification; **harvested** questionnaires are invisible to those filters until classification is populated. This is **not a library-web bug** — fix belongs in [`questionnaire-harvester/`](../questionnaire-harvester/) (classification task). library-web will surface the values automatically once the API returns them.
- **e2e Playwright smoke in CI** 🔒 (external) — needs Chrome installed on the runner to execute.

## Conventions & gotchas
- **Read-only app** — never add write paths here; writes belong to Identity-gated components.
- **CORS is the #1 dev trap** — test the *browser* request, not the API directly; per-origin allow-list (see memory / operational-gotchas).
- **Locale-safe Try-it** — always derive the preview locale from the questionnaire's default language (already done in `preview.ts`); don't hardcode `en`.
- **No content re-import** — canonical content is live on Supabase (222 Qs); never re-run the importer to "refresh" this UI.
- Finish branches by **merging to master locally + pushing — no PRs** (owner preference).
- `git fetch` + ff/rebase before pushing — the **harvester agent shares this checkout** and pushes master.

## References
- [README.md](README.md) — full component docs (env table, develop/deploy).
- [docs/operational-gotchas.md](../docs/operational-gotchas.md) — CORS / per-origin traps.
- [HANDOFF.md](../HANDOFF.md) — system-wide context.
- Related components: [`web-viewer/`](../web-viewer/) (the player Try-it launches), [`viewer-service/`](../viewer-service/) (preview runtime), [`library/`](../library/) (the API + `/v1/stats`), [`questionnaire-harvester/`](../questionnaire-harvester/) (classification that unlocks facets).
