import pytest
from harvester.sources.psychology_tools import (
    PsychologyToolsAdapter, PsychologyToolsParseError, _derive_id, _sanitize_dimension)

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

def test_empty_stem_with_instruction_uses_shared_prompt():
    # standard-layout row with an empty stem + an Instructions paragraph -> shared prompt
    rq = PsychologyToolsAdapter().parse(_page(_row("q1", "", OPTS3)),
                                        "https://psychology-tools.com/test/x")
    assert rq.shared_prompt_text == "Rate each statement."
    assert rq.instruction_text is None
    assert rq.items[0].text is None
    assert rq.items[0].option.anchors == ["Never", "Sometimes", "Often"]


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

def test_alternate_stemless_no_instruction_refused():
    # empty span.prompt + no instruction paragraph -> refused (no shared prompt source)
    html = _alt_page(_alt_row("q1", "", [("Statement A", "0"), ("Statement B", "1")]))
    with pytest.raises(PsychologyToolsParseError):
        PsychologyToolsAdapter().parse(html, "https://psychology-tools.com/test/x")

def test_no_rows_either_layout_refused():
    html = "<html><h1>X (X)</h1><form><p>nothing</p></form></html>"
    with pytest.raises(PsychologyToolsParseError):
        PsychologyToolsAdapter().parse(html, "https://psychology-tools.com/test/x")


def _page_with_sources(li_html):
    return (f'<html><body><h1>Demo Scale (DEMO)</h1>'
            f'<form>{_row("q1", "An item", OPTS3)}</form>'
            f'<h6>Sources</h6><ol class="sources">{li_html}</ol></body></html>')

def test_extracts_structured_reference_and_year():
    li = ('<li class="source"><span class="authors">C Allison , S Baron-Cohen</span> . '
          'Some Title . <time class="publication-date" datetime="2008">2008</time> .</li>')
    rq = PsychologyToolsAdapter().parse(_page_with_sources(li), "https://psychology-tools.com/test/x")
    assert rq.year == 2008
    assert len(rq.references) == 1
    assert "Allison, S Baron-Cohen" in rq.references[0]   # space-before-comma tidied
    assert " ." not in rq.references[0]                    # space-before-period tidied
    assert rq.citation == rq.references[0]

def test_two_sources_primary_publication_all_in_references():
    li = ('<li class="source"><span>First A</span> . '
          '<time class="publication-date" datetime="1959">1959</time> .</li>'
          '<li class="source"><span>Second B</span> . '
          '<time class="publication-date" datetime="1970">1970</time> .</li>')
    rq = PsychologyToolsAdapter().parse(_page_with_sources(li), "https://psychology-tools.com/test/x")
    assert len(rq.references) == 2
    assert rq.year == 1959                 # year from the first source
    assert rq.citation == rq.references[0]

def test_no_sources_section_yields_no_citation():
    html = ('<html><body><h1>Demo Scale (DEMO)</h1>'
            f'<form>{_row("q1", "An item", OPTS3)}</form></body></html>')
    rq = PsychologyToolsAdapter().parse(html, "https://psychology-tools.com/test/x")
    assert rq.citation == "" and rq.year is None and rq.references == []


def test_page_range_does_not_leak_as_year():
    """Regression: citation text '252(14): 1905-7' must not produce year=1905.
    The <time> element carries the real year (1984); only that is trusted."""
    li = ('<li class="source"><span class="authors">JA Ewing</span> . '
          'Detecting Alcoholism. The CAGE Questionnaire. 252(14): 1905-7 . '
          '<time class="publication-date" datetime="1984">1984</time> .</li>')
    rq = PsychologyToolsAdapter().parse(_page_with_sources(li), "https://psychology-tools.com/test/x")
    assert rq.year == 1984, f"expected 1984, got {rq.year}"
    assert "1905" not in str(rq.year)


def test_no_time_element_yields_no_year_but_keeps_citation():
    """When li.source has a page-range/copyright year in its text but no <time>,
    year must be None. citation and references must still be populated."""
    li = ('<li class="source"><span class="authors">JA Ewing</span> . '
          'Detecting Alcoholism. The CAGE Questionnaire. 252(14): 1905-7 . '
          'The Journal of the American Medical Association. 1984 .</li>')
    rq = PsychologyToolsAdapter().parse(_page_with_sources(li), "https://psychology-tools.com/test/x")
    assert rq.year is None, f"expected None, got {rq.year}"
    assert rq.citation != "", "citation must still be populated"
    assert len(rq.references) > 0, "references must be non-empty"


def test_classless_time_element_read_not_page_range():
    """A <time> with NO publication-date class must still be read.
    The page-range text '38(8): 1414-1425 (2008)' must not be used;
    year must come from the <time datetime='2008-9-01'>."""
    li = ('<li class="source"><span class="authors">C Allison , S Baron-Cohen</span> . '
          'The Q-CHAT. J Child Psychol Psychiatry 38(8): 1414-1425 (2008) . '
          '<time datetime="2008-9-01">2008</time> .</li>')
    rq = PsychologyToolsAdapter().parse(_page_with_sources(li), "https://psychology-tools.com/test/x")
    assert rq.year == 2008, f"expected 2008, got {rq.year}"


def test_page_range_with_classless_time_not_confused():
    """Page range '1905-7' in text plus <time datetime='1984'> (no class) -> year==1984,
    not 1905 from the page range."""
    li = ('<li class="source"><span class="authors">JA Ewing</span> . '
          'Detecting Alcoholism. The CAGE Questionnaire. 252(14): 1905-7 . '
          '<time datetime="1984">1984</time> .</li>')
    rq = PsychologyToolsAdapter().parse(_page_with_sources(li), "https://psychology-tools.com/test/x")
    assert rq.year == 1984, f"expected 1984, got {rq.year}"
    assert "1905" not in str(rq.year)


def test_no_time_element_year_none_citation_and_refs_populated():
    """When li.source has no <time> element at all: year must be None,
    citation must be non-empty, and references must be non-empty."""
    li = ('<li class="source"><span class="authors">RL Connor , DW Davidson</span> . '
          'Development of a new resilience scale: the SPIN. '
          'J Soc Clin Psychol 19(3): 119-132 .</li>')
    rq = PsychologyToolsAdapter().parse(_page_with_sources(li), "https://psychology-tools.com/test/x")
    assert rq.year is None, f"expected None, got {rq.year}"
    assert rq.citation != "", "citation must still be populated"
    assert len(rq.references) > 0, "references must be non-empty"


def _alt_page_instr(rows, *, instr="Instructions Below are groups of statements.",
                    title="Demo Eating Scale (DES)"):
    p = f"<p>{instr}</p>" if instr else ""
    return (f'<html><head><meta name="description" content="A demo scale."></head>'
            f'<body><h1>{title}</h1>{p}<form>{rows}</form></body></html>')

def test_stemless_alt_uses_instruction_as_shared_prompt():
    rows = (_alt_row("q1", "", [("A1", "0"), ("A2", "1")])
            + _alt_row("q2", "", [("B1", "0"), ("B2", "1")]))
    rq = PsychologyToolsAdapter().parse(_alt_page_instr(rows), "https://psychology-tools.com/test/x")
    assert rq.shared_prompt_text == "Below are groups of statements."
    assert rq.instruction_text is None
    assert all(it.text is None for it in rq.items)
    assert rq.items[0].option.anchors == ["A1", "A2"]      # each item keeps its own distinct option-set
    assert rq.items[1].option.anchors == ["B1", "B2"]
    assert rq.items[0].option.values == [0.0, 1.0]

def test_stemless_no_instruction_refused():
    rows = _alt_row("q1", "", OPTS3)
    with pytest.raises(PsychologyToolsParseError):
        PsychologyToolsAdapter().parse(_alt_page_instr(rows, instr=""),
                                       "https://psychology-tools.com/test/x")

def test_mixed_stem_and_stemless_refused():
    rows = _alt_row("q1", "Has a stem", OPTS3) + _alt_row("q2", "", OPTS3)
    with pytest.raises(PsychologyToolsParseError):
        PsychologyToolsAdapter().parse(_alt_page_instr(rows), "https://psychology-tools.com/test/x")

def test_all_stem_alt_page_unchanged_no_shared_prompt():
    rows = _alt_row("q1", "Real stem one", OPTS3) + _alt_row("q2", "Real stem two", OPTS3)
    rq = PsychologyToolsAdapter().parse(_alt_page_instr(rows), "https://psychology-tools.com/test/x")
    assert rq.shared_prompt_text is None
    assert rq.items[0].text == "Real stem one" and rq.items[1].text == "Real stem two"


# ---------------------------------------------------------------------------
# Dimension-table (Liebowitz-style) tests
# ---------------------------------------------------------------------------

def _dim_table(dims, anchor_groups, rows, *, title="Demo Two-Dim (DTD)"):
    """dims: [(name, span), ...]; anchor_groups: parallel list of anchor-label lists;
    rows: [(stem, [values...]), ...]. Builds a two-super-header table page."""
    h1 = "<tr><td></td>" + "".join(f'<th colspan="{s}">{n}</th>' for n, s in dims) + "</tr>"
    h2 = "<tr><td></td>" + "".join(f"<th>{a}</th>" for grp in anchor_groups for a in grp) + "</tr>"
    body = ""
    for stem, vals in rows:
        cells = "".join(f'<td><input type="radio" name="x{i}" value="{v}"></td>'
                        for i, v in enumerate(vals))
        body += f"<tr><td>{stem}</td>{cells}</tr>"
    return (f'<html><head><meta name="description" content="demo."></head>'
            f"<body><h1>{title}</h1><form><table>{h1}{h2}{body}</table></form></body></html>")

_DIMS = [("Fear", 2), ("Avoidance", 2)]
_FA = [["None", "Mild"], ["Never", "Often"]]

def test_dimension_table_flattens_per_dimension_interleaved():
    rows = [("Telephoning", [0, 1, 0, 1]), ("Parties", [2, 3, 2, 3])]
    rq = PsychologyToolsAdapter().parse(_dim_table(_DIMS, _FA, rows),
                                        "https://psychology-tools.com/test/x")
    assert len(rq.items) == 4
    assert rq.shared_prompt_text is None
    assert [i.text for i in rq.items] == ["Telephoning", "Telephoning", "Parties", "Parties"]
    assert [i.option.dimension for i in rq.items] == ["fear", "avoidance", "fear", "avoidance"]
    assert rq.items[0].option.anchors == ["None", "Mild"] and rq.items[0].option.values == [0.0, 1.0]
    assert rq.items[1].option.anchors == ["Never", "Often"] and rq.items[1].option.values == [0.0, 1.0]
    assert rq.items[2].option.values == [2.0, 3.0]

def test_dimension_table_strips_leading_item_number():
    rq = PsychologyToolsAdapter().parse(_dim_table(_DIMS, _FA, [("1. Telephoning", [0, 1, 0, 1])]),
                                        "https://psychology-tools.com/test/x")
    assert rq.items[0].text == "Telephoning"

def test_sanitize_dimension():
    assert _sanitize_dimension("Fear") == "fear"
    assert _sanitize_dimension("Avoidance") == "avoidance"
    with pytest.raises(PsychologyToolsParseError):
        _sanitize_dimension("!")     # sanitizes to "" -> invalid
    with pytest.raises(PsychologyToolsParseError):
        _sanitize_dimension("3D")    # leading digit -> invalid

def test_dimension_table_radio_count_mismatch_refused():
    with pytest.raises(PsychologyToolsParseError):
        PsychologyToolsAdapter().parse(_dim_table(_DIMS, _FA, [("stem", [0, 1, 0])]),
                                       "https://psychology-tools.com/test/x")

def test_dimension_table_non_numeric_value_refused():
    html = _dim_table(_DIMS, _FA, [("stem", [0, 1, 0, 1])]).replace('value="1"', 'value="x"', 1)
    with pytest.raises(PsychologyToolsParseError):
        PsychologyToolsAdapter().parse(html, "https://psychology-tools.com/test/x")

def test_standard_page_unaffected_by_dimension_branch():
    # a non-table standard page still routes to _extract_items
    rq = PsychologyToolsAdapter().parse(_page(_row("q1", "I feel tense", OPTS3)),
                                        "https://psychology-tools.com/test/x")
    assert len(rq.items) == 1 and rq.items[0].text == "I feel tense"
