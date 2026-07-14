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

## 2. Uptime + free-tier keepalive — GitHub Actions cron + healthchecks.io

Supabase pauses a **free** project after ~7 idle days; the Library then goes down until manually
resumed. Something must periodically hit a DB-touching endpoint to both watch uptime **and** keep the
database warm.

Two models of external monitor:
- **UptimeRobot** actively *polls* your URLs (create 3 monitors, no code) — its GET to
  `/v1/questionnaires` doubles as the keepalive.
- **healthchecks.io** is a *dead-man's-switch*: it waits for your system to **ping it** and alerts if a
  ping doesn't arrive. It does NOT poll your URLs, so it can't do the keepalive by itself.

This repo uses the healthchecks model via
[`.github/workflows/uptime-keepalive.yml`](../.github/workflows/uptime-keepalive.yml): a scheduled
GitHub Actions job (every 6 h) that GETs the endpoints below **and** pings healthchecks with the
result. Portable — it survives a Vercel→Cloud Run move unchanged.

| Endpoint probed | Purpose |
|---|---|
| `https://questionnaire-library.vercel.app/v1/questionnaires?limit=1` | **keepalive** (touches the Library DB → never pauses) + uptime |
| `https://identity-service-three.vercel.app/healthz` | uptime |
| `https://viewer-service.vercel.app/healthz` | uptime |

**Setup:** create a Check on healthchecks.io (Period **6 h**, Grace **~2 h**), copy its ping URL, and add
it as the GitHub repo secret **`HC_PING_URL`** (Settings → Secrets and variables → Actions). Point the
healthchecks alert channel (email) at yourself. Trigger the workflow once manually (Actions tab → run
workflow) to confirm green.

> The identity+VS shared DB is already kept warm by the daily `/internal/forward` cron, so the keepalive
> only strictly needs to cover the **separate Library** project — but probing all three also gives uptime.

## 3. Outbox depth alert (already computed, not yet surfaced)

`GET /v1/deployments/{id}/metrics` returns an `alert` flag when the forwarding outbox is backing up past
`OUTBOX_SOFT_THRESHOLD`. Once forwarding to Behaverse is live, wire this into a check (or a small Sentry
message when it flips) so a stuck forwarder is noticed. Until forwarding is enabled there's nothing to
watch here.

## After a hosting move (Vercel → Cloud Run)

Only the URLs change. `SENTRY_DSN` and the external checks are portable as-is; re-point the uptime
checker at the new hostnames and set the same env vars on the new runtime.
