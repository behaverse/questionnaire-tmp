import os
from dataclasses import dataclass, field
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]


@dataclass(frozen=True)
class Settings:
    database_url: str
    library_base_url: str
    schemas_dir: Path
    runtime_cache_cap: int = 10000
    denormaliser_version: str = "v26.0610"
    behaverse_base_url: str = "http://localhost:9000"
    behaverse_bearer_token: str = ""
    outbox_soft_threshold: int = 10_000
    outbox_hard_threshold: int = 1_000_000
    forward_max_attempts: int = 8
    forward_batch_size: int = 50
    cors_origins: tuple[str, ...] = ()
    identity_jwks_url: str = "http://localhost:8100/.well-known/jwks.json"
    identity_issuer: str = "http://localhost:8100"
    identity_audience: str = "questionnaire-apps"
    invite_signing_secret: str = ""
    invite_default_ttl_seconds: int = 2_592_000
    web_viewer_base_url: str = ""
    replay_link_ttl_seconds: int = 604_800
    replay_signing_secret: str = ""
    scorer_dir: Path = REPO_ROOT / "questionnaire-scorer" / "dist-wasm"
    public_base_url: str = ""
    cron_secret: str | None = None
    scorer_map: dict[str, str] = field(default_factory=dict)


def forwarding_enabled(settings: "Settings") -> bool:
    """Forwarding is OFF unless a real (non-localhost) Behaverse sink URL is configured."""
    from urllib.parse import urlparse
    url = (settings.behaverse_base_url or "").strip()
    if not url:
        return False
    host = (urlparse(url).hostname or "").lower()
    return host not in ("", "localhost", "127.0.0.1", "::1")


def get_settings() -> Settings:
    raw = os.environ.get("VS_CORS_ORIGINS")
    origins = tuple(o.strip() for o in raw.split(",") if o.strip()) if raw is not None else ()
    import json
    raw_map = os.environ.get("VS_SCORER_MAP")
    scorer_map = json.loads(raw_map) if raw_map else {}
    return Settings(
        database_url=os.environ.get("DATABASE_URL", "postgresql://localhost/viewer_service"),
        library_base_url=os.environ.get("LIBRARY_BASE_URL", "http://localhost:8000"),
        schemas_dir=Path(os.environ.get("SCHEMAS_DIR") or REPO_ROOT / "schemas"),
        runtime_cache_cap=int(os.environ.get("RUNTIME_CACHE_CAP", "10000")),
        denormaliser_version=os.environ.get("DENORMALISER_VERSION", "v26.0610"),
        behaverse_base_url=os.environ.get("BEHAVERSE_BASE_URL", "http://localhost:9000"),
        behaverse_bearer_token=os.environ.get("BEHAVERSE_BEARER_TOKEN", ""),
        outbox_soft_threshold=int(os.environ.get("OUTBOX_SOFT_THRESHOLD", "10000")),
        outbox_hard_threshold=int(os.environ.get("OUTBOX_HARD_THRESHOLD", "1000000")),
        forward_max_attempts=int(os.environ.get("FORWARD_MAX_ATTEMPTS", "8")),
        forward_batch_size=int(os.environ.get("FORWARD_BATCH_SIZE", "50")),
        cors_origins=origins,
        identity_jwks_url=os.environ.get("IDENTITY_JWKS_URL", "http://localhost:8100/.well-known/jwks.json"),
        identity_issuer=os.environ.get("IDENTITY_ISSUER", "http://localhost:8100"),
        identity_audience=os.environ.get("IDENTITY_AUDIENCE", "questionnaire-apps"),
        invite_signing_secret=os.environ.get("INVITE_SIGNING_SECRET", ""),
        invite_default_ttl_seconds=int(os.environ.get("INVITE_DEFAULT_TTL_SECONDS", "2592000")),
        web_viewer_base_url=os.environ.get("WEB_VIEWER_BASE_URL", ""),
        replay_link_ttl_seconds=int(os.environ.get("REPLAY_LINK_TTL_SECONDS", "604800")),
        replay_signing_secret=os.environ.get("REPLAY_SIGNING_SECRET", ""),
        scorer_dir=Path(os.environ.get("VS_SCORER_DIR") or REPO_ROOT / "questionnaire-scorer" / "dist-wasm"),
        public_base_url=os.environ.get("VS_PUBLIC_BASE", ""),
        cron_secret=os.environ.get("CRON_SECRET") or None,
        scorer_map=scorer_map,
    )
