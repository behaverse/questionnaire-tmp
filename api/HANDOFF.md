# Deployment API entry (`api/`) — Handoff

**Path:** `api/` · **Stack:** Python (Vercel serverless function) · **Status:** ✅ live · **Suggested branch:** `work/deploy-api`

> Thin Vercel serverless entrypoint that serves the **Library Core** read API (`/v1/*` + `/healthz`)
> for the deployed public catalogue at https://questionnaire-library.vercel.app. It is *not* an
> independent component — it just imports and runs `library/`. Real work lives in
> [../library/HANDOFF.md](../library/HANDOFF.md) and [../DEPLOYMENT.md](../DEPLOYMENT.md).

## What it is
- [api/index.py](index.py) is the whole thing: `from library.api.app import create_app; app = create_app()`.
- Routing is configured by the **root** [../vercel.json](../vercel.json): `/v1/:path*` and `/healthz`
  rewrite to `/api/index`; everything else falls through to the `library-web/` SPA (`/index.html`).
  `framework: null`, `buildCommand` builds `library-web`, `outputDirectory` = `library-web/dist`.
- The served path only **reads** pre-ingested `jsonb` from Supabase Postgres — validation happens at
  ingest (local seeding), so this function ships no schemas.

## Run & test
There is nothing to run/test in isolation — it is exercised via `library/` (see that HANDOFF) and via the
live deployment. To verify the live wiring: `curl https://questionnaire-library.vercel.app/healthz` and
`.../v1/questionnaires?limit=1`.

## What's left to do
**Deferred / blocked**
- **Region mismatch.** The function runs in `iad1` (US) while Supabase is `eu-central-1` — consider
  pinning to `fra1` to cut latency. (Tracked from the Library side too.)
- **Repo split.** At the deferred multi-repo split this entry moves next to `questionnaire-library-service`;
  don't restructure it before then. 🔒 needs cross-repo schema packaging.
- Otherwise this stays a one-liner: changes to the served API belong in `library/`, not here.

## Conventions & gotchas
- The live Library **auto-deploys from `master`** — a push that breaks `library/`'s import chain breaks
  this function. Root `requirements.txt` must list `questionnaire-identity-service @ ./identity-service`
  (the Library imports `identity_service` on boot).
- Finish branches by **merging to master locally + pushing — no PRs**; `git fetch` + ff/rebase first.

## References
- [../library/HANDOFF.md](../library/HANDOFF.md) · [../DEPLOYMENT.md](../DEPLOYMENT.md) · [../vercel.json](../vercel.json) · root [../HANDOFF.md](../HANDOFF.md)
