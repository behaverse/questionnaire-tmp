from library.importers.survey_db import mappers

def test_map_choice_option_groups_rows():
    rows = [
        {"option_id": "agreement_3", "dimension": "agreement", "input_data_type": "choice",
         "measurement_type": "ordinal", "index": 1, "value": 0, "text_en": "disagree", "text_fr": "pas d'accord"},
        {"option_id": "agreement_3", "dimension": "agreement", "input_data_type": "choice",
         "measurement_type": "ordinal", "index": 2, "value": 1, "text_en": "neutral", "text_fr": "neutre"},
        {"option_id": "agreement_3", "dimension": "agreement", "input_data_type": "choice",
         "measurement_type": "ordinal", "index": 3, "value": 2, "text_en": "agree", "text_fr": "d'accord"},
    ]
    out = mappers.map_option("agreement_3", rows)
    assert out["id"] == "opt_agreement_3"
    assert out["input_data_type"] == "choice" and out["measurement_type"] == "ordinal"
    assert out["selection"] == "single"
    assert out["options"] == [{"index": 1, "value": 0}, {"index": 2, "value": 1}, {"index": 3, "value": 2}]
    assert out["content"]["en"]["options"] == [
        {"index": 1, "text": "disagree"}, {"index": 2, "text": "neutral"}, {"index": 3, "text": "agree"}]
    assert "fr" in out["content"]

def test_map_number_option_has_no_choices():
    rows = [{"option_id": "hours", "dimension": "duration", "input_data_type": "number",
             "measurement_type": "ratio", "index": None, "value": None, "min_value": 0, "max_value": 168,
             "step": 1, "units": "h/week", "text_en": None}]
    out = mappers.map_option("hours", rows)
    assert out["input_data_type"] == "number" and "options" not in out
    assert out["min"] == 0 and out["max"] == 168 and out["step"] == 1
    assert out["content"]["en"]["units"] == "h/week"

def test_map_option_refs_placeholder_help_regex():
    rows = [{"option_id": "yr", "dimension": None, "input_data_type": "text", "measurement_type": "interval",
             "index": None, "value": None, "placeholder_id": "year_yyyy", "help_id": "year_help",
             "input_validation": "year_4digit", "text_en": None}]
    out = mappers.map_option("yr", rows)
    assert out["placeholder"]["ref"].startswith("ph_year_yyyy@")
    assert out["help"]["ref"].startswith("help_year_help@")
    assert out["input_validation"]["ref"].startswith("rx_year_4digit@")
