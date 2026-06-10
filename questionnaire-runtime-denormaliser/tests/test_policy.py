import pytest

from denormaliser.errors import Problem, PreflightError
from denormaliser.policy import RuntimePolicy


def test_runtime_policy_defaults():
    p = RuntimePolicy(scorer_impl_preference=["wasm"])
    assert p.show_score is False
    assert p.disable_in_session_scoring is False
    assert p.pre_fetch_all_locales is False


def test_runtime_policy_canonical_dict_is_stable():
    p = RuntimePolicy(scorer_impl_preference=["wasm", "http"], show_score=True)
    d = p.to_canonical_dict()
    assert d == {
        "scorer_impl_preference": ["wasm", "http"],
        "show_score": True,
        "lock_show_score_timing": False,
        "show_score_live": False,
        "pre_fetch_all_locales": False,
        "disable_in_session_scoring": False,
    }


def test_preflight_error_carries_problems():
    problems = [Problem(kind="missing_locale", detail="no pt", where="pr_x")]
    err = PreflightError(problems)
    assert err.problems == problems
    assert "missing_locale" in str(err)
    assert "pr_x" in str(err)
