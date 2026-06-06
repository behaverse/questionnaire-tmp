from library.licensing import effective_license

def test_single_license_passthrough():
    assert effective_license(["cc_by"]) == "cc_by"

def test_strictest_wins_when_homogeneous_family():
    assert effective_license(["cc0", "cc0"]) == "cc0"

def test_mixed_returns_mixed_marker():
    assert effective_license(["cc_by", "proprietary_restricted"]) == "mixed_see_components"

def test_unknown_is_restrictive():
    assert effective_license(["cc_by", "unknown"]) == "mixed_see_components"

def test_empty_defaults_unknown():
    assert effective_license([]) == "unknown"
