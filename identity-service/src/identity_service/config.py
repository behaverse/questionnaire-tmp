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
    default_register_role: str = "researcher"
    cors_origins: tuple[str, ...] = ()


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
        default_register_role=os.environ.get("DEFAULT_REGISTER_ROLE", "researcher"),
        cors_origins=origins,
    )
