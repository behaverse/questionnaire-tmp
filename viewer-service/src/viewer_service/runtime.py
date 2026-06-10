from datetime import datetime, timezone

from denormaliser import RuntimePolicy, canonical_hash, denormalise

from .config import get_settings
from .library_client import fetch_resolution_bundle
from .locale import resolve_locale
from .store import runtime_cache as cache


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def mint_runtime(conn, deployment: dict, viewer: dict, requested_locale: str | None) -> dict:
    """The core flow: resolve locale → 5-tuple cache key → hit returns; miss fetches the
    Library bundle, denormalises, caches, returns. Raises denormaliser.PreflightError on a
    bad (questionnaire × viewer × policy) combination, or library_client.LibraryError."""
    settings = get_settings()
    qst_id, _, qst_version = deployment["questionnaire_ref"].partition("@")
    locale = resolve_locale(requested_locale, available=deployment["available_locales"],
                            default=deployment["default_locale"])
    policy_dict = deployment["runtime_policy"]
    policy_hash = canonical_hash(policy_dict)
    viewer_hash = viewer["manifest_hash"]
    key = (qst_id, qst_version, locale, viewer_hash, policy_hash)

    cached = cache.get(conn, *key)
    if cached is not None:
        return cached

    bundle = fetch_resolution_bundle(settings.library_base_url, qst_id, qst_version)
    runtime = denormalise(
        bundle["definition"],
        locale=locale,
        runtime_policy=RuntimePolicy(**policy_dict),
        viewer_manifest=viewer["manifest"],
        resolve_entity=bundle["entities"].get,
        generated_at=_now_iso(),
        denormaliser_version=settings.denormaliser_version,
        schemas_dir=settings.schemas_dir,
    )
    prov = runtime["provenance"]
    assert prov["viewer_conformance_hash"] == viewer_hash, "viewer hash mismatch (bug)"
    assert prov["deployment_runtime_policy_hash"] == policy_hash, "policy hash mismatch (bug)"
    cache.put(conn, key, runtime, deployment["deployment_id"], cap=settings.runtime_cache_cap)
    return runtime
