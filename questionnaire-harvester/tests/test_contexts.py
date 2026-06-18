from harvester.contexts import split_temporal_context


def test_splits_leading_temporal_frame_and_capitalizes_remainder():
    ctx, instr = split_temporal_context(
        "Over the last 2 weeks, how often have you been bothered by the following problems?")
    assert ctx == "Over the last 2 weeks,"
    assert instr == "How often have you been bothered by the following problems?"


def test_temporal_frame_kept_verbatim_not_normalized():
    # faithfulness: "2" stays "2" (no folding to "two"); "last" stays "last"
    ctx, _ = split_temporal_context("Over the last 2 weeks, rate each item.")
    assert ctx == "Over the last 2 weeks,"
    assert "two" not in ctx


def test_no_temporal_frame_returns_none_and_unchanged():
    ctx, instr = split_temporal_context("How often do you feel this way?")
    assert ctx is None
    assert instr == "How often do you feel this way?"
