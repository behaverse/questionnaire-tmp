import httpx
import pytest
from viewer_service.library_client import fetch_resolution_bundle, LibraryError

BUNDLE = {"definition": {"metadata": {"id": "qst_x"}}, "entities": {}}


def _client(handler):
    return httpx.Client(transport=httpx.MockTransport(handler))


def test_fetch_returns_bundle():
    def handler(request):
        assert request.url.path == "/v1/questionnaires/qst_x/versions/v26.0609/resolution-bundle"
        return httpx.Response(200, json=BUNDLE)
    out = fetch_resolution_bundle("http://lib", "qst_x", "v26.0609", client=_client(handler))
    assert out == BUNDLE


def test_404_raises_library_error_404():
    def handler(request):
        return httpx.Response(404, json={"error": {"code": "not_found", "message": "nope"}})
    with pytest.raises(LibraryError) as ei:
        fetch_resolution_bundle("http://lib", "qst_x", "v26.0609", client=_client(handler))
    assert ei.value.status == 404


def test_410_raises_library_error_410():
    def handler(request):
        return httpx.Response(410, json={"error": {"code": "gone", "message": "withdrawn"}})
    with pytest.raises(LibraryError) as ei:
        fetch_resolution_bundle("http://lib", "qst_x", "v26.0609", client=_client(handler))
    assert ei.value.status == 410


def test_transport_error_raises_502():
    def handler(request):
        raise httpx.ConnectError("boom")
    with pytest.raises(LibraryError) as ei:
        fetch_resolution_bundle("http://lib", "qst_x", "v26.0609", client=_client(handler))
    assert ei.value.status == 502
