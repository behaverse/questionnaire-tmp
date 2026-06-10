from denormaliser.expressions import extract_score_refs

DECLARED = {"phq9_total", "phq9_severity", "gad7_total"}


def test_matches_score_call():
    assert extract_score_refs('score("phq9_total") >= 10', DECLARED) == {"phq9_total"}


def test_matches_single_quoted_call():
    assert extract_score_refs("score('gad7_total') > 5", DECLARED) == {"gad7_total"}


def test_matches_bare_token_conservatively():
    # Any whole-word mention of a declared id counts (OD-18e conservative parse).
    assert extract_score_refs("phq9_severity == 'severe'", DECLARED) == {"phq9_severity"}


def test_does_not_match_substring_of_other_token():
    # 'phq9_total' must not match inside 'phq9_total_extra'
    assert extract_score_refs("phq9_total_extra > 1", DECLARED) == set()


def test_only_returns_declared_ids():
    assert extract_score_refs('score("undeclared_score") > 1', DECLARED) == set()


def test_empty_or_none_expression():
    assert extract_score_refs("", DECLARED) == set()
    assert extract_score_refs(None, DECLARED) == set()


def test_multiple_refs_in_one_expression():
    expr = 'score("phq9_total") >= 10 and phq9_severity != "minimal"'
    assert extract_score_refs(expr, DECLARED) == {"phq9_total", "phq9_severity"}
