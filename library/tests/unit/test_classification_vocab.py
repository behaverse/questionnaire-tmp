from library.classification_vocab import (
    normalize_domain_value, normalize_survey_db_domains,
    PREFERRED_DOMAIN, SURVEY_DB_DOMAIN_MAP)


def test_casing_dupes_collapse():
    assert normalize_domain_value("Attention") == "attention"
    assert normalize_domain_value("attention") == "attention"
    assert normalize_domain_value("Impulsivity") == "impulsivity"
    assert normalize_domain_value("Self-Control") == "personality"


def test_prose_phrases_map_to_clean_buckets():
    assert normalize_domain_value("attentional shifting") == "attention"
    assert normalize_domain_value("spontaneous mind wandering") == "mind_wandering"
    assert normalize_domain_value("need for cognition") == "cognition"
    assert normalize_domain_value("positive and negative affect") == "mood"
    assert normalize_domain_value("growth versus fixed mindset") == "self_efficacy"


def test_study_context_tags_dropped():
    for junk in ("demographics", "debrief", "handedness", "income", "sport", "multimedia"):
        assert normalize_domain_value(junk) is None


def test_unknown_value_dropped_clean_value_passes_through():
    assert normalize_domain_value("totally unknown topic") is None
    assert normalize_domain_value("anxiety") == "anxiety"
    assert normalize_domain_value("autism") == "autism"  # extended vocab passes through


def test_normalize_list_dedupes_and_drops():
    out = normalize_survey_db_domains(["Attention", "attentional control", "demographics", "novelty"])
    assert out == ["attention", "personality"]  # deduped, junk dropped, order preserved


def test_every_map_target_is_clean_vocab_or_none():
    for raw, clean in SURVEY_DB_DOMAIN_MAP.items():
        assert raw == raw.strip().lower(), f"map key not normalized: {raw!r}"
        assert clean is None or clean in PREFERRED_DOMAIN, f"bad target {clean!r} for {raw!r}"
