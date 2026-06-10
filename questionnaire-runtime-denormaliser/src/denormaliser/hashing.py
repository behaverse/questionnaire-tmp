import hashlib
import json


def canonical_hash(obj) -> str:
    """SHA-256 (lowercase hex) of the canonical JSON serialization of obj.

    Canonical form: sorted keys, no whitespace, non-ASCII preserved. The future
    Viewer Service imports this exact function so runtime-cache key hashes match.
    """
    canonical = json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False)
    return hashlib.sha256(canonical.encode("utf-8")).hexdigest()
