from harvester.draft import draft
from harvester.dedup import option_fingerprint
from harvester.raw import RawQuestionnaire
from harvester.licensing import LicenseFlag

PHQ_FREQ = {"input_data_type": "choice", "measurement_type": "ordinal", "selection": "single",
            "dimension": "frequency",
            "anchors": ["Not at all", "Several days", "More than half the days", "Nearly every day"],
            "values": [0.0, 1.0, 2.0, 3.0]}

def _gad7():
    return RawQuestionnaire(
        qst_id="qst_gad7", title="GAD-7", short_title="GAD-7", description="7-item anxiety screener.",
        citation="Spitzer RL et al (2006).", year=2006, source_site="psytoolkit.org",
        source_url="https://us.psytoolkit.org/survey-library/anxiety-gad7.html",
        instruction_text="Over the last 2 weeks, how often have you been bothered by any of the following problems?",
        scale=dict(PHQ_FREQ),
        items=[{"text": "Feeling nervous, anxious, or on edge"},
               {"text": "Not being able to stop or control worrying"}],
        license=LicenseFlag.unknown("https://us.psytoolkit.org/survey-library/anxiety-gad7.html"),
        domain=["anxiety"], population=["adults"])

def test_reuses_existing_phq_frequency_option():
    # Build the option the engine would have indexed, to derive its fingerprint.
    opt = {"input_data_type": "choice", "measurement_type": "ordinal", "selection": "single",
           "dimension": "frequency",
           "options": [{"index": i + 1, "value": v} for i, v in enumerate(PHQ_FREQ["values"])],
           "content": {"en": {"options": [{"index": i + 1, "text": t} for i, t in enumerate(PHQ_FREQ["anchors"])]}}}
    scales_index = {option_fingerprint(opt): ["opt_phq_frequency_4"]}
    res = draft(_gad7(), version="v26.0617", scales_index=scales_index, instr_index={})
    qst = res.entities["questionnaire"][0]
    refs = {e["option"]["ref"] for e in qst["pages"][0]["elements"]}
    assert refs == {"opt_phq_frequency_4@v26.0617"}      # reused, not minted
    assert "opt_phq_frequency_4" in res.reused
    assert not any(o["id"] != "opt_phq_frequency_4" for o in res.entities.get("option", []))
    assert res.entities.get("option", []) == []

def test_mints_prompts_and_sets_license_enum_and_x_metadata():
    res = draft(_gad7(), version="v26.0617", scales_index={}, instr_index={})
    qst = res.entities["questionnaire"][0]
    assert qst["metadata"]["license"] == "unknown"
    assert qst["metadata"]["x_author_contact_needed"] is True
    assert qst["metadata"]["provenance"] == {"source": "web_harvest",
        "imported_at": "2026-06-17T00:00:00Z", "importer_version": "web-harvest-0.1.0"}
    assert len(res.entities["prompt"]) == 2
    assert qst["pages"][0]["elements"][0]["question"]["prompt"]["ref"] == "pr_gad7_1@v26.0617"


def _gad7_with_context():
    # Mirror what the adapter produces: temporal frame split into context_text, and the
    # instruction trimmed + capitalized.
    rq = _gad7()
    rq.context_text = "Over the last 2 weeks,"
    rq.instruction_text = "How often have you been bothered by any of the following problems?"
    return rq

def test_mints_faithful_context_with_content_based_id():
    res = draft(_gad7_with_context(), version="v26.0617", scales_index={}, instr_index={})
    qst = res.entities["questionnaire"][0]
    # minted verbatim (no "2"->"two" folding), content-based id, batch version
    assert len(res.entities["context"]) == 1
    ctx = res.entities["context"][0]
    assert ctx["id"] == "ctx_over_the_last_2_weeks"
    assert ctx["content"]["en"]["text"] == "Over the last 2 weeks,"
    ctx_refs = {e["question"]["context"]["ref"] for e in qst["pages"][0]["elements"]}
    assert ctx_refs == {"ctx_over_the_last_2_weeks@v26.0617"}
    assert "ctx_over_the_last_2_weeks" in res.minted

def test_context_id_is_content_based():
    rq = _gad7_with_context()
    rq.context_text = "Over the last 3 months,"
    res = draft(rq, version="v26.0617", scales_index={}, instr_index={})
    assert res.entities["context"][0]["id"] == "ctx_over_the_last_3_months"

def test_no_context_when_context_text_absent():
    res = draft(_gad7(), version="v26.0617", scales_index={}, instr_index={})
    qst = res.entities["questionnaire"][0]
    assert all("context" not in e["question"] for e in qst["pages"][0]["elements"])
    assert res.entities["context"] == []


# --- collision guard: never silently overwrite a questionnaire harvested from a
#     different source URL (id-derivation clashes, e.g. two "BES" instruments) ---

def _write_questionnaire(out_dir, qst_id, source_url):
    res = draft(_gad7(), version="v26.0617", scales_index={}, instr_index={})
    qst = res.entities["questionnaire"][0]
    qst["metadata"]["id"] = qst_id
    qst["metadata"]["x_source_url"] = source_url
    qdir = out_dir / "questionnaires"
    qdir.mkdir(parents=True, exist_ok=True)
    import json
    (qdir / f"{qst_id}.json").write_text(json.dumps(qst))


def test_collision_detected_for_different_source_url(tmp_path):
    from harvester.draft import find_questionnaire_collision
    _write_questionnaire(tmp_path, "qst_bes", "https://x/body-esteem-bes.html")
    clash = find_questionnaire_collision(tmp_path, "qst_bes", "https://x/bes.html")
    assert clash == "https://x/body-esteem-bes.html"


def test_no_collision_for_same_source_url_is_idempotent(tmp_path):
    from harvester.draft import find_questionnaire_collision
    _write_questionnaire(tmp_path, "qst_bes", "https://x/body-esteem-bes.html")
    assert find_questionnaire_collision(tmp_path, "qst_bes",
                                        "https://x/body-esteem-bes.html") is None


def test_no_collision_when_id_unseen(tmp_path):
    from harvester.draft import find_questionnaire_collision
    assert find_questionnaire_collision(tmp_path, "qst_new", "https://x/new.html") is None
