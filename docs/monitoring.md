# Monitoring, error tracking, and free-tier keepalive

Platform-agnostic on purpose — everything here is plain env vars + external HTTP checks, so it survives
a future move off Vercel (e.g. to Cloud Run) unchanged.

## 1. Error tracking (Sentry) — code is wired, dormant until you set a DSN

Each FastAPI service calls `observability.init_sentry(...)` at app startup. It is a **no-op unless
`SENTRY_DSN` is set**, so it's already merged and costs nothing until you opt in.

To turn it on:
1. Create a free Sentry project (one is fine for all three services; the `server_name` distinguishes them).
2. Set these env vars on the **identity**, **viewer-service**, and **library** projects:

   | Var | Value | Notes |
   |---|---|---|
   | `SENTRY_DSN` | `https://…@…ingest.sentry.io/…` | from the Sentry project settings |
   | `SENTRY_ENVIRONMENT` | `production` | optional; defaults to `production` |
   | `SENTRY_TRACES_SAMPLE_RATE` | `0.0` | optional; raise (e.g. `0.1`) only if you want perf tracing |

3. Redeploy. Unhandled exceptions now report to Sentry. `send_default_pii=False` is hard-set so
   participant data is never captured.

## 2. Uptime + free-tier keepalive (external checker) — you set this up

Supabase pauses a **free** project after ~7 idle days; the Library then goes down until manually
resumed. An external checker that periodically hits a DB-touching endpoint both watches uptime **and**
keeps the database warm — and, being external, needs no extra Vercel cron (Hobby caps those).

Use UptimeRobot or healthchecks.io (both free). Suggested checks:

| Check | URL | Every | Purpose |
|---|---|---|---|
| Library catalogue | `https://questionnaire-library.vercel.app/v1/questionnaires?limit=1` | 6 h | **keepalive** (touches the Library DB → never pauses) + uptime |
| Identity health | `https://identity-service-three.vercel.app/healthz` | 15 min | uptime |
| Viewer Service health | `https://viewer-service.vercel.app/healthz` | 15 min | uptime |

> The identity+VS shared DB is already kept warm by the daily `/internal/forward` cron (it connects to
> the DB every run), so the keepalive above only needs to cover the **separate Library** project. Keep
> the Library check at ≤ a few days' interval regardless.

Point the alert channel (email/Slack) at yourself so a downed service or a paused DB pages you.

## 3. Outbox depth alert (already computed, not yet surfaced)

`GET /v1/deployments/{id}/metrics` returns an `alert` flag when the forwarding outbox is backing up past
`OUTBOX_SOFT_THRESHOLD`. Once forwarding to Behaverse is live, wire this into a check (or a small Sentry
message when it flips) so a stuck forwarder is noticed. Until forwarding is enabled there's nothing to
watch here.

## After a hosting move (Vercel → Cloud Run)

Only the URLs change. `SENTRY_DSN` and the external checks are portable as-is; re-point the uptime
checker at the new hostnames and set the same env vars on the new runtime.
