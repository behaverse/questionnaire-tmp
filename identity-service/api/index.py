"""Vercel serverless entrypoint: the Identity Service FastAPI app (auth + JWKS + reaper cron)."""
from identity_service.api.app import create_app

app = create_app()
