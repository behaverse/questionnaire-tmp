import os
from dataclasses import dataclass


@dataclass(frozen=True)
class Settings:
    database_url: str
    issuer: str
    access_ttl: int = 900            # seconds
    refresh_ttl: int = 2_592_000     # seconds (30 days)
    verify_token_ttl: int = 86_400   # seconds (1 day)
    reset_token_ttl: int = 3_600     # seconds (1 hour)
    handoff_ttl: int = 60            # seconds (cross-origin SSO handoff code)
    default_register_role: str = "researcher"
    cors_origins: tuple[str, ...] = ()
    web_viewer_base_url: str = "http://localhost:5173"
    smtp_host: str | None = None
    smtp_port: int = 587
    smtp_username: str | None = None
    smtp_password: str | None = None
    smtp_from: str = "no-reply@behaverse.local"
    resend_api_key: str | None = None
    cron_secret: str | None = None


def get_settings() -> Settings:
    raw = os.environ.get("IDENTITY_CORS_ORIGINS")
    origins = tuple(o.strip() for o in raw.split(",") if o.strip()) if raw is not None else ()
    return Settings(
        database_url=os.environ.get("DATABASE_URL", "postgresql://localhost/identity_service"),
        issuer=os.environ.get("IDENTITY_ISSUER", "http://localhost:8100"),
        access_ttl=int(os.environ.get("ACCESS_TOKEN_TTL", "900")),
        refresh_ttl=int(os.environ.get("REFRESH_TOKEN_TTL", "2592000")),
        verify_token_ttl=int(os.environ.get("VERIFY_TOKEN_TTL", "86400")),
        reset_token_ttl=int(os.environ.get("RESET_TOKEN_TTL", "3600")),
        handoff_ttl=int(os.environ.get("HANDOFF_TTL", "60")),
        default_register_role=os.environ.get("DEFAULT_REGISTER_ROLE", "researcher"),
        cors_origins=origins,
        web_viewer_base_url=os.environ.get("WEB_VIEWER_BASE_URL", "http://localhost:5173"),
        smtp_host=os.environ.get("SMTP_HOST") or None,
        smtp_port=int(os.environ.get("SMTP_PORT", "587")),
        smtp_username=os.environ.get("SMTP_USERNAME") or None,
        smtp_password=os.environ.get("SMTP_PASSWORD") or None,
        smtp_from=os.environ.get("SMTP_FROM", "no-reply@behaverse.local"),
        resend_api_key=os.environ.get("RESEND_API_KEY") or None,
        cron_secret=os.environ.get("CRON_SECRET") or None,
    )
