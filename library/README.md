# Questionnaire Library

Read-only catalogue of questionnaires and reusable entities (Schema 2). Exposes a versioned REST API consumed by the Editor and the Library Web UI.

## Running

```bash
# from repo root
uvicorn library.api.app:create_app --factory --port 8000
```

Tests require a running Postgres (started via docker-compose or Testcontainers):

```bash
DOCKER_CONFIG=/tmp/lib_docker python -m pytest library/ -q
```

## API — read-only catalogue (public, no auth)

All catalogue read endpoints are unauthenticated. No token is required to browse, search, or download questionnaire definitions.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/v1/questionnaires` | List questionnaires (paginated) |
| GET | `/v1/questionnaires/{id}` | Questionnaire detail + metadata |
| GET | `/v1/entities` | List reusable entities |
| GET | `/v1/entities/{id}` | Entity detail |
| GET | `/v1/search` | Full-text + filter search |
| GET | `/v1/stats` | Headline catalogue counts: questionnaires, questions (prompts), options, languages |
| GET | `/v1/resolve/{id}` | Resolve a versioned entity reference |
| GET | `/healthz` | Health check |

## Community signals & authentication

Community features (comments and star ratings) require an **Identity access token** issued by the sibling `identity-service`. Read endpoints (GET comments, GET rating) are **public** — no token needed.

### Authentication

Tokens are short-lived JWT Bearer tokens obtained from the `identity-service`. Include them as:

```
Authorization: Bearer <token>
```

Any authenticated role ("participant" or higher) may post comments and submit ratings. Deleting another user's comment requires the `administrator` role. Rating and erasure operations always act on the caller's own data.

### Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `IDENTITY_JWKS_URL` | — | JWKS endpoint of the identity-service (required in production) |
| `IDENTITY_ISSUER` | — | Expected `iss` claim in tokens |
| `IDENTITY_AUDIENCE` | `questionnaire-apps` | Expected `aud` claim in tokens |

### Community endpoints

| Method | Path | Auth required | Description |
|--------|------|---------------|-------------|
| POST | `/v1/questionnaires/{qid}/comments` | any valid token | Post a comment (optionally reply to a top-level comment via `parent_id`) |
| GET | `/v1/questionnaires/{qid}/comments` | none (public) | List comments (nested, tombstoned soft-deletes) |
| DELETE | `/v1/comments/{id}` | author **or** administrator | Soft-delete a comment (tombstoned) |
| PUT | `/v1/questionnaires/{qid}/rating` | any valid token | Submit or update own rating (1–5); returns updated aggregate |
| GET | `/v1/questionnaires/{qid}/rating` | none (public; token adds `my_score`) | Get mean / count / histogram; `my_score` included if authenticated |
| DELETE | `/v1/questionnaires/{qid}/rating` | any valid token | Remove own rating |
| DELETE | `/v1/me/community-data` | any valid token | GDPR self-erasure — removes all own comments and ratings |

### Error envelope

All errors use a consistent JSON envelope:

```json
{"error": {"code": "not_found", "message": "questionnaire not found"}}
```

Codes: `unauthorized` (401), `forbidden` (403), `not_found` (404), `unprocessable` (422).
