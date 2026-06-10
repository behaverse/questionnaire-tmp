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
