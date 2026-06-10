from denormaliser.context import Ctx
from denormaliser.policy import RuntimePolicy
from denormaliser.resolve import resolve_refs


def make_ctx(store):
    return Ctx(
        locale="en",
        runtime_policy=RuntimePolicy(scorer_impl_preference=["wasm"]),
        viewer_manifest={},
        resolve_entity=lambda ref: store.get(ref),
    )


def test_inlines_a_simple_ref():
    store = {"pr_x@v26.0602": {"id": "pr_x", "content": {"en": {"status": "validated", "text": "Hi"}}}}
    ctx = make_ctx(store)
    doc = {"prompt": {"ref": "pr_x@v26.0602"}}
    out = resolve_refs(doc, ctx)
    assert out == {"prompt": {"id": "pr_x", "content": {"en": {"status": "validated", "text": "Hi"}}}}
    assert ctx.problems == []


def test_sibling_keys_win_over_entity_body():
    store = {"it_x@v26.0602": {"id": "it_x", "required": False, "question": {"prompt": {"ref": "pr_x@v26.0602"}}},
             "pr_x@v26.0602": {"id": "pr_x", "content": {"en": {"status": "validated", "text": "Q"}}}}
    ctx = make_ctx(store)
    doc = {"ref": "it_x@v26.0602", "required": True}
    out = resolve_refs(doc, ctx)
    assert out["required"] is True            # sibling wins
    assert "ref" not in out                   # ref key dropped after resolution
    assert out["question"]["prompt"]["content"]["en"]["text"] == "Q"  # nested ref resolved


def test_unresolved_ref_records_problem_and_keeps_node():
    ctx = make_ctx({})
    doc = {"prompt": {"ref": "pr_missing@v26.0602"}}
    out = resolve_refs(doc, ctx)
    assert len(ctx.problems) == 1
    assert ctx.problems[0].kind == "unresolved_ref"
    assert ctx.problems[0].where == "pr_missing@v26.0602"
    # node is left structurally intact (ref kept) so other passes can continue
    assert out["prompt"]["ref"] == "pr_missing@v26.0602"


def test_collects_all_unresolved_refs():
    ctx = make_ctx({})
    doc = {"a": {"ref": "pr_1@v26.0602"}, "b": [{"ref": "pr_2@v26.0602"}]}
    resolve_refs(doc, ctx)
    wheres = {p.where for p in ctx.problems}
    assert wheres == {"pr_1@v26.0602", "pr_2@v26.0602"}


def test_non_ref_dicts_pass_through():
    ctx = make_ctx({})
    doc = {"option": {"input_data_type": "choice", "options": [{"index": 1, "value": 0}]}}
    assert resolve_refs(doc, ctx) == doc
