# Operational gotchas (read before running / demoing the stack)

Recurring traps that have bitten this project. Each cost real debugging or produced a wrong "it
works." Check this list before claiming something works or before re-doing data work.

## 1. Every browser app on a new port needs the backend CORS allow-lists updated

The frontends run on different origins and call the backend APIs cross-origin. Each backend has a
**default CORS allow-list that only includes one origin** — start a frontend on any other port and the
browser silently blocks its fetches; the UI shows a generic error (e.g. **"Could not load
questionnaires"**) with no obvious cause.

Which frontend calls which backend, and the env var that must include the frontend's origin:

| Frontend (origin) | Calls | Must be in |
|---|---|---|
| **library-web** (`:5175`) | Library API (`:8000`) | `LIBRARY_CORS_ORIGINS` (default only `:5173`) |
| **participant-app** portal (`:5174`) | Identity (`:8100`), VS (`:8001`) | `IDENTITY_CORS_ORIGINS`, `VS_CORS_ORIGINS` |
| **web-viewer** player (`:5173`) | Identity (`:8100`), VS (`:8001`) | `IDENTITY_CORS_ORIGINS`, `VS_CORS_ORIGINS` |
| **editor** | Library (`:8000`), VS (`:8001`) | `LIBRARY_CORS_ORIGINS`, `VS_CORS_ORIGINS` |

Rule of thumb when bringing up the local stack: set **all three** CORS vars to the full set of
frontend origins you'll run, e.g. `…=http://localhost:5173,http://localhost:5174,http://localhost:5175`.
A missing CORS origin is the #1 cause of a frontend that "won't load." This has bitten the project on
the VS, Identity, **and** Library services separately.

## 2. "Test before telling me it works" — test the request the *browser* makes

`curl http://localhost:8000/v1/x` succeeding proves the **API** works, NOT that the **page** works. A
CORS failure only shows up when the request carries an `Origin` header from the app's origin. To
actually verify a browser app:

```bash
# the request the page makes — include the Origin header and check the CORS header comes back
curl -s -D - -o /dev/null -H "Origin: http://localhost:5175" \
  "http://localhost:8000/v1/questionnaires?limit=20" | grep -i access-control-allow-origin
```

Verify **every** endpoint the page loads on mount (often a list call + a facets/config call), each
with the `Origin` header. Better still, drive the real page (Playwright) — but Chrome must be installed
(`npx playwright install chrome`). Do not report "it works" from an API-only check.

## 3. Don't re-import content — the canonical catalogue already exists on Supabase

The real questionnaire catalogue is **live on the deployed app** (`questionnaire-library.vercel.app`,
backed by Supabase): **222 questionnaires** = the 64 from the `survey_database` import **plus 158 from
the `questionnaire-harvester`** (normalized to `v26.0618`, ingested into Supabase). The harvester keeps
adding to it.

The **local dev Library is a *separate*, usually near-empty Postgres** — re-running
`library import-survey-db` to fill it is a redundant workaround that produces a *parallel* copy at a
different release version, which then diverges from production and confuses everything. Before
seeding/importing locally, ask:

- Is this content already live on Supabase? (almost always yes — check the deployed `/v1/questionnaires`)
- For a **public demo**, the deployed app is the source of truth — the VS `preview` endpoint, the hosted
  player, and the Try-it link are all live; use them rather than re-importing locally.
- Only seed locally for a genuinely isolated local test, and prefer ingesting the harvester's
  already-normalized content (same as prod) over a fresh `import-survey-db` at a throwaway version.

## 4. After merging a backend change, the *running* service is still the old code

Dev servers are long-lived. The Vite frontends HMR the working tree, but the **Python services
(Identity/Library/VS) do NOT** — a merged backend change isn't live until you **restart that service**
(and, if it added a table/column, **re-run its `migrate`**). Symptom: a freshly-merged endpoint returns
404, or new env (CORS, a TTL) has no effect. Restart the service after merging anything that touches it.

## 5. `git add -A` is repo-wide regardless of `cwd`

Running `git add -A` (even from inside a package dir) stages the **whole repo**, including untracked
scratch (`archive*/`, `my_comments.md`, build output, the harvester's `seed-supabase.md`) and any
`node_modules`/`dist` not yet ignored. **Stage explicit paths** for commits in this repo (there's a lot
of untracked scratch). Always `git diff --cached
--name-only | grep -iE "node_modules|/dist/|archive|seed-supabase"` before committing.
