from harvester.licensing import LicenseFlag

def test_public_domain_maps_to_enum():
    f = LicenseFlag(license_class="public_domain", license_status="confirmed",
                    commercial_use="yes", redistribution="yes", translation="yes",
                    source_url="https://x", author_contact_needed=False, notes="")
    assert f.canonical_enum() == "public_domain"

def test_free_research_maps_to_proprietary_open_redistribution():
    f = LicenseFlag(license_class="free_research", license_status="inferred",
                    commercial_use="no", redistribution="yes", translation="unknown",
                    source_url="https://x", author_contact_needed=False, notes="research only")
    assert f.canonical_enum() == "proprietary_open_redistribution"

def test_unknown_default_flags_author_contact():
    f = LicenseFlag.unknown("https://src")
    assert f.canonical_enum() == "unknown"
    assert f.author_contact_needed is True
    assert f.x_metadata()["x_license_status"] == "unknown"
    assert f.x_metadata()["x_source_url"] == "https://src"
