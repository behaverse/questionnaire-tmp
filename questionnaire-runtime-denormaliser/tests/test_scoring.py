from denormaliser.context import Ctx
from denormaliser.policy import RuntimePolicy
from denormaliser.scoring import strip_scores


def make_ctx(show_score=False, disable=False):
    return Ctx(
        locale="en",
        runtime_policy=RuntimePolicy(
            scorer_impl_preference=["wasm"], show_score=show_score, disable_in_session_scoring=disable
        ),
        viewer_manifest={},
        resolve_entity=lambda ref: None,
    )


def _doc():
    return {
        "scores": [
            {"id": "total", "scorer": "scr_x@v26.0602", "path": "/total"},
            {"id": "display_only", "scorer": "scr_y@v26.0602", "path": "/extra"},
        ],
        "logic": [
            {"id": "branch_on_total", "type": "branch", "condition": 'score("total") >= 10', "action": {"skip_to": "page_end"}},
        ],
    }


def test_show_score_true_keeps_all():
    ctx = make_ctx(show_score=True)
    doc = _doc()
    strip_scores(doc, ctx)
    assert {s["id"] for s in doc["scores"]} == {"total", "display_only"}
    assert ctx.stripped_scorer_refs == []


def test_show_score_false_keeps_only_branching_required():
    ctx = make_ctx(show_score=False)
    doc = _doc()
    strip_scores(doc, ctx)
    assert {s["id"] for s in doc["scores"]} == {"total"}        # branching-required kept
    assert ctx.stripped_scorer_refs == ["scr_y@v26.0602"]      # display-only stripped
    assert len(doc["logic"]) == 1                               # logic untouched here


def test_disable_in_session_scoring_strips_everything():
    ctx = make_ctx(disable=True)
    doc = _doc()
    strip_scores(doc, ctx)
    assert doc["scores"] == []
    assert doc["logic"] == []                                   # score-dependent rule removed
    assert sorted(ctx.stripped_scorer_refs) == ["scr_x@v26.0602", "scr_y@v26.0602"]
    assert ctx.stripped_logic_rule_ids == ["branch_on_total"]


def test_disable_keeps_logic_rules_without_score_deps():
    ctx = make_ctx(disable=True)
    doc = _doc()
    doc["logic"].append({"id": "skip_plain", "type": "skip", "condition": "answered(it_1)", "action": {"skip_to": "p2"}})
    strip_scores(doc, ctx)
    assert [r["id"] for r in doc["logic"]] == ["skip_plain"]
    assert ctx.stripped_logic_rule_ids == ["branch_on_total"]


def test_no_scores_key_is_noop():
    ctx = make_ctx(show_score=False)
    doc = {"pages": []}
    strip_scores(doc, ctx)
    assert ctx.stripped_scorer_refs == []
