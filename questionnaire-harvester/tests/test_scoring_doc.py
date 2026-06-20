import json
import pytest
from harvester.scoring_doc import derive_scoring, render_scoring_md, write_scoring_docs


def _opt(oid, dim, vals, anchors, mt="ordinal"):
    return {"id": oid, "dimension": dim, "measurement_type": mt, "input_data_type": "choice",
            "selection": "single",
            "options": [{"index": i + 1, "value": float(v)} for i, v in enumerate(vals)],
            "content": {"en": {"options": [{"index": i + 1, "text": a}
                                           for i, a in enumerate(anchors)]}}}

def _pr(pid, text, reversed=False, subscales=None):
    p = {"id": pid, "content": {"en": {"text": text}}}
    if reversed:
        p["reversed"] = True
    if subscales:
        p["subscales"] = subscales
    return p

def _qst(qid, elements, **md):
    m = {"id": qid, "title": md.get("title", "T"), "short_title": md.get("short_title", "T"),
         "x_source_url": md.get("source_url", "http://x")}
    if "publication" in md:
        m["publication"] = md["publication"]
    return {"metadata": m, "pages": [{"id": "page_main", "elements": elements}]}

def test_derive_uniform_single_scale():
    o = _opt("opt_x_rating_3", "rating", [0, 1, 2], ["Never", "Sometimes", "Often"])
    prs = {f"pr_x_{i}": _pr(f"pr_x_{i}", f"item {i}") for i in (1, 2, 3)}
    els = [{"option": {"ref": "opt_x_rating_3@v26.0618"},
            "question": {"prompt": {"ref": f"pr_x_{i}@v26.0618"}}} for i in (1, 2, 3)]
    d = derive_scoring(_qst("qst_x", els), {"opt_x_rating_3": o}, prs)
    assert d["item_count"] == 3
    assert d["dimensions"] == ["rating"]
    assert d["uniform_scale"] is True
    assert len(d["option_scales"]) == 1
    sc = d["option_scales"][0]
    assert sc["values"] == [0, 1, 2] and sc["value_range"] == [0, 2]
    assert sc["anchors"] == ["Never", "Sometimes", "Often"]
    assert d["reversed_items"] == []
    assert len(d["per_item"]) == 3
    assert d["status"] == "needs-research"
    assert d["to_research"] == {"aggregation": None, "subscale_definitions": None,
                                "cutoffs": None, "notes": None}

def test_derive_two_dimensions_not_uniform():
    of = _opt("opt_y_fear_1", "fear", [0, 1, 2, 3], ["None", "Mild", "Moderate", "Severe"])
    oa = _opt("opt_y_avoidance_2", "avoidance", [0, 1, 2, 3], ["Never", "Rarely", "Often", "Usually"])
    els = [{"option": {"ref": "opt_y_fear_1@v"}, "question": {"prompt": {"ref": "pr_y_1@v"}}},
           {"option": {"ref": "opt_y_avoidance_2@v"}, "question": {"prompt": {"ref": "pr_y_2@v"}}}]
    d = derive_scoring(_qst("qst_y", els), {"opt_y_fear_1": of, "opt_y_avoidance_2": oa},
                       {"pr_y_1": _pr("pr_y_1", "s1"), "pr_y_2": _pr("pr_y_2", "s1")})
    assert d["dimensions"] == ["avoidance", "fear"]
    assert d["uniform_scale"] is False
    assert len(d["option_scales"]) == 2

def test_derive_reversed_and_subscales():
    o = _opt("opt_z_rating_2", "rating", [0, 1], ["No", "Yes"])
    els = [{"option": {"ref": "opt_z_rating_2@v"}, "question": {"prompt": {"ref": "pr_z_1@v"}}},
           {"option": {"ref": "opt_z_rating_2@v"}, "question": {"prompt": {"ref": "pr_z_2@v"}}}]
    d = derive_scoring(_qst("qst_z", els), {"opt_z_rating_2": o},
                       {"pr_z_1": _pr("pr_z_1", "a", reversed=True, subscales=["scl_anx@v26.0601"]),
                        "pr_z_2": _pr("pr_z_2", "b")})
    assert d["reversed_items"] == ["pr_z_1"]
    assert d["per_item"][0]["reversed"] is True
    assert d["subscales"] == ["scl_anx"]
    assert d["uniform_scale"] is True

def test_derive_missing_option_flagged_not_crash():
    els = [{"option": {"ref": "opt_missing@v"}, "question": {"prompt": {"ref": "pr_m_1@v"}}}]
    d = derive_scoring(_qst("qst_m", els), {}, {"pr_m_1": _pr("pr_m_1", "a")})
    assert "missing option opt_missing" in (d["to_research"]["notes"] or "")
    assert d["item_count"] == 1

def test_render_md_roundtrips_json_block_and_has_table():
    o = _opt("opt_x_rating_3", "rating", [0, 1, 2], ["Never", "Sometimes", "Often"])
    prs = {f"pr_x_{i}": _pr(f"pr_x_{i}", f"item {i}") for i in (1, 2, 3)}
    els = [{"option": {"ref": "opt_x_rating_3@v"},
            "question": {"prompt": {"ref": f"pr_x_{i}@v"}}} for i in (1, 2, 3)]
    d = derive_scoring(_qst("qst_x", els, source_url="http://src"), {"opt_x_rating_3": o}, prs)
    md = render_scoring_md(d)
    block = md.split("```json", 1)[1].split("```", 1)[0]
    assert json.loads(block)["id"] == "qst_x"
    assert "needs-research" in md
    assert "http://src" in md
    assert "| # | item | dimension | weights | reversed |" in md
    assert md.count("- [ ]") == 3

def test_write_scoring_docs_tmp(tmp_path):
    out = tmp_path / "output"
    (out / "questionnaires").mkdir(parents=True)
    (out / "options").mkdir()
    (out / "prompts").mkdir()
    o = _opt("opt_x_rating_3", "rating", [0, 1, 2], ["Never", "Sometimes", "Often"])
    (out / "options" / "opt_x_rating_3.json").write_text(json.dumps(o))
    for i in (1, 2, 3):
        (out / "prompts" / f"pr_x_{i}.json").write_text(json.dumps(_pr(f"pr_x_{i}", f"item {i}")))
    els = [{"option": {"ref": "opt_x_rating_3@v"},
            "question": {"prompt": {"ref": f"pr_x_{i}@v"}}} for i in (1, 2, 3)]
    (out / "questionnaires" / "qst_x.json").write_text(json.dumps(_qst("qst_x", els)))
    sc = tmp_path / "scoring"
    ids = write_scoring_docs(out, sc)
    assert ids == ["qst_x"]
    assert (sc / "qst_x.md").exists()
    block = (sc / "qst_x.md").read_text().split("```json", 1)[1].split("```", 1)[0]
    assert json.loads(block)["item_count"] == 3
