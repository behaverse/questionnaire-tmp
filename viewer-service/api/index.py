"""Vercel serverless entrypoint: the Viewer Service FastAPI app."""
from viewer_service.api.app import create_app

app = create_app()
