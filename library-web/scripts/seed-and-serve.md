# Run the API for the e2e test

The Playwright smoke test needs the Library Core running on :8000, seeded with content,
and CORS allowing the preview origin.

```bash
source ../.venv/bin/activate
export DOCKER_CONFIG=/tmp/lib_docker
# start a Postgres (docker) and export DATABASE_URL=postgresql://…
export LIBRARY_CORS_ORIGINS=http://localhost:4173
python -m library.cli migrate
python -m library.cli import-survey-db ../survey_database/data/survey_db.sqlite --out content --release v26.0606 --imported-at 2026-06-06T00:00:00Z
python -m library.cli ingest content --release v26.0606
uvicorn library.api.app:create_app --factory --port 8000
```

Then, in `library-web/`, with `VITE_API_BASE_URL=http://localhost:8000`:
`npm run e2e`
