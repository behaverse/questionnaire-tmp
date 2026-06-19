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


# --- id derivation: a parenthetical is an acronym only when it is a clean
#     ALL-CAPS / digit / hyphen token; otherwise fall back to the URL slug ---

def test_derive_qst_id_acronym_parenthetical():
    from harvester.sources.psytoolkit import derive_qst_id
    assert derive_qst_id("Satisfaction with Life Scale (SWLS)",
                         "https://x/satisfaction-with-life.html") == "qst_swls"
    assert derive_qst_id("Generalized Anxiety Disorder Scale (GAD-7)",
                         "https://x/anxiety-gad7.html") == "qst_gad7"
    assert derive_qst_id("Autism Spectrum Quotient 10 Items (AQ-10)",
                         "https://x/short-autism-spectrum-quotient.html") == "qst_aq10"


def test_derive_qst_id_rejects_nonacronym_parenthetical_uses_url_slug():
    from harvester.sources.psytoolkit import derive_qst_id
    # "(McCroskey)" is a name, not an acronym -> URL slug "mcss"
    assert derive_qst_id("Shyness Scale (McCroskey)",
                         "https://x/shyness-mcss.html") == "qst_mcss"
    # "(Revised Version)" has a space -> URL slug "scsr"
    assert derive_qst_id("Self-Consciousness Scale (Revised Version)",
                         "https://x/self-consciousness-scale-scsr.html") == "qst_scsr"
    # "(for Adolescents)" -> URL slug
    assert derive_qst_id("Aggression Scale (for Adolescents)",
                         "https://x/aggression-adolescents.html") == "qst_adolescents"
    # "(LAS, Short Form)" comma+space -> URL slug
    assert derive_qst_id("Love Attitudes Scale (LAS, Short Form)",
                         "https://x/love-styles-hendrick-sf.html") == "qst_sf"


def test_derive_qst_id_no_parenthetical_uses_url_slug():
    from harvester.sources.psytoolkit import derive_qst_id
    assert derive_qst_id("World Health Organization Well-Being Index",
                         "https://x/who5.html") == "qst_who5"


def test_derive_qst_id_distinguishes_short_form_collision_via_url():
    from harvester.sources.psytoolkit import derive_qst_id
    # two different instruments both titled "(Short Form)" must not collide
    a = derive_qst_id("Edinburgh Handedness Inventory (Short Form)",
                      "https://x/handedness-ehi.html")
    b = derive_qst_id("Love Attitudes Scale (Short Form)",
                      "https://x/love-styles-hendrick-sf.html")
    assert a == "qst_ehi" and b == "qst_sf" and a != b


def test_parse_range_brace_params_and_flags():
    from harvester.sources.psytoolkit import _parse_range_brace
    p = _parse_range_brace("min=1,max=7,left=not happy,right=very happy,start=5,reverse")
    assert p["min"] == "1" and p["max"] == "7"
    assert p["left"] == "not happy" and p["right"] == "very happy"
    assert p["start"] == "5" and p["reverse"] is True


def test_parse_range_block_builds_number_options():
    from harvester.sources.psytoolkit import _parse_range_block
    block = [
        "l: shs",
        "t: range",
        "q: Indicate the point on the scale.",
        "- {min=1,max=7,left=not a very happy person,right=a very happy person} In general, I consider myself:",
        "- {min=1,max=7,left=not at all,right=a great deal,reverse} To what extent does this describe you?",
    ]
    instr, items = _parse_range_block(block)
    assert instr == "Indicate the point on the scale."
    assert len(items) == 2
    assert items[0].text == "In general, I consider myself:"
    assert items[0].option.input_data_type == "number"
    assert items[0].option.measurement_type == "interval"
    assert items[0].option.min == 1.0 and items[0].option.max == 7.0 and items[0].option.step == 1.0
    assert items[0].option.min_label == "not a very happy person"
    assert items[0].option.max_label == "a very happy person"
    assert items[1].reversed is True


def test_parse_range_item_missing_minmax_refused():
    from harvester.sources.psytoolkit import _parse_range_block, PsyToolkitParseError
    with pytest.raises(PsyToolkitParseError):
        _parse_range_block(["l: x", "t: range", "- {left=lo,right=hi} no range here"])


def test_parse_full_range_page_via_public_surface():
    dsl = ("l: shs\nt: range\nq: Indicate the point on the scale.\n"
           "- {min=1,max=7,left=not a very happy person,right=a very happy person} In general, I consider myself:\n")
    html = f"<html><h1>Subjective Happiness Scale (SHS)</h1><pre>{dsl}</pre></html>"
    rq = PsyToolkitAdapter().parse(html, "https://x/happiness-shs.html")
    assert rq.qst_id == "qst_shs"
    assert rq.scale is None
    assert len(rq.items) == 1
    assert rq.items[0].option.max == 7.0


def test_parse_multiradio_block_groups_items_and_scores():
    from harvester.sources.psytoolkit import _parse_multiradio_block
    block = [
        "l: cas",
        "t: multiradio 2",
        "o: random",
        "o: scores 0 1",
        "q: For each pair, choose the one you identify with most.",
        "- A1",
        "- A2",
        "- B1",
        "- B2",
    ]
    prompt, items = _parse_multiradio_block(block)
    assert prompt == "For each pair, choose the one you identify with most."
    assert len(items) == 2
    assert items[0].text is None
    assert items[0].option.input_data_type == "choice"
    assert items[0].option.measurement_type == "ordinal"
    assert items[0].option.anchors == ["A1", "A2"]
    assert items[0].option.values == [0.0, 1.0]
    assert items[0].option.randomize is True
    assert items[1].option.anchors == ["B1", "B2"]


def test_parse_multiradio_positional_values_when_free():
    from harvester.sources.psytoolkit import _parse_multiradio_block
    block = ["l: pmi", "t: multiradio 3", "o: free", "q: Rate yourself.",
             "- low", "- mid", "- high", "- bad", "- ok", "- good"]
    prompt, items = _parse_multiradio_block(block)
    assert len(items) == 2
    assert items[0].option.values == [1.0, 2.0, 3.0]
    assert items[0].option.randomize is False


def test_parse_multiradio_refuses_non_divisible():
    from harvester.sources.psytoolkit import _parse_multiradio_block, PsyToolkitParseError
    with pytest.raises(PsyToolkitParseError):
        _parse_multiradio_block(["l: x", "t: multiradio 2", "q: q", "- a", "- b", "- c"])


def test_parse_multiradio_refuses_scores_length_mismatch():
    from harvester.sources.psytoolkit import _parse_multiradio_block, PsyToolkitParseError
    with pytest.raises(PsyToolkitParseError):
        _parse_multiradio_block(["l: x", "t: multiradio 2", "o: scores 0 1 2", "q: q", "- a", "- b"])


def test_parse_full_multiradio_page_via_public_surface():
    dsl = ("l: npi\nt: multiradio 2\no: random\no: scores 0 1\n"
           "q: For each pair, choose the one you identify with most.\n"
           "- I am modest\n- I am superior\n- I blend in\n- I stand out\n")
    html = f"<html><h1>Narcissism (NPI-16)</h1><pre>{dsl}</pre></html>"
    rq = PsyToolkitAdapter().parse(html, "https://x/narcism-npi16.html")
    assert rq.scale is None
    assert rq.instruction_text is None
    assert rq.shared_prompt_text.startswith("For each pair")
    assert len(rq.items) == 2
    assert rq.items[0].option.randomize is True


def test_parse_refuses_multiple_multiradio_blocks():
    dsl = ("l: a\nt: multiradio 2\no: scores 0 1\nq: q1\n- a\n- b\n\n"
           "l: b\nt: multiradio 2\no: scores 0 1\nq: q2\n- c\n- d\n")
    html = f"<html><h1>Demo (D)</h1><pre>{dsl}</pre></html>"
    from harvester.sources.psytoolkit import PsyToolkitParseError
    with pytest.raises(PsyToolkitParseError):
        PsyToolkitAdapter().parse(html, "https://x/demo.html")


def test_parse_radio_block_stem_and_scored_options():
    from harvester.sources.psytoolkit import _parse_radio_block
    block = [
        "l: epds2",
        "t: radio",
        "q: I have looked forward with enjoyment to things",
        "- {score=0} As much as I ever did",
        "- {score=1} Rather less than I used to",
        "- {score=2} Definitely less than I used to",
        "- {score=3} Hardly at all",
    ]
    item = _parse_radio_block(block)
    assert item.text == "I have looked forward with enjoyment to things"
    assert item.option.input_data_type == "choice"
    assert item.option.measurement_type == "ordinal"
    assert item.option.selection == "single"
    assert item.option.anchors == ["As much as I ever did", "Rather less than I used to",
                                   "Definitely less than I used to", "Hardly at all"]
    assert item.option.values == [0.0, 1.0, 2.0, 3.0]


def test_parse_radio_block_positional_when_no_scores():
    from harvester.sources.psytoolkit import _parse_radio_block
    block = ["l: q1", "t: radio", "q: Rate this", "- low", "- mid", "- high"]
    item = _parse_radio_block(block)
    assert item.option.values == [1.0, 2.0, 3.0]
    assert item.option.anchors == ["low", "mid", "high"]


def test_parse_radio_block_refuses_no_options():
    from harvester.sources.psytoolkit import _parse_radio_block, PsyToolkitParseError
    with pytest.raises(PsyToolkitParseError):
        _parse_radio_block(["l: q1", "t: radio", "q: A question with no options"])


def test_parse_radio_block_refuses_empty_label():
    from harvester.sources.psytoolkit import _parse_radio_block, PsyToolkitParseError
    with pytest.raises(PsyToolkitParseError):
        _parse_radio_block(["l: q1", "t: radio", "q: Q", "- {score=1}", "- {score=2} ok"])


def test_parse_radio_block_refuses_empty_stem():
    from harvester.sources.psytoolkit import _parse_radio_block, PsyToolkitParseError
    with pytest.raises(PsyToolkitParseError):
        _parse_radio_block(["l: q1", "t: radio", "- {score=1} a", "- {score=2} b"])


def test_parse_full_radio_page_via_public_surface():
    dsl = ("l: sq1\nt: radio\nq: I find it easy to use train timetables.\n"
           "- {score=2} strongly agree\n- {score=1} slightly agree\n"
           "- {score=0} slightly disagree\n- {score=0} strongly disagree\n\n"
           "l: sq2\nt: radio\nq: I like clearly organised shops.\n"
           "- {score=2} strongly agree\n- {score=1} slightly agree\n"
           "- {score=0} slightly disagree\n- {score=0} strongly disagree\n")
    html = f"<html><h1>Systemizing Quotient (SQ)</h1><pre>{dsl}</pre></html>"
    rq = PsyToolkitAdapter().parse(html, "https://x/systemizing-arc.html")
    assert rq.scale is None
    assert rq.instruction_text is None
    assert rq.shared_prompt_text is None
    assert len(rq.items) == 2
    assert rq.items[0].text == "I find it easy to use train timetables."
    assert rq.items[0].option.values == [2.0, 1.0, 0.0, 0.0]
    assert rq.items[1].text == "I like clearly organised shops."
