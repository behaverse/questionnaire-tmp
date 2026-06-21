import json
from library.importers.survey_db.writer import write_entity
from harvester.versions import normalize_versions


def _q(qid, ver):
    return {"@context": "x",
            "metadata": {"id": qid, "title": "T", "short_title": "T",
                         "x_source_url": "http://example.org/x@notaref", "version": ver},
            "pages": [{"id": "page_main", "elements": [
                {"option": {"ref": f"opt_{qid}_1@{ver}"},
                 "question": {"prompt": {"ref": f"pr_{qid}_1@{ver}"},
                              "instruction": {"ref": f"ins_{qid}@{ver}"}}}]}]}

def test_normalize_restamps_version_and_refs(tmp_path):
    out = tmp_path / "output"
    write_entity(out, "questionnaire", _q("qst_a", "v26.0617"))
    changed = normalize_versions(out, "v26.0618")
    assert changed == ["qst_a"]
    q = json.loads((out / "questionnaires" / "qst_a.json").read_text())
    assert q["metadata"]["version"] == "v26.0618"
    el = q["pages"][0]["elements"][0]
    assert el["option"]["ref"] == "opt_qst_a_1@v26.0618"
    assert el["question"]["prompt"]["ref"] == "pr_qst_a_1@v26.0618"
    assert el["question"]["instruction"]["ref"] == "ins_qst_a@v26.0618"
    # a string with a stray '@' but no version suffix is untouched
    assert q["metadata"]["x_source_url"] == "http://example.org/x@notaref"

def test_normalize_idempotent(tmp_path):
    out = tmp_path / "output"
    write_entity(out, "questionnaire", _q("qst_b", "v26.0618"))
    before = (out / "questionnaires" / "qst_b.json").read_text()
    assert normalize_versions(out, "v26.0618") == []
    assert (out / "questionnaires" / "qst_b.json").read_text() == before
