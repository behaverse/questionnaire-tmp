"""Vercel serverless entrypoint: the Library Core FastAPI read API.

Serves /v1/* + /healthz. Validation happens at ingest (local seeding), so the
served path needs no schemas — this function only reads the pre-ingested jsonb.
"""
from library.api.app import create_app

app = create_app()
