import json
from harvester.review_export import (
    render_option, render_questionnaire_md, index_entry, render_index_md, write_review_export)


def _choice(oid, dim, vals, anchors):
    return {"id": oid, "input_data_type": "choice", "dimension": dim,
            "measurement_type": "ordinal", "selection": "single",
            "options": [{"index": i + 1, "value": float(v)} for i, v in enumerate(vals)],
            "content": {"en": {"options": [{"index": i + 1, "text": a}
                                           for i, a in enumerate(anchors)]}}}

def _number(oid, dim, lo, hi, step, minl, maxl):
    return {"id": oid, "input_data_type": "number", "dimension": dim,
            "min": float(lo), "max": float(hi), "step": float(step),
            "min_label": minl, "max_label": maxl}

def _pr(pid, text, reversed=False):
    p = {"id": pid, "content": {"en": {"text": text}}}
    if reversed:
        p["reversed"] = True
    return p

def _ins(iid, text):
    return {"id": iid, "content": {"en": {"text": text}}}

def _qst(qid, elements, **md):
    m = {"id": qid, "title": md.get("title", "T"), "short_title": md.get("short_title", "T"),
         "x_source_url": md.get("source_url", "http://x"), "x_source_site": md.get("site", "s"),
         "license": md.get("license", "unknown")}
    if "publication" in md:
        m["publication"] = md["publication"]
    return {"metadata": m, "pages": [{"id": "page_main", "elements": elements}]}

def test_render_option_choice():
    s = render_option(_choice("o", "rating", [0, 1, 2, 3], ["None", "Mild", "Moderate", "Severe"]))
    assert s == "1. None (0) · 2. Mild (1) · 3. Moderate (2) · 4. Severe (3)"

def test_render_option_number_slider():
    s = render_option(_number("o", "rating", 1, 7, 1, "not at all", "very much"))
    assert s == 'number 1–7 (step 1): "not at all" … "very much"'

def test_render_option_blank_anchor_shows_value_only():
    assert render_option(_choice("o", "rating", [0, 1], ["", ""])) == "1. (0) · 2. (1)"

def test_render_option_missing():
    assert render_option(None) == "‹missing option›"

def test_render_questionnaire_md_resolves_text_and_link():
    o = _choice("opt_x", "fear", [0, 1], ["No", "Yes"])
    pr = _pr("pr_x_1", "I feel tense", reversed=True)
    ins = _ins("ins_x", "Rate each item.")
    els = [{"option": {"ref": "opt_x@v"},
            "question": {"prompt": {"ref": "pr_x_1@v"}, "instruction": {"ref": "ins_x@v"}}}]
    md = render_questionnaire_md(
        _qst("qst_x", els, source_url="http://src"),
        {"options": {"opt_x": o}, "prompts": {"pr_x_1": pr},
         "instructions": {"ins_x": ins}, "contexts": {}})
    assert "**Original:** http://src" in md
    assert "I feel tense" in md
    assert "1. No (0) · 2. Yes (1)" in md
    assert "reversed" in md and "dimension: fear" in md
    assert "Rate each item." in md

def test_render_questionnaire_md_missing_option_does_not_crash():
    els = [{"option": {"ref": "opt_gone@v"}, "question": {"prompt": {"ref": "pr_x_1@v"}}}]
    md = render_questionnaire_md(_qst("qst_x", els),
                                 {"options": {}, "prompts": {"pr_x_1": _pr("pr_x_1", "q")},
                                  "instructions": {}, "contexts": {}})
    assert "‹missing option›" in md

def test_render_index_md_grouped_checklist():
    es = [{"id": "qst_b", "title": "B", "short_title": "B", "source_url": "http://b", "source_site": "site2.org"},
          {"id": "qst_a", "title": "A", "short_title": "A", "source_url": "http://a", "source_site": "site1.org"}]
    md = render_index_md(es)
    assert md.index("## site1.org (1)") < md.index("## site2.org (1)")   # sorted by site
    assert "- [ ] [A (`qst_a`)](qst_a.md) — [original](http://a)" in md
    assert md.count("- [ ]") == 2

def test_write_review_export_tmp(tmp_path):
    out = tmp_path / "output"
    for sub in ("questionnaires", "options", "prompts", "instructions", "contexts"):
        (out / sub).mkdir(parents=True)
    (out / "options" / "opt_x.json").write_text(json.dumps(_choice("opt_x", "rating", [0, 1], ["No", "Yes"])))
    (out / "prompts" / "pr_x_1.json").write_text(json.dumps(_pr("pr_x_1", "q1")))
    els = [{"option": {"ref": "opt_x@v"}, "question": {"prompt": {"ref": "pr_x_1@v"}}}]
    (out / "questionnaires" / "qst_x.json").write_text(json.dumps(_qst("qst_x", els, site="s.org")))
    rev = tmp_path / "import_review"
    ids = write_review_export(out, rev)
    assert ids == ["qst_x"]
    assert (rev / "qst_x.md").exists() and (rev / "README.md").exists()
    assert "- [ ]" in (rev / "README.md").read_text()
