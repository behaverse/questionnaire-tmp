import hashlib
import secrets


def mint_token() -> str:
    """A high-entropy, URL-safe opaque session token (returned to the viewer once)."""
    return secrets.token_urlsafe(32)


def hash_token(token: str) -> str:
    """SHA-256 hex of a token. Only the hash is stored in the session row."""
    return hashlib.sha256(token.encode("utf-8")).hexdigest()
