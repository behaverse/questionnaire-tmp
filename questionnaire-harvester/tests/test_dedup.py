from harvester.dedup import option_fingerprint, lookup_option

PHQ_FREQ = {
    "input_data_type": "choice", "measurement_type": "ordinal", "selection": "single",
    "dimension": "frequency",
    "options": [{"index": i, "value": float(i - 1)} for i in range(1, 5)],
    "content": {"en": {"options": [
        {"index": 1, "text": "Not at all"}, {"index": 2, "text": "Several days"},
        {"index": 3, "text": "More than half the days"}, {"index": 4, "text": "Nearly every day"}]}},
}

def test_fingerprint_is_stable_and_case_insensitive():
    a = option_fingerprint(PHQ_FREQ)
    upper = {**PHQ_FREQ, "content": {"en": {"options": [
        {"index": o["index"], "text": o["text"].upper()} for o in PHQ_FREQ["content"]["en"]["options"]]}}}
    assert option_fingerprint(upper) == a  # norm() folds case

def test_lookup_reuses_existing_id():
    index = {option_fingerprint(PHQ_FREQ): ["opt_phq_frequency_4"]}
    assert lookup_option(PHQ_FREQ, index) == "opt_phq_frequency_4"

def test_lookup_returns_none_for_unknown_scale():
    other = {**PHQ_FREQ, "options": [{"index": 1, "value": 0.0}, {"index": 2, "value": 1.0}],
             "content": {"en": {"options": [{"index": 1, "text": "No"}, {"index": 2, "text": "Yes"}]}}}
    assert lookup_option(other, {option_fingerprint(PHQ_FREQ): ["opt_phq_frequency_4"]}) is None

from harvester.dedup import instruction_fingerprint, lookup_instruction

INS = {"content": {"en": {"text": "Over the last 2 weeks, how often have you been bothered?"}}}

def test_instruction_dedup_is_case_and_space_insensitive():
    a = instruction_fingerprint(INS)
    b = instruction_fingerprint({"content": {"en": {"text": "  Over the LAST 2 weeks, how often   have you been bothered? "}}})
    assert a == b
    assert lookup_instruction(INS, {a: ["ins_phq_2weeks"]}) == "ins_phq_2weeks"
