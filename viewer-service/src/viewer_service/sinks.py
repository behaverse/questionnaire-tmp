import httpx
from denormaliser import canonical_hash


class SinkError(Exception):
    """A forwarding attempt failed (non-2xx or transport error)."""


class HTTPBehaverseSink:
    """Forwards a payload to Behaverse via HTTPS POST {base_url}/{kind} with a bearer
    token and a per-submission SHA-256 header (OD-13 tamper detection)."""

    def __init__(self, base_url: str, bearer_token: str, *, client: httpx.Client | None = None):
        self.base_url = base_url.rstrip("/")
        self.bearer = bearer_token
        self.client = client or httpx.Client(timeout=10.0)

    def send(self, kind: str, payload: dict) -> None:
        headers = {"Authorization": f"Bearer {self.bearer}",
                   "X-Payload-SHA256": canonical_hash(payload)}
        try:
            resp = self.client.post(f"{self.base_url}/{kind}", json=payload, headers=headers)
        except httpx.HTTPError as e:
            raise SinkError(f"transport error: {e}")
        if resp.status_code >= 300:
            raise SinkError(f"behaverse returned {resp.status_code}")
