class ThemeAccessibilityError(Exception):
    """Raised when a theme fails the WCAG-AA contrast / min-font check."""

    def __init__(self, failures: list[str]):
        self.failures = failures
        super().__init__("; ".join(failures))


_TEXT_KEYS = ("primary", "secondary", "success", "warning", "error")
_MIN_CONTRAST = 4.5
_MIN_BASE_SIZE = 14


def _srgb_to_linear(c: float) -> float:
    return c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4


def _luminance(hex_color: str) -> float:
    h = hex_color.lstrip("#")
    r, g, b = (int(h[i:i + 2], 16) / 255 for i in (0, 2, 4))
    rl, gl, bl = (_srgb_to_linear(x) for x in (r, g, b))
    return 0.2126 * rl + 0.7152 * gl + 0.0722 * bl


def contrast_ratio(hex_fg: str, hex_bg: str) -> float:
    """WCAG 2.1 contrast ratio (1..21) of two #rrggbb colours."""
    l1, l2 = _luminance(hex_fg), _luminance(hex_bg)
    lighter, darker = max(l1, l2), min(l1, l2)
    return (lighter + 0.05) / (darker + 0.05)


def check_accessibility(palette: dict, typography: dict) -> None:
    """WCAG-AA gate: each present text colour >= 4.5:1 vs background (default white);
    typography.base_size >= 14. Raises ThemeAccessibilityError listing every failure."""
    bg = palette.get("background", "#ffffff")
    failures: list[str] = []
    for key in _TEXT_KEYS:
        color = palette.get(key)
        if color is not None:
            ratio = contrast_ratio(color, bg)
            if ratio < _MIN_CONTRAST:
                failures.append(f"{key} {color}: contrast {ratio:.2f}:1 vs {bg} (need {_MIN_CONTRAST}:1)")
    if typography.get("base_size", 0) < _MIN_BASE_SIZE:
        failures.append(f"typography.base_size {typography.get('base_size', 0)} < {_MIN_BASE_SIZE}px")
    if failures:
        raise ThemeAccessibilityError(failures)


BUILTIN_THEMES = [
    {"theme_id": "default", "name": "Behaverse Default",
     "palette": {"primary": "#1a5fb4", "secondary": "#613583", "success": "#26734d",
                 "warning": "#8f6000", "error": "#a51d2d", "background": "#ffffff"},
     "typography": {"font_family": "Inter, system-ui, sans-serif", "base_size": 16},
     "spacing": {"unit": 8}, "logo_url": None, "custom_css": None},
    {"theme_id": "institutional_blue", "name": "Institutional Blue",
     "palette": {"primary": "#0b4f86", "secondary": "#1c5d99", "success": "#26734d",
                 "warning": "#8f6000", "error": "#a51d2d", "background": "#ffffff"},
     "typography": {"font_family": "Georgia, serif", "base_size": 16},
     "spacing": {"unit": 8}, "logo_url": None, "custom_css": None},
    {"theme_id": "institutional_green", "name": "Institutional Green",
     "palette": {"primary": "#1b5e3a", "secondary": "#2c6e49", "success": "#26734d",
                 "warning": "#8f6000", "error": "#a51d2d", "background": "#ffffff"},
     "typography": {"font_family": "Inter, system-ui, sans-serif", "base_size": 16},
     "spacing": {"unit": 8}, "logo_url": None, "custom_css": None},
]


def seed_builtin_themes(conn) -> None:
    """Idempotently upsert the built-in themes (ON CONFLICT DO NOTHING in the store)."""
    from .store import themes as store
    for t in BUILTIN_THEMES:
        store.insert_theme(conn, **t)
