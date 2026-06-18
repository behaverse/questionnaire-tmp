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


def test_raw_questionnaire_supports_per_item_number_option():
    from harvester.raw import RawQuestionnaire, RawOption
    from harvester.licensing import LicenseFlag
    rq = RawQuestionnaire(
        qst_id="qst_shs", title="SHS", short_title="SHS", description="",
        citation="", year=None, source_site="psytoolkit.org", source_url="https://x/shs.html",
        instruction_text="Indicate the point on the scale.", scale=None,
        items=[{"text": "In general, I consider myself:",
                "option": {"input_data_type": "number", "measurement_type": "interval",
                           "dimension": "rating", "min": 1.0, "max": 7.0, "step": 1.0,
                           "min_label": "not a very happy person", "max_label": "a very happy person",
                           "initial_value": 5.0}}],
        license=LicenseFlag.unknown("https://x/shs.html"))
    assert rq.scale is None
    assert isinstance(rq.items[0].option, RawOption)
    assert rq.items[0].option.max == 7.0
    assert rq.items[0].option.min_label == "not a very happy person"

def test_raw_supports_shared_prompt_and_option_randomize():
    from harvester.raw import RawQuestionnaire, RawOption, RawItem
    from harvester.licensing import LicenseFlag
    rq = RawQuestionnaire(
        qst_id="qst_npi", title="NPI", short_title="NPI", description="",
        citation="", year=None, source_site="psytoolkit.org", source_url="https://x/npi.html",
        instruction_text=None, scale=None,
        shared_prompt_text="For each pair, choose the one you identify with most.",
        items=[{"text": None,
                "option": {"input_data_type": "choice", "measurement_type": "ordinal",
                           "selection": "single", "dimension": "rating",
                           "anchors": ["A", "B"], "values": [0.0, 1.0], "randomize": True}}],
        license=LicenseFlag.unknown("https://x/npi.html"))
    assert rq.shared_prompt_text.startswith("For each pair")
    assert rq.items[0].text is None
    assert isinstance(rq.items[0].option, RawOption)
    assert rq.items[0].option.randomize is True
