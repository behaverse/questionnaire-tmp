# library-web (the Library web UI)

The public, **read-only catalogue** for the Library — search → view → download — plus a **"Try it"**
demo link on each questionnaire. Vite + React + TS. Deployed at
**https://questionnaire-library.vercel.app** (SPA + the Library API, same origin, reading Supabase).

## What's here

- **Catalogue** (`/`) — browse / search / facet the questionnaires in the Library.
- **Detail** (`/q/:id/:version`) — metadata, items, scores, versions, **Download JSON**, and **Try it**.
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

The deployed Library currently has **212 questionnaires** but **no live Try-it** — the demo works only
locally. Making Try-it public is a deployment slice: stand up the **Viewer Service** + the **player**
(web-viewer) publicly (pointing at the same Supabase), then set `VITE_PLAYER_BASE_URL` /
`VITE_VS_BASE_URL` on this app's build to those origins and add this app's origin to the VS CORS. No
content re-import is needed — the catalogue already lives on Supabase.
