import pytest
from harvester.sources.psychology_tools import (
    PsychologyToolsAdapter, PsychologyToolsParseError, _derive_id)

def _page(rows, *, title="Demo Anxiety Scale (DEMO)", instr=True):
    instr_html = '<p>InstructionsRate each statement.</p>' if instr else ''
    return f"""<html><head><meta name="description" content="A short demo scale."></head>
    <body><h1>{title}</h1>{instr_html}
    <form>{rows}</form></body></html>"""

def _row(name, stem, opts):
    cells = "".join(
        f'<span class="notable-td response"><label class="aria-label">{a}</label>'
        f'<input type="radio" name="{name}" value="{v}"></span>' for a, v in opts)
    return (f'<div class="notable-tr question odd">'
            f'<span class="notable-td prompt"><span class="num">{name[1:]}.</span>'
            f'<span>{stem}</span></span>{cells}</div>')

OPTS3 = [("Never", "0"), ("Sometimes", "1"), ("Often", "2")]

def test_parses_items_anchors_values_and_stem():
    html = _page(_row("q1", "I feel tense", OPTS3) + _row("q2", "I worry a lot", OPTS3))
    rq = PsychologyToolsAdapter().parse(html, "https://psychology-tools.com/test/demo-anxiety-scale")
    assert rq.qst_id == "qst_demo"
    assert rq.scale is None and rq.shared_prompt_text is None
    assert len(rq.items) == 2
    assert rq.items[0].text == "I feel tense"
    o = rq.items[0].option
    assert o.input_data_type == "choice" and o.measurement_type == "ordinal" and o.selection == "single"
    assert o.anchors == ["Never", "Sometimes", "Often"]
    assert o.values == [0.0, 1.0, 2.0]
    assert rq.instruction_text == "Rate each statement."
    assert rq.description == "A short demo scale."

def test_derive_id_leading_acronym_and_fallback():
    u = "https://psychology-tools.com/test/adult-adhd-self-report-scale"
    assert _derive_id("Adult ADHD Self-Report Scale (ASRSv1.1)", u) == "qst_asrs"
    assert _derive_id("Patient Health Questionnaire (PHQ-9)", u) == "qst_phq9"
    assert _derive_id("Generalized Anxiety Disorder (GAD-7)", u) == "qst_gad7"
    # no usable acronym -> full /test/ slug (never the generic 'scale')
    assert _derive_id("Some Long Descriptive Title", u) == "qst_adultadhdselfreportscale"

def test_refuses_no_form():
    with pytest.raises(PsychologyToolsParseError):
        PsychologyToolsAdapter().parse("<html><h1>X (X)</h1><p>no form</p></html>",
                                       "https://psychology-tools.com/test/x")

def test_refuses_no_question_rows():
    with pytest.raises(PsychologyToolsParseError):
        PsychologyToolsAdapter().parse(_page(""), "https://psychology-tools.com/test/x")

def test_refuses_non_numeric_value():
    bad = _row("q1", "stem", [("Never", "x"), ("Often", "1")])
    with pytest.raises(PsychologyToolsParseError):
        PsychologyToolsAdapter().parse(_page(bad), "https://psychology-tools.com/test/x")

def test_refuses_empty_stem():
    bad = _row("q1", "", OPTS3)
    with pytest.raises(PsychologyToolsParseError):
        PsychologyToolsAdapter().parse(_page(bad), "https://psychology-tools.com/test/x")


def _std_row_endpoint_only(name, stem):
    # standard layout, only first+last labelled (middles blank) — endpoint-anchored scale
    opts = [("Not at all", "1"), ("", "2"), ("", "3"), ("", "4"), ("Very much", "5")]
    cells = "".join(
        f'<span class="notable-td response"><label class="aria-label" for="{name}_{i}">{a}</label>'
        f'<input id="{name}_{i}" type="radio" name="{name}" value="{v}"></span>'
        for i, (a, v) in enumerate(opts))
    return (f'<div class="notable-tr question odd">'
            f'<span class="notable-td prompt"><span class="num">{name[1:]}.</span>'
            f'<span>{stem}</span></span>{cells}</div>')

def _alt_row(name, stem, opts):
    lis = "".join(
        f'<li class="response"><input id="{name}_{i}" type="radio" name="{name}" value="{v}">'
        f'<label for="{name}_{i}">{a}</label></li>' for i, (a, v) in enumerate(opts))
    return (f'<li class="question-container"><span class="prompt">{stem}</span>'
            f'<ul class="responses">{lis}</ul></li>')

def _alt_page(rows, *, title="Demo Mania Scale (DMS)"):
    return f'<html><head><meta name="description" content="demo."></head><body><h1>{title}</h1><form>{rows}</form></body></html>'

ALT3 = [("Absent", "0"), ("Mild", "1"), ("Severe", "2")]

def test_standard_endpoint_only_labels_no_refusal():
    html = _page(_std_row_endpoint_only("q1", "I worry about deadlines"))
    rq = PsychologyToolsAdapter().parse(html, "https://psychology-tools.com/test/x")
    o = rq.items[0].option
    assert o.values == [1.0, 2.0, 3.0, 4.0, 5.0]               # all values kept
    assert o.anchors == ["Not at all", "", "", "", "Very much"]  # blanks kept verbatim

def test_alternate_layout_li_question_container():
    html = _alt_page(_alt_row("q1", "Elevated mood", ALT3) + _alt_row("q2", "Increased energy", ALT3))
    rq = PsychologyToolsAdapter().parse(html, "https://psychology-tools.com/test/x")
    assert len(rq.items) == 2
    assert rq.items[0].text == "Elevated mood"
    assert rq.items[0].option.anchors == ["Absent", "Mild", "Severe"]
    assert rq.items[0].option.values == [0.0, 1.0, 2.0]

def test_alternate_stemless_refused():
    # empty span.prompt -> stem-less Beck-style -> refuse (deferred)
    html = _alt_page(_alt_row("q1", "", [("Statement A", "0"), ("Statement B", "1")]))
    with pytest.raises(PsychologyToolsParseError):
        PsychologyToolsAdapter().parse(html, "https://psychology-tools.com/test/x")

def test_no_rows_either_layout_refused():
    html = "<html><h1>X (X)</h1><form><p>nothing</p></form></html>"
    with pytest.raises(PsychologyToolsParseError):
        PsychologyToolsAdapter().parse(html, "https://psychology-tools.com/test/x")
