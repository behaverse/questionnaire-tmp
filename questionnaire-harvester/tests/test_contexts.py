from harvester.contexts import split_temporal_context, resolve_known_context


def test_splits_leading_temporal_frame_and_capitalizes_remainder():
    ctx, instr = split_temporal_context(
        "Over the last 2 weeks, how often have you been bothered by the following problems?")
    assert ctx == "Over the last 2 weeks,"
    assert instr == "How often have you been bothered by the following problems?"


def test_no_temporal_frame_returns_none_and_unchanged():
    ctx, instr = split_temporal_context("How often do you feel this way?")
    assert ctx is None
    assert instr == "How often do you feel this way?"


def test_known_context_matches_digit_and_word_and_last_vs_past():
    # source digit form, Library word form, and last/past all resolve to the same Context
    target = ("ctx_past_2_weeks", "v26.0606")
    assert resolve_known_context("Over the last 2 weeks,") == target
    assert resolve_known_context("Over the last two weeks,") == target
    assert resolve_known_context("Over the past 2 weeks") == target


def test_unknown_temporal_phrase_is_not_resolved():
    assert resolve_known_context("Over the last 3 months,") is None
