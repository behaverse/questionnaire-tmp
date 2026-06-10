import httpx


class LibraryError(Exception):
    def __init__(self, status: int, message: str):
        self.status = status
        self.message = message
        super().__init__(f"{status}: {message}")


def fetch_resolution_bundle(base_url: str, qst_id: str, version: str, *,
                            client: httpx.Client | None = None) -> dict:
    """Fetch {definition, entities} from the Library's resolution-bundle endpoint.
    Raises LibraryError(404|410|502, ...). `client` is injectable for testing."""
    url = f"{base_url}/v1/questionnaires/{qst_id}/versions/{version}/resolution-bundle"
    owns = client is None
    client = client or httpx.Client(timeout=10.0)
    try:
        try:
            resp = client.get(url)
        except httpx.HTTPError as e:
            raise LibraryError(502, f"library unreachable: {e}")
        if resp.status_code == 404:
            raise LibraryError(404, "questionnaire not found in library")
        if resp.status_code == 410:
            raise LibraryError(410, "questionnaire withdrawn")
        if resp.status_code >= 400:
            raise LibraryError(502, f"library returned {resp.status_code}")
        return resp.json()
    finally:
        if owns:
            client.close()
