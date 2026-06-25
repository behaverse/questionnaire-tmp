import json
from types import SimpleNamespace
from library.importers.survey_db.writer import write_entity
from harvester.classifications import (
    load_classifications, apply_classification, apply_classifications_to_output,
    check_classifications, derive_instrument_id)


def _store(tmp_path, mapping):
    p = tmp_path / "classifications.json"
    p.write_text(json.dumps(mapping))
    return p

def _q(qid, *, domain=None, population=None, instrument_id=None, short_title="ZZ"):
    cls = {"domain": domain or [], "population": population or [],
           "administration_mode": ["self_report"]}
    md = {"id": qid, "title": "T", "short_title": short_title, "description": "d",
          "classification": cls}
    if instrument_id:
        md["instrument_id"] = instrument_id
    return {"@context": "x", "metadata": md, "pages": [{"id": "page_main", "elements": []}]}


def test_derive_instrument_id_strips_nonalnum():
    assert derive_instrument_id("WHO-5", "qst_who5") == "inst_who5"
    assert derive_instrument_id("PCL-22", "qst_pcl22") == "inst_pcl22"
    assert derive_instrument_id("AAI", "qst_aai") == "inst_aai"

def test_derive_instrument_id_falls_back_to_qst_id():
    assert derive_instrument_id("", "qst_adolescents") == "inst_adolescents"

def test_load_drops_blank_todo_and_empty(tmp_path):
    p = _store(tmp_path, {
        "qst_a": {"domain": ["anxiety"], "population": ["adults"], "instrument_id": "inst_a"},
        "qst_b": {"domain": ["", "  "], "population": [], "instrument_id": "TODO: later"},
        "qst_c": {"domain": ["TODO", "depression"]},
    })
    loaded = load_classifications(p)
    assert loaded["qst_a"] == {"domain": ["anxiety"], "population": ["adults"], "instrument_id": "inst_a"}
    assert "qst_b" not in loaded  # nothing usable
    assert loaded["qst_c"] == {"domain": ["depression"], "population": [], "instrument_id": None}

def test_load_missing(tmp_path):
    assert load_classifications(tmp_path / "nope.json") == {}

def test_apply_classification_sets_present(tmp_path):
    p = _store(tmp_path, {"qst_x": {"domain": ["mood"], "population": ["clinical"], "instrument_id": "inst_x"}})
    rq = SimpleNamespace(qst_id="qst_x", domain=[], population=[], instrument_id=None)
    assert apply_classification(rq, p) is True
    assert rq.domain == ["mood"] and rq.population == ["clinical"] and rq.instrument_id == "inst_x"

def test_apply_classification_noop_when_absent(tmp_path):
    p = _store(tmp_path, {"qst_y": {"domain": ["mood"]}})
    rq = SimpleNamespace(qst_id="qst_x", domain=["keep"], population=[], instrument_id=None)
    assert apply_classification(rq, p) is False and rq.domain == ["keep"]

def test_apply_to_output_patches_only_overridden(tmp_path):
    out = tmp_path / "output"
    write_entity(out, "questionnaire", _q("qst_a"))
    write_entity(out, "questionnaire", _q("qst_b", domain=["anxiety"]))
    before_b = (out / "questionnaires" / "qst_b.json").read_text()
    p = _store(tmp_path, {"qst_a": {"domain": ["depression"], "population": ["adults"],
                                    "instrument_id": "inst_a"}})
    patched = apply_classifications_to_output(out, p)
    assert patched == ["qst_a"]
    a = json.loads((out / "questionnaires" / "qst_a.json").read_text())["metadata"]
    assert a["classification"]["domain"] == ["depression"]
    assert a["classification"]["population"] == ["adults"]
    assert a["classification"]["administration_mode"] == ["self_report"]  # preserved
    assert a["instrument_id"] == "inst_a"
    assert (out / "questionnaires" / "qst_b.json").read_text() == before_b  # untouched

def test_apply_to_output_idempotent(tmp_path):
    out = tmp_path / "output"
    write_entity(out, "questionnaire", _q("qst_a", domain=["depression"], instrument_id="inst_a"))
    p = _store(tmp_path, {"qst_a": {"domain": ["depression"], "instrument_id": "inst_a"}})
    assert apply_classifications_to_output(out, p) == []  # already matches → no rewrite

def test_check_flags_gaps_and_off_vocab(tmp_path):
    out = tmp_path / "output"
    write_entity(out, "questionnaire", _q("qst_gap"))  # no domain, no instrument_id
    write_entity(out, "questionnaire", _q("qst_ok", domain=["anxiety"], instrument_id="inst_ok"))
    write_entity(out, "questionnaire", _q("qst_bad", domain=["anxiety"], instrument_id="inst_bad"))
    p = _store(tmp_path, {
        "qst_bad": {"domain": ["made_up_domain"], "population": ["martians"],
                    "instrument_id": "INST-BAD"},
    })
    flagged = {f["id"]: f["issues"] for f in check_classifications(out, p)}
    assert "no domain" in flagged["qst_gap"] and "no instrument_id" in flagged["qst_gap"]
    assert "qst_ok" not in flagged
    joined = " ".join(flagged["qst_bad"])
    assert "off-vocab domain" in joined and "off-vocab population" in joined and "bad instrument_id" in joined
