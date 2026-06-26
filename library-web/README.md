# library-web (the Library web UI)

The public, **read-only catalogue** for the Library — search → view → **export** (JSON / Markdown /
SurveyJS) — plus a **"Try it"** demo link on each questionnaire. Vite + React + TS. Deployed at
**https://questionnaire-library.vercel.app** (SPA + the Library API, same origin, reading Supabase).

## What's here

- **Catalogue** (`/`) — browse / search / facet the questionnaires in the Library.
- **Detail** (`/q/:id/:version`) — metadata, items, scores, versions, a **Download ▾** menu
  (JSON / Markdown / SurveyJS), and **Try it**.
- **Export** (`src/export/`) — one-way downloads, rendered in the language currently selected on the
  page (`DownloadMenu.tsx` is the accessible dropdown in the detail header):
  - **JSON** — the canonical Schema-2 definition (cross-origin blob fetch via `src/lib/download.ts`).
  - **Markdown** (`src/export/markdown.ts`) — a human-readable review doc: title, a metadata header
    (id / version / license / authors / citation), then numbered questions with their answer options.
  - **SurveyJS** (`src/export/surveyjs.ts`) — a [SurveyJS](https://surveyjs.io/) survey-JSON: widget
    mapping (radiogroup / rating / checkbox / text), choices, `isRequired`, and a best-effort simple
    `show_if` → `visibleIf`. Features it can't represent (scoring, complex conditions) are dropped and
    listed in an inline notice on the page. Emits a plain object — **no `survey-core` dependency**.
  - Both serializers consume the same per-language `RenderModel` (`src/definition/renderModel.ts`,
    enriched to derive each item's `widget` and carry `showIf`), so reference resolution lives in one place.
- **Try it** (roadmap #5) — launches the **player** (`web-viewer`) in render-only preview
  (`?preview=<id@version>`): runs the questionnaire with **no account and nothing stored**, and returns
  here on Done. Built from `src/lib/preview.ts::previewPlayerUrl` using the questionnaire's own default
  language, so it never hits an unsupported-locale error.

## Develop

```bash
npm install
VITE_API_BASE_URL=http://localhost:8000 npm run dev -- --port 5175   # the Library API on :8000
```

| Var | Default | Purpose |
|---|---|---|
| `VITE_API_BASE_URL` | `''` (same-origin, prod) | the Library API base (local dev → `http://localhost:8000`) |
| `VITE_PLAYER_BASE_URL` | `http://localhost:5173` | where **Try it** launches the player |
| `VITE_VS_BASE_URL` | `http://localhost:8001` | the Viewer Service (the player fetches the preview runtime here) |

> **CORS:** the Library API's `LIBRARY_CORS_ORIGINS` **must include this app's origin** (e.g.
> `http://localhost:5175`) — its default is only `:5173`, so on any other port the catalogue silently
> fails with *"Could not load questionnaires."* See [`docs/operational-gotchas.md`](../docs/operational-gotchas.md).

```bash
npm test
npm run build
```

## Deploy / public Try-it (status)

✅ **Live.** The deployed Library hosts **222 questionnaires** and **Try-it works in production**:
this app's Vercel build sets `VITE_PLAYER_BASE_URL=https://player-sooty-six.vercel.app` and
`VITE_VS_BASE_URL=https://viewer-service.vercel.app`, and the VS CORS allows this origin. Clicking
**Try it** opens the player and renders the questionnaire (browser-verified 2026-06-25).

> ⚠ The player is **`player-sooty-six.vercel.app`** — *not* `web-viewer.vercel.app`, which is an
> unrelated squatted alias ("Vespucci"). See [`../DEPLOYMENT.md`](../DEPLOYMENT.md) "Live URLs".
