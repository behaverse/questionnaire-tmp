import base64
import hashlib
import hmac
import json
import time


def _b64u(b: bytes) -> str:
    return base64.urlsafe_b64encode(b).decode().rstrip("=")


def _b64u_decode(s: str) -> bytes:
    return base64.urlsafe_b64decode(s + "=" * (-len(s) % 4))


def _sign(secret: str, payload_b64: str) -> str:
    mac = hmac.new(secret.encode(), payload_b64.encode(), hashlib.sha256).digest()
    return _b64u(mac)


def mint_invite(secret: str, *, participant_id: str, deployment_id: str, ttl: int,
                now: int | None = None) -> str:
    iat = int(time.time()) if now is None else now
    payload = {"participant_id": participant_id, "deployment_id": deployment_id, "exp": iat + ttl}
    payload_b64 = _b64u(json.dumps(payload, separators=(",", ":"), sort_keys=True).encode())
    return f"{payload_b64}.{_sign(secret, payload_b64)}"


def verify_invite(secret: str, token: str | None, *, deployment_id: str,
                  now: int | None = None) -> dict | None:
    """Return the payload iff the HMAC, exp, and deployment_id all check out, else None.
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
    if not isinstance(payload, dict) or payload.get("deployment_id") != deployment_id:
        return None
    if not isinstance(payload.get("exp"), int) or payload["exp"] <= t:
        return None
    if not payload.get("participant_id"):
        return None
    return payload
