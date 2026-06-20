from types import SimpleNamespace
from harvester.descriptions import load_authored, apply_authored_description

def test_load_authored_reads_md_files(tmp_path):
    (tmp_path / "qst_a.md").write_text("Desc A.\n")
    (tmp_path / "qst_b.md").write_text("  Desc B.  ")
    (tmp_path / "qst_empty.md").write_text("   ")
    m = load_authored(tmp_path)
    assert m == {"qst_a": "Desc A.", "qst_b": "Desc B."}

def test_load_authored_missing_dir(tmp_path):
    assert load_authored(tmp_path / "nope") == {}

def test_apply_authored_sets_description_and_source(tmp_path):
    (tmp_path / "qst_x.md").write_text("The X (X) is a 3-item demo. It is used to test.")
    rq = SimpleNamespace(qst_id="qst_x", description="old scraped", description_source=None)
    assert apply_authored_description(rq, tmp_path) is True
    assert rq.description == "The X (X) is a 3-item demo. It is used to test."
    assert rq.description_source == "authored"

def test_apply_authored_noop_when_absent(tmp_path):
    rq = SimpleNamespace(qst_id="qst_y", description="old", description_source=None)
    assert apply_authored_description(rq, tmp_path) is False
    assert rq.description == "old" and rq.description_source is None

import json
from library.importers.survey_db.writer import write_entity
from harvester.descriptions import apply_descriptions_to_output

def _q(qid, desc="scraped", src="site_meta"):
    return {"@context": "x", "metadata": {"id": qid, "title": "T", "short_title": "T",
            "description": desc, "x_source_site": "psychology-tools.com",
            "x_description_source": src}, "pages": [{"id": "page_main", "elements": []}]}

def test_apply_descriptions_patches_only_overridden(tmp_path):
    out = tmp_path / "output"
    write_entity(out, "questionnaire", _q("qst_a"))
    write_entity(out, "questionnaire", _q("qst_b"))
    untouched_before = (out / "questionnaires" / "qst_b.json").read_text()
    desc = tmp_path / "descriptions"; desc.mkdir()
    (desc / "qst_a.md").write_text("The A (A) is authored. It is used to test.")
    patched = apply_descriptions_to_output(out, desc)
    assert patched == ["qst_a"]
    a = json.loads((out / "questionnaires" / "qst_a.json").read_text())["metadata"]
    assert a["description"] == "The A (A) is authored. It is used to test."
    assert a["x_description_source"] == "authored"
    # qst_b (no override) byte-identical
    assert (out / "questionnaires" / "qst_b.json").read_text() == untouched_before


from harvester.descriptions import check_descriptions

def _setup(tmp_path, qid, short, desc_text, intro):
    out = tmp_path / "output"
    write_entity(out, "questionnaire", _q(qid))
    # patch short_title
    import json as _j
    p = out / "questionnaires" / f"{qid}.json"
    q = _j.loads(p.read_text()); q["metadata"]["short_title"] = short
    write_entity(out, "questionnaire", q)
    desc = tmp_path / "descriptions"; desc.mkdir(exist_ok=True)
    (desc / f"{qid}.md").write_text(desc_text)
    sm = tmp_path / "sm"; sm.mkdir(exist_ok=True)
    (sm / f"{qid}.json").write_text(_j.dumps({"id": qid, "introduction": [intro], "meta_description": ""}))
    return out, desc, sm

def test_check_flags_verbatim_overlap(tmp_path):
    intro = "the alpha beta gamma delta epsilon zeta eta theta iota measure is good"
    out, desc, sm = _setup(tmp_path, "qst_o", "AAA",
                           "AAA: the alpha beta gamma delta epsilon zeta eta theta iota measure.", intro)
    issues = {i["id"]: i["issues"] for i in check_descriptions(out, desc, sm)}
    assert any("overlap" in s for s in issues.get("qst_o", []))

def test_check_flags_shape_problems(tmp_path):
    out, desc, sm = _setup(tmp_path, "qst_s", "ZZZ", "no acronym here and no period", "unrelated source text")
    issues = {i["id"]: i["issues"] for i in check_descriptions(out, desc, sm)}
    assert "qst_s" in issues  # missing acronym + missing period

def test_check_clean_description_passes(tmp_path):
    out, desc, sm = _setup(tmp_path, "qst_c", "GAD-7",
                           "The GAD-7 is a 7-item anxiety screening questionnaire. It is used in primary care.",
                           "completely different wording about worry over fourteen days for screening purposes here")
    assert check_descriptions(out, desc, sm) == []
