# Follow-ups — questionnaire-viewer-service (VS-A)

- **Auth (Identity).** All VS-A endpoints — including `DELETE /runtime_cache` — are
  unauthenticated. Gate them once the Identity sibling lands (OD-08); admin purge and
  deployment CRUD are researcher-only operations.
- **URL-fetch manifest ingestion (OD-18c).** VS-A ingests manifests by direct POST.
  Add the fetch-from-published-URL variant when the Web Viewer ships a real manifest URL.
- **Full locale precedence.** VS-A resolves locale from deployment config only. The full
  OD chain (URL param → platform profile → deployment default → Accept-Language →
  questionnaire canonical) needs request/session context — VS-B.
- **Cache LRU under concurrency.** Eviction is a best-effort `DELETE ... OFFSET cap` per
  put; under heavy concurrent misses it can momentarily exceed the cap. Fine for MVP;
  revisit with an advisory lock or a background sweeper if it matters.
- **Library client resilience.** No retry/backoff on transient Library 5xx yet (just a
  502 passthrough). Add retry when this path goes to production load.

## VS-B follow-ups

- **`validated` state + Behaverse reconciliation.** VS-B stops at `forwarded` (sink 2xx).
  `validated` needs Behaverse validation feedback (callback or reconciliation poll) — VS-C/later.
- **`abandoned` on timeout.** No session-timeout sweeper yet; in_progress sessions live forever.
- **Outbox retention.** Forwarded/failed rows are kept indefinitely (available for VS-C export).
  Add a pruning policy (e.g. drop forwarded rows older than N days) before production.
- **Soft-threshold alerting.** The hard cap (503) is enforced; the soft threshold is config but
  only logged — the alert banner / dashboard surface is VS-C.
- **Forwarder concurrency.** A single `forward-worker` is assumed; `FOR UPDATE SKIP LOCKED` makes
  multiple workers safe, but that hasn't been load-tested.
- **mTLS / E2E encryption.** Deferred per OD-13 (TLS + SHA-256 + bearer ship now).

## VS-C follow-ups

- **Ephemeral session TTL purge.** Demo sessions skip the outbox + refuse resume, but their
  `session` rows are not yet purged; add an age-based sweeper before production.
- **Per-condition quota.** Only a per-deployment `max_sessions` cap exists; per-condition caps
  need Participant-Platform condition assignment (Phase 5).
- **Non-`none`-auth presets.** access_code / platform_study / embedded / kiosk / preview are
  rejected at create until Identity/Platform/host integration lands (OD-08).
- **Full deployment update.** Only `active_until` + `quota` are mutable via PATCH; broader edits
  would need careful in-flight-session semantics.
- **Style/flow override application.** Overrides are stored + validated, but applying them to the
  runtime (resolving instrument vs deployment values per R18) is a Web Viewer / runtime concern.
