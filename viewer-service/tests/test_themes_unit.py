import pytest
from viewer_service.themes import (
    contrast_ratio, check_accessibility, ThemeAccessibilityError, BUILTIN_THEMES)


def test_contrast_ratio_known_pairs():
    assert round(contrast_ratio("#000000", "#ffffff")) == 21
    assert contrast_ratio("#ffffff", "#ffffff") == 1.0


def test_check_passes_accessible_palette():
    check_accessibility({"primary": "#1a5fb4"}, {"base_size": 16})  # no raise


def test_check_fails_low_contrast():
    with pytest.raises(ThemeAccessibilityError) as ei:
        check_accessibility({"primary": "#dddddd"}, {"base_size": 16})   # light grey on white
    assert any("primary" in f for f in ei.value.failures)


def test_check_fails_small_font():
    with pytest.raises(ThemeAccessibilityError) as ei:
        check_accessibility({"primary": "#000000"}, {"base_size": 10})
    assert any("base_size" in f for f in ei.value.failures)


def test_builtin_themes_are_accessible():
    assert len(BUILTIN_THEMES) >= 3
    ids = {t["theme_id"] for t in BUILTIN_THEMES}
    assert {"default", "institutional_blue", "institutional_green"}.issubset(ids)
    for t in BUILTIN_THEMES:
        check_accessibility(t["palette"], t["typography"])   # no raise
