from library.importers.survey_db.questionnaire import reconstruct
from library.importers.survey_db.provenance import build_provenance

SURVEY = {"survey_id": "aiss", "title": "AISS", "variant": "1996", "description": "d",
          "license": None, "topics": "risk; novelty", "target_population": None,
          "validated_languages": "en; pt", "reference": "DOI: x", "tags": "a; b", "scoring_code": "http://x"}
COMPS = [
    {"id": 1, "questionnaire": "x_aiss", "element_type": "header", "header_id": "aiss"},
    {"id": 2, "questionnaire": "x_aiss", "element_type": "message", "message_id": "intro"},
    {"id": 3, "questionnaire": "x_aiss", "element_type": "question", "prompt_id": "aiss_q_1",
     "option_id": "agreement_7", "context_id": None, "instruction_id": None, "is_required": 1, "condition": None},
]

def test_reconstruct_metadata_and_elements():
    # available_languages is derived from actual prompt content (complete coverage), not the
    # survey's validated_languages column; the single referenced prompt carries en + pt.
    q = reconstruct("x_aiss", COMPS, SURVEY, release="v26.0606", imported_at="2026-06-06T00:00:00Z",
                    prompt_langs={"aiss_q_1": {"en", "pt"}})
    assert q["metadata"]["id"] == "qst_x_aiss" and q["metadata"]["version"] == "v26.0606"
    assert q["metadata"]["title"] == "AISS" and q["metadata"]["license"] == "unknown"
    assert q["metadata"]["classification"]["domain"] == ["risk", "novelty"]
    assert q["metadata"]["language"] == "en"
    assert q["metadata"]["available_languages"] == ["en", "pt"]
    assert q["metadata"]["x_validated_languages"] == ["en", "pt"]  # survey claim kept as provenance
    assert q["metadata"]["provenance"]["source"] == "survey_db_sqlite"
    # NOTE: source_header_id / source_questionnaire_id were removed from the provenance block
    # because the instrument schema has additionalProperties: false on provenance.
    # The instrument schema allows only: source, source_version, imported_at, imported_by,
    # import_loss_report_url, importer_version.
    assert "imported_at" in q["metadata"]["provenance"]
    els = q["pages"][0]["elements"]
    assert els[0]["ref"] == "msg_intro@v26.0606"          # message element
    item = els[1]
    assert item["question"]["prompt"]["ref"] == "pr_aiss_q_1@v26.0606"
    assert item["option"]["ref"] == "opt_agreement_7@v26.0606"
    assert item["required"] is True

_LANG_COMPS = [
    {"id": 1, "questionnaire": "x_t", "element_type": "header", "header_id": "t"},
    {"id": 2, "questionnaire": "x_t", "element_type": "question", "prompt_id": "p1",
     "option_id": "o", "context_id": None, "instruction_id": None, "is_required": 0, "condition": None},
    {"id": 3, "questionnaire": "x_t", "element_type": "question", "prompt_id": "p2",
     "option_id": "o", "context_id": None, "instruction_id": None, "is_required": 0, "condition": None},
]
_LANG_SURVEY = {"survey_id": "t", "title": "T", "description": "d", "license": None}


def test_available_languages_requires_complete_coverage():
    # p1 has en+fr, p2 has only en -> fr is partial -> only en is advertised as available.
    q = reconstruct("x_t", _LANG_COMPS, _LANG_SURVEY, release="v26.0606",
                    imported_at="2026-06-06T00:00:00Z",
                    prompt_langs={"p1": {"en", "fr"}, "p2": {"en"}})
    assert q["metadata"]["available_languages"] == ["en"]
    assert q["metadata"]["language"] == "en"


def test_available_languages_full_coverage_lists_all_in_canonical_order():
    # both prompts fully translated to fr -> en + fr available, en-first canonical order.
    q = reconstruct("x_t", _LANG_COMPS, _LANG_SURVEY, release="v26.0606",
                    imported_at="2026-06-06T00:00:00Z",
                    prompt_langs={"p1": {"fr", "en"}, "p2": {"en", "fr"}})
    assert q["metadata"]["available_languages"] == ["en", "fr"]


def test_no_prompt_langs_yields_no_available_languages():
    # called without content coverage (e.g. legacy callers) -> available_languages omitted.
    q = reconstruct("x_t", _LANG_COMPS, _LANG_SURVEY, release="v26.0606",
                    imported_at="2026-06-06T00:00:00Z")
    assert "available_languages" not in q["metadata"]
    assert q["metadata"]["language"] == "en"


def test_build_provenance_fields():
    p = build_provenance("x_aiss", "aiss", "2026-06-06T00:00:00Z")
    assert p["source"] == "survey_db_sqlite"
    assert p["imported_at"] == "2026-06-06T00:00:00Z" and p["importer_version"].startswith("survey-db-importer")
    # Confirms only schema-allowed fields are present (additionalProperties: false)
    allowed = {"source", "source_version", "imported_at", "imported_by",
               "import_loss_report_url", "importer_version"}
    assert set(p.keys()) <= allowed


def test_reconstruct_emits_instrument_id_and_variant():
    # the header element's header_id ('aiss') becomes the family key; variant defaults to 'base'
    q = reconstruct("x_aiss", COMPS, SURVEY, release="v26.0606", imported_at="2026-06-06T00:00:00Z",
                    prompt_langs={"aiss_q_1": {"en"}})
    assert q["metadata"]["instrument_id"] == "inst_aiss"
    assert q["metadata"]["variant"] == "base"


def test_reconstruct_no_header_id_means_no_instrument_id():
    comps = [c for c in COMPS if c["element_type"] != "header"]  # drop the header row
    q = reconstruct("x_aiss", comps, {"survey_id": "aiss", "title": "AISS", "description": "d", "license": None},
                    release="v26.0606", imported_at="2026-06-06T00:00:00Z", prompt_langs={"aiss_q_1": {"en"}})
    assert "instrument_id" not in q["metadata"]
    assert q["metadata"]["variant"] == "base"


def test_reconstruct_sets_item_count_from_question_elements():
    # COMPS has one question element -> item_count 1 (legacy data only encodes count in the title text)
    q = reconstruct("x_aiss", COMPS, SURVEY, release="v26.0606", imported_at="2026-06-06T00:00:00Z",
                    prompt_langs={"aiss_q_1": {"en"}})
    assert q["metadata"]["psychometrics"]["item_count"] == 1


def test_reconstruct_degenerate_header_id_omits_instrument_id():
    # a header_id that sanitizes to empty must NOT emit an invalid 'inst_' value
    comps = [dict(c, header_id="---") if c["element_type"] == "header" else c for c in COMPS]
    q = reconstruct("x_aiss", comps, SURVEY, release="v26.0606", imported_at="2026-06-06T00:00:00Z",
                    prompt_langs={"aiss_q_1": {"en"}})
    assert "instrument_id" not in q["metadata"]
    assert q["metadata"]["variant"] == "base"
