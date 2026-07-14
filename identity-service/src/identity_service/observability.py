"""Optional error tracking. Dormant unless SENTRY_DSN is set, so it's safe to ship enabled and costs
nothing until you paste a DSN. Platform-agnostic (plain env vars) — works on Vercel or Cloud Run."""
import os

_initialized = False


def init_sentry(service_name: str) -> None:
    global _initialized
    dsn = os.environ.get("SENTRY_DSN")
    if not dsn or _initialized:
        return
    try:
        import sentry_sdk
    except ImportError:                          # SDK not installed → silently no-op
        return
    sentry_sdk.init(
        dsn=dsn,
        environment=os.environ.get("SENTRY_ENVIRONMENT", "production"),
        release=os.environ.get("SENTRY_RELEASE") or None,
        traces_sample_rate=float(os.environ.get("SENTRY_TRACES_SAMPLE_RATE", "0.0")),
        send_default_pii=False,                  # never capture participant PII
        server_name=service_name,
    )
    _initialized = True
