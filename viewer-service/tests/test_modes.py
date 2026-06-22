import pytest
from viewer_service.modes import resolve_preset, UnsupportedPreset, SUPPORTED


def test_anonymous_link_dimensions():
    assert resolve_preset("anonymous_link") == {
        "auth": "none", "persistence": "persisted", "lifecycle": "standard",
        "rendering_context": "standalone"}


def test_demo_dimensions_are_ephemeral():
    assert resolve_preset("demo")["persistence"] == "ephemeral"


def test_supported_set():
    assert SUPPORTED == {"anonymous_link", "demo", "authenticated"}


def test_unsupported_preset_raises():
    for p in ("access_code", "platform_study", "embedded", "kiosk", "preview", "bogus"):
        with pytest.raises(UnsupportedPreset):
            resolve_preset(p)
