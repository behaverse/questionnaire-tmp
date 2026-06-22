import os
from dataclasses import dataclass
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]

@dataclass(frozen=True)
class Settings:
    database_url: str
    content_dir: Path
    schemas_dir: Path
    api_prefix: str = "/v1"
    cors_origins: tuple[str, ...] = ("http://localhost:5173",)
    identity_jwks_url: str = "http://localhost:8100/.well-known/jwks.json"
    identity_issuer: str = "http://localhost:8100"
    identity_audience: str = "questionnaire-apps"

def get_settings() -> Settings:
    raw = os.environ.get("LIBRARY_CORS_ORIGINS")
    origins = tuple(o.strip() for o in raw.split(",") if o.strip()) if raw is not None else ("http://localhost:5173",)
    return Settings(
        database_url=os.environ.get("DATABASE_URL", "postgresql://localhost/library"),
        content_dir=Path(os.environ.get("CONTENT_DIR") or REPO_ROOT / "schemas/questionnaire/examples/library_examples"),
        schemas_dir=Path(os.environ.get("SCHEMAS_DIR") or REPO_ROOT / "schemas"),
        api_prefix=os.environ.get("API_PREFIX", "/v1"),
        cors_origins=origins,
        identity_jwks_url=os.environ.get("IDENTITY_JWKS_URL", "http://localhost:8100/.well-known/jwks.json"),
        identity_issuer=os.environ.get("IDENTITY_ISSUER", "http://localhost:8100"),
        identity_audience=os.environ.get("IDENTITY_AUDIENCE", "questionnaire-apps"),
    )
