from library.importers.survey_db.ids import sanitize, canonical_id, LANGS_FULL, LANGS_MIN

def test_sanitize_lowercases_and_replaces():
    assert sanitize("acs-s") == "acs_s"
    assert sanitize("AISS Q1!") == "aiss_q1"
    assert sanitize("__x__") == "x"

def test_canonical_id_prefixes_by_type():
    assert canonical_id("prompt", "aiss_q_1") == "pr_aiss_q_1"
    assert canonical_id("option", "agreement_7") == "opt_agreement_7"
    assert canonical_id("questionnaire", "x_aiss") == "qst_x_aiss"
    assert canonical_id("questionnaire", "acs-s") == "qst_acs_s"

def test_lang_lists():
    assert LANGS_FULL[:2] == ["en", "fr"] and "it" in LANGS_FULL
    assert LANGS_MIN == ["en", "fr"]
