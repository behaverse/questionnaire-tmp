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

def test_number_option_fingerprint_distinguishes_labels_and_range():
    from harvester.dedup import option_fingerprint
    def num(mn, mx, left, right):
        return {"input_data_type": "number", "measurement_type": "interval",
                "dimension": "rating", "min": mn, "max": mx,
                "min_label": left, "max_label": right,
                "content": {"en": {"status": "validated", "label": "x"}}}
    a = num(1, 7, "not happy", "very happy")
    b = num(1, 7, "less happy", "more happy")    # same range, different labels
    c = num(0, 100, "not happy", "very happy")   # same labels, different range
    a2 = num(1, 7, "Not Happy", "Very Happy")    # case-only difference -> same
    assert option_fingerprint(a) != option_fingerprint(b)
    assert option_fingerprint(a) != option_fingerprint(c)
    assert option_fingerprint(a) == option_fingerprint(a2)

def test_choice_fingerprint_distinguishes_randomize_but_keeps_legacy():
    from harvester.dedup import option_fingerprint
    def choice(randomize):
        o = {"input_data_type": "choice", "measurement_type": "ordinal", "selection": "single",
             "options": [{"index": 1, "value": 0}, {"index": 2, "value": 1}],
             "content": {"en": {"status": "validated", "options": [
                 {"index": 1, "text": "a"}, {"index": 2, "text": "b"}]}}}
        if randomize:
            o["randomize"] = True
        return o
    plain = choice(False)
    rand = choice(True)
    assert option_fingerprint(plain) != option_fingerprint(rand)
    # legacy (no randomize key) fingerprint must be unchanged: equals an explicit randomize=False
    plain_false = choice(False); plain_false["randomize"] = False
    assert option_fingerprint(plain) == option_fingerprint(plain_false)
