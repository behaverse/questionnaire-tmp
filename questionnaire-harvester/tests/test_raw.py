from harvester.raw import RawQuestionnaire, RawScale, RawItem
from harvester.licensing import LicenseFlag

def _sample():
    return RawQuestionnaire(
        qst_id="qst_gad7", title="GAD-7", short_title="GAD-7", description="7-item anxiety screener.",
        citation="Spitzer RL et al (2006).", year=2006, source_site="psytoolkit.org",
        source_url="https://us.psytoolkit.org/survey-library/anxiety-gad7.html",
        instruction_text="Over the last 2 weeks, how often have you been bothered by the following problems?",
        scale={"input_data_type": "choice", "measurement_type": "ordinal", "selection": "single",
               "dimension": "frequency", "anchors": ["Not at all", "Several days", "More than half the days", "Nearly every day"],
               "values": [0.0, 1.0, 2.0, 3.0]},
        items=[{"text": "Feeling nervous, anxious, or on edge"}],
        license=LicenseFlag.unknown("https://us.psytoolkit.org/survey-library/anxiety-gad7.html"),
        domain=["anxiety"], population=["adults"])

def test_raw_roundtrips_through_dict():
    rq = _sample()
    assert RawQuestionnaire.from_dict(rq.to_dict()).qst_id == "qst_gad7"
    assert RawQuestionnaire.from_dict(rq.to_dict()).items[0].text.startswith("Feeling nervous")

    # Verify that __post_init__ re-coerces nested dicts back to their dataclass types
    result = RawQuestionnaire.from_dict(rq.to_dict())
    assert isinstance(result.scale, RawScale)
    assert isinstance(result.items[0], RawItem)
    assert isinstance(result.license, LicenseFlag)

    # Idempotency: re-constructing from an already-typed object must not crash and stays typed
    result2 = RawQuestionnaire.from_dict(result.to_dict())
    assert isinstance(result2.scale, RawScale)
