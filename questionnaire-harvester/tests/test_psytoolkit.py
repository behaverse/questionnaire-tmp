from pathlib import Path
import pytest
from harvester.sources.psytoolkit import PsyToolkitAdapter

FIXDIR = Path(__file__).parent / "fixtures"
FIX = FIXDIR / "psytoolkit_gad7.html"
URL = "https://us.psytoolkit.org/survey-library/anxiety-gad7.html"


def _parse(fixture, url):
    return PsyToolkitAdapter().parse((FIXDIR / fixture).read_text(), url)


def test_parses_gad7_items_and_scale():
    rq = PsyToolkitAdapter().parse(FIX.read_text(), URL)
    assert rq.qst_id == "qst_gad7"
    assert rq.source_site == "psytoolkit.org"
    assert len(rq.items) == 7
    assert rq.items[0].text.lower().startswith("feeling nervous")
    assert rq.scale.values == [0.0, 1.0, 2.0, 3.0]
    assert rq.scale.anchors == [
        "not at all",
        "several days",
        "more than half the days",
        "nearly every day",
    ]
    assert rq.scale.dimension == "frequency"
    # The leading temporal frame is split off into context_text; the instruction proper
    # is what remains, capitalised.
    assert rq.context_text == "Over the last 2 weeks,"
    assert rq.instruction_text == "How often have you been bothered by the following problems?"
    assert "any of" not in rq.instruction_text.lower()
    assert rq.license.license_class == "unknown"
    assert rq.year == 2006
    assert "Spitzer" in rq.citation


def test_rosenberg_flexible_order_reverse_markers_and_multiline_instruction():
    # Rosenberg block order is l: / o: / q: (multi-line) / t: scale — q comes BEFORE t.
    rq = _parse("psytoolkit_rosenberg.html",
                "https://us.psytoolkit.org/survey-library/self-esteem-rosenberg.html")
    assert rq.qst_id == "qst_rses"                 # slug from "(RSES)" acronym
    assert len(rq.items) == 10
    assert rq.scale.values == [0.0, 1.0, 2.0, 3.0]
    assert rq.scale.anchors[0] == "strongly agree"
    # 5 items are {reverse}-marked; the marker is stripped from the text
    assert sum(1 for it in rq.items if it.reversed) == 5
    assert rq.items[0].reversed is True
    assert rq.items[0].text == "On the whole, I am satisfied with myself."
    assert "{" not in rq.items[0].text
    # multi-line q: joined into one instruction
    assert rq.instruction_text.startswith("Below is a list of statements")
    assert "Select how much" in rq.instruction_text


def test_swls_seven_point_scale_kept_verbatim_and_acronym_slug():
    rq = _parse("psytoolkit_swls.html",
                "https://us.psytoolkit.org/survey-library/satisfaction-with-life.html")
    assert rq.qst_id == "qst_swls"                 # not "qst_life" (URL last segment)
    assert len(rq.items) == 5
    assert rq.scale.values == [7.0, 6.0, 5.0, 4.0, 3.0, 2.0, 1.0]
    assert rq.scale.anchors[0] == "Strongly agree"   # title-case preserved verbatim
    assert rq.year == 1985


def test_who5_url_slug_fallback_and_six_point_scale():
    rq = _parse("psytoolkit_who5.html",
                "https://us.psytoolkit.org/survey-library/who5.html")
    assert rq.qst_id == "qst_who5"                 # title has no parens -> URL slug
    assert len(rq.items) == 5
    assert len(rq.scale.anchors) == 6
    assert rq.scale.values == [5.0, 4.0, 3.0, 2.0, 1.0, 0.0]


def test_scale_without_scores_uses_1based_position():
    # PsyToolkit default: anchors without {score=N} are scored by 1-based position.
    from harvester.sources.psytoolkit import _parse_scale
    name, anchors, values = _parse_scale(
        "scale: agree\n- strongly disagree\n- disagree\n- neutral\n- agree\n- strongly agree\n")
    assert name == "agree"
    assert anchors == ["strongly disagree", "disagree", "neutral", "agree", "strongly agree"]
    assert values == [1.0, 2.0, 3.0, 4.0, 5.0]


def test_scale_with_explicit_scores_overrides_position():
    from harvester.sources.psytoolkit import _parse_scale
    _, anchors, values = _parse_scale(
        "scale: f\n- {score=0} never\n- {score=1} sometimes\n- {score=2} always\n")
    assert values == [0.0, 1.0, 2.0]
    assert anchors == ["never", "sometimes", "always"]


def test_multiple_distinct_scales_refused():
    # two different scales used by two question blocks -> can't be one single-scale qst
    from harvester.sources.psytoolkit import PsyToolkitParseError, _blocks
    import re
    dsl = ("scale: a\n- {score=1} lo\n- {score=2} hi\n\n"
           "scale: b\n- {score=1} no\n- {score=2} yes\n\n"
           "l: one\nt: scale a\nq: q1\n- item a1\n\n"
           "l: two\nt: scale b\nq: q2\n- item b1\n")
    used = []
    for b in _blocks(dsl):
        for ln in b:
            m = re.match(r"^t:\s*scale\s+(\S+)", ln)
            if m and m.group(1) not in used:
                used.append(m.group(1))
    assert used == ["a", "b"]            # the parse() guard raises on len(used) > 1


def test_same_scale_split_across_blocks_merges_items():
    # one scale used by two blocks (multi-page) -> items merge, not truncate
    from harvester.sources.psytoolkit import _blocks, _parse_block
    dsl = ("l: p1\nt: scale a\nq: rate\n- item one\n- item two\n\n"
           "l: p2\nt: scale a\n- item three\n")
    items = []
    for b in _blocks(dsl):
        if any(ln.startswith("t: scale a") for ln in b):
            _, its = _parse_block(b)
            items.extend(its)
    assert [it.text for it in items] == ["item one", "item two", "item three"]


def test_parse_refuses_multiscale_page_via_public_surface():
    dsl = ("scale: a\n- {score=1} lo\n- {score=2} hi\n\n"
           "scale: b\n- {score=1} no\n- {score=2} yes\n\n"
           "l: one\nt: scale a\nq: q1\n- item a1\n\n"
           "l: two\nt: scale b\nq: q2\n- item b1\n")
    html = f"<html><h1>Demo (DEMO)</h1><pre>{dsl}</pre></html>"
    from harvester.sources.psytoolkit import PsyToolkitParseError
    with pytest.raises(PsyToolkitParseError):
        PsyToolkitAdapter().parse(html, "https://x/demo.html")


def test_parse_scale_refuses_labelless_numeric_scale():
    from harvester.sources.psytoolkit import PsyToolkitParseError, _parse_scale
    with pytest.raises(PsyToolkitParseError):
        _parse_scale("scale: frequency\n- {score=4}\n- {score=3}\n- {score=0}\n")
