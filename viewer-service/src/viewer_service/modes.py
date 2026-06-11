class UnsupportedPreset(Exception):
    """Raised for a mode preset whose dependencies (Identity/Platform/host) aren't built yet."""


# Only the two auth:none presets are wired in VS-C. The others exist in design/08a but
# require Identity/Platform/host integration and are rejected at create until then.
PRESETS = {
    "anonymous_link": {"auth": "none", "persistence": "persisted",
                       "lifecycle": "standard", "rendering_context": "standalone"},
    "demo": {"auth": "none", "persistence": "ephemeral",
             "lifecycle": "standard", "rendering_context": "standalone"},
}
SUPPORTED = set(PRESETS)


def resolve_preset(preset: str) -> dict:
    """Return the 4 orthogonal dimensions for a supported preset, or raise UnsupportedPreset."""
    if preset not in PRESETS:
        raise UnsupportedPreset(preset)
    return dict(PRESETS[preset])
