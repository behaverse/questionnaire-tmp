from viewer_service.locale import resolve_locale


def test_requested_locale_used_when_available():
    assert resolve_locale("pt", available=["en", "pt"], default="en") == "pt"


def test_falls_back_to_default_when_requested_unavailable():
    assert resolve_locale("fr", available=["en", "pt"], default="en") == "en"


def test_falls_back_to_default_when_none_requested():
    assert resolve_locale(None, available=["en", "pt"], default="en") == "en"
