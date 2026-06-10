import httpx
import pytest
from viewer_service.sinks import HTTPBehaverseSink, SinkError


def _sink(handler, token="tok"):
    return HTTPBehaverseSink("http://bh", token, client=httpx.Client(transport=httpx.MockTransport(handler)))


def test_send_posts_with_headers_and_path():
    seen = {}

    def handler(request):
        seen["path"] = request.url.path
        seen["auth"] = request.headers.get("authorization")
        seen["sha"] = request.headers.get("x-payload-sha256")
        return httpx.Response(200, json={"ok": True})

    _sink(handler).send("responses", {"session_id": "s1", "responses": []})
    assert seen["path"] == "/responses"
    assert seen["auth"] == "Bearer tok"
    assert len(seen["sha"]) == 64


def test_non_2xx_raises_sink_error():
    def handler(request):
        return httpx.Response(500, text="boom")
    with pytest.raises(SinkError):
        _sink(handler).send("events", {"a": 1})


def test_transport_error_raises_sink_error():
    def handler(request):
        raise httpx.ConnectError("down")
    with pytest.raises(SinkError):
        _sink(handler).send("responses", {"a": 1})
