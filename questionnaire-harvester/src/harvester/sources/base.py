import httpx
from harvester.raw import RawQuestionnaire


class SourceAdapter:
    site = "unknown"

    def fetch(self, url: str) -> str:
        return httpx.get(url, follow_redirects=True, timeout=30).text

    def parse(self, html: str, url: str) -> RawQuestionnaire:
        raise NotImplementedError
