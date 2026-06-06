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
    q = reconstruct("x_aiss", COMPS, SURVEY, release="v26.0606", imported_at="2026-06-06T00:00:00Z")
    assert q["metadata"]["id"] == "qst_x_aiss" and q["metadata"]["version"] == "v26.0606"
    assert q["metadata"]["title"] == "AISS" and q["metadata"]["license"] == "unknown"
    assert q["metadata"]["classification"]["domain"] == ["risk", "novelty"]
    assert q["metadata"]["available_languages"] == ["en", "pt"]
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

def test_build_provenance_fields():
    p = build_provenance("x_aiss", "aiss", "2026-06-06T00:00:00Z")
    assert p["source"] == "survey_db_sqlite"
    assert p["imported_at"] == "2026-06-06T00:00:00Z" and p["importer_version"].startswith("survey-db-importer")
    # Confirms only schema-allowed fields are present (additionalProperties: false)
    allowed = {"source", "source_version", "imported_at", "imported_by",
               "import_loss_report_url", "importer_version"}
    assert set(p.keys()) <= allowed
