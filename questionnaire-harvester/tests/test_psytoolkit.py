from pathlib import Path
from harvester.sources.psytoolkit import PsyToolkitAdapter

FIX = Path(__file__).parent / "fixtures" / "psytoolkit_gad7.html"
URL = "https://us.psytoolkit.org/survey-library/anxiety-gad7.html"


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
    assert rq.instruction_text.lower().startswith("over the last 2 weeks")
    assert "the following problems" in rq.instruction_text.lower()
    assert "any of" not in rq.instruction_text.lower()
    assert rq.license.license_class == "unknown"
    assert rq.year == 2006
    assert "Spitzer" in rq.citation
