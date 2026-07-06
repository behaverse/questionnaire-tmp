import hmac
import json
import time

from .invites import _b64u, _b64u_decode, _sign


def mint_replay(secret: str, *, deployment_id: str, session_id: str, ttl: int, now: float | None = None) -> str:
    iat = time.time() if now is None else now
    payload = {"deployment_id": deployment_id, "session_id": session_id, "iat": iat, "exp": iat + ttl}
    payload_b64 = _b64u(json.dumps(payload, separators=(",", ":"), sort_keys=True).encode())
    return f"{payload_b64}.{_sign(secret, payload_b64)}"


def verify_replay(secret: str, token: str | None, now: int | None = None) -> dict | None:
    """Return {deployment_id, session_id, iat, exp} iff the HMAC + exp check out, else None.
    Never raises. Fails closed on an empty secret."""
    if not secret or not token or "." not in token:
        return None
    payload_b64, _, sig = token.partition(".")
    try:
        if not hmac.compare_digest(sig, _sign(secret, payload_b64)):
            return None
        payload = json.loads(_b64u_decode(payload_b64))
    except Exception:
        return None
    t = int(time.time()) if now is None else now
    if not isinstance(payload, dict) or not payload.get("deployment_id") or not payload.get("session_id"):
        return None
    if not isinstance(payload.get("exp"), (int, float)) or payload["exp"] <= t:
        return None
    return payload
