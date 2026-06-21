import json
from types import SimpleNamespace
from library.importers.survey_db.writer import write_entity
from harvester.short_titles import (
    load_short_titles, apply_short_title, apply_short_titles_to_output, check_short_titles)


def _store(tmp_path, mapping):
    p = tmp_path / "short_titles.json"
    p.write_text(json.dumps(mapping))
    return p

def _q(qid, st):
    return {"@context": "x", "metadata": {"id": qid, "title": "T", "short_title": st,
            "description": "d"}, "pages": [{"id": "page_main", "elements": []}]}

def test_load_short_titles_drops_todo_and_blank(tmp_path):
    p = _store(tmp_path, {"qst_a": "AAA", "qst_b": "TODO: maybe BBB", "qst_c": "  ", "qst_d": "D-1"})
    assert load_short_titles(p) == {"qst_a": "AAA", "qst_d": "D-1"}

def test_load_short_titles_missing(tmp_path):
    assert load_short_titles(tmp_path / "nope.json") == {}

def test_apply_short_title_sets_when_present(tmp_path):
    p = _store(tmp_path, {"qst_x": "XSC"})
    rq = SimpleNamespace(qst_id="qst_x", short_title="old")
    assert apply_short_title(rq, p) is True and rq.short_title == "XSC"

def test_apply_short_title_noop_for_todo(tmp_path):
    p = _store(tmp_path, {"qst_x": "TODO: XSC?"})
    rq = SimpleNamespace(qst_id="qst_x", short_title="old")
    assert apply_short_title(rq, p) is False and rq.short_title == "old"

def test_apply_to_output_patches_only_overridden(tmp_path):
    out = tmp_path / "output"
    write_entity(out, "questionnaire", _q("qst_a", "for adolescents"))
    write_entity(out, "questionnaire", _q("qst_b", "BITe"))
    before_b = (out / "questionnaires" / "qst_b.json").read_text()
    p = _store(tmp_path, {"qst_a": "ABS", "qst_b": "TODO: skip"})
    patched = apply_short_titles_to_output(out, p)
    assert patched == ["qst_a"]
    a = json.loads((out / "questionnaires" / "qst_a.json").read_text())["metadata"]
    assert a["short_title"] == "ABS"
    assert (out / "questionnaires" / "qst_b.json").read_text() == before_b  # untouched

def test_check_flags_junk_not_clean(tmp_path):
    out = tmp_path / "output"
    for qid, st in [("qst_1", "for adolescents"), ("qst_2", "revised version"),
                    ("qst_3", "Short Form"), ("qst_4", "CIA 3.0"), ("qst_5", "Rotter, 1966"),
                    ("qst_6", "Original"), ("qst_7", "Trust in close relationships"),
                    ("qst_ok1", "PHQ-9"), ("qst_ok2", "BITe"), ("qst_ok3", "WHO-5"),
                    ("qst_ok4", "Teacher Burnout")]:
        write_entity(out, "questionnaire", _q(qid, st))
    flagged = {f["id"] for f in check_short_titles(out)}
    assert {"qst_1", "qst_2", "qst_3", "qst_4", "qst_5", "qst_6", "qst_7"} <= flagged
    assert not ({"qst_ok1", "qst_ok2", "qst_ok3", "qst_ok4"} & flagged)
