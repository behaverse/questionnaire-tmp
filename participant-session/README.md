# @behaverse/participant-session (shared)

The shared participant **auth/session** layer — the single source of truth consumed by both the
**participant-app** (portal) and the **web-viewer** (player).

- `SessionProvider` / `useSession` — persistent login (a localStorage refresh token), single-flight
  silent refresh on boot + 401, logout + SSO handoff boot exchange.
- `client` — the Identity HTTP client: `login`, `refresh`, `logout`, `fetchMe`, `register`,
  `changePassword`, `verifyEmail`, `requestPasswordReset`, `resetPassword`, `mintHandoff`,
  `exchangeHandoff`.
- `authFetch` — `makeAuthFetch(getAccess, doRefresh)`: a `fetch` that attaches the access token and
  refreshes once on 401.
- `storage` — refresh-token persistence.

## Consumption

There is **no build step** — consumers alias the package source directly:

- **vite.config**: `resolve.alias['@behaverse/participant-session'] = '../participant-session/src/index.ts'`
  (+ `resolve.dedupe: ['react','react-dom']`).
- **tsconfig**: `compilerOptions.paths['@behaverse/participant-session'] = ['../participant-session/src/index.ts']`.

`@types/react` is a dev dependency here so `tsc` can resolve React types when a consumer type-checks the
aliased source. React itself is a peer dependency (the consumer's copy is used, deduped).

Tests for this package live in **participant-app** (`src/session/*.test.*`), its primary auth consumer.
