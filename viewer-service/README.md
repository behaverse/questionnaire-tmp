# questionnaire-viewer-service (VS-A: runtime generation core)

FastAPI + Postgres service that mints **cached Schema 3 runtimes** by calling the
`questionnaire-runtime-denormaliser`, reading questionnaire + entity bodies from the
**Library** over HTTP. VS-A is the runtime-generation spine; sessions, submission
forwarding (OD-13), and deployment-management UX arrive in VS-B / VS-C.

## Endpoints (`/v1`)

| Endpoint | Purpose |
|---|---|
| `POST /viewers` | Register a viewer by POSTing its Schema 7 manifest (validated + hashed). |
| `GET /viewers/{id}/{version}` | Fetch a stored manifest. |
| `POST /deployments` | Create a minimal deployment (questionnaire_ref + runtime_policy + locales). |
| `GET /deployments/{id}` | Fetch a deployment. |
| `POST /deployments/{id}/runtime` | Mint (or return cached) Schema 3 for `{viewer_id, viewer_version, locale?}`. |
| `DELETE /runtime_cache[?deployment_id=]` | Admin purge (OD-18f). |
| `GET /healthz` | Health. |

The runtime cache is keyed by the OD-18f 5-tuple `(qst_id, qst_version, locale,
viewer_conformance_hash, deployment_runtime_policy_hash)` with LRU eviction.

## Development

```bash
source ../.venv/bin/activate
pip install -e ../questionnaire-runtime-denormaliser   # denormaliser dep (editable)
pip install -e .[dev]
export DATABASE_URL=postgresql://postgres:pg@localhost:55432/viewer_service
viewer-service migrate
export LIBRARY_BASE_URL=http://localhost:8000          # a running Library
uvicorn viewer_service.api.app:create_app --factory --reload
```

Tests (testcontainers needs the Docker config override, same as `library/`):
```bash
DOCKER_CONFIG=/tmp/lib_docker pytest -q
```
