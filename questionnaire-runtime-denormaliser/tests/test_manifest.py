from denormaliser.context import Ctx
from denormaliser.manifest import reconcile_manifest, _widget_triple
from denormaliser.policy import RuntimePolicy


def make_ctx(manifest):
    return Ctx(
        locale="en",
        runtime_policy=RuntimePolicy(scorer_impl_preference=["wasm"]),
        viewer_manifest=manifest,
        resolve_entity=lambda ref: None,
    )


def _doc_with_option(option):
    return {"pages": [{"id": "page_1", "elements": [{"id": "it_1", "option": option}]}]}


def test_supported_widget_passes():
    ctx = make_ctx({"widgets": ["choice.ordinal.single"]})
    doc = _doc_with_option({"input_data_type": "choice", "measurement_type": "ordinal", "selection": "single"})
    reconcile_manifest(doc, ctx)
    assert ctx.problems == []


def test_unsupported_widget_errors():
    ctx = make_ctx({"widgets": ["choice.nominal.single"]})
    doc = _doc_with_option({"input_data_type": "choice", "measurement_type": "ordinal", "selection": "single"})
    reconcile_manifest(doc, ctx)
    assert [p.kind for p in ctx.problems] == ["unsupported_widget"]
    assert "choice.ordinal.single" in ctx.problems[0].detail


def test_widget_check_skipped_when_manifest_has_no_widgets():
    ctx = make_ctx({})
    doc = _doc_with_option({"input_data_type": "choice", "measurement_type": "ordinal", "selection": "single"})
    reconcile_manifest(doc, ctx)
    assert ctx.problems == []


def test_missing_selection_defaults_to_single():
    ctx = make_ctx({"widgets": ["number.interval"]})
    doc = _doc_with_option({"input_data_type": "number", "measurement_type": "interval"})
    reconcile_manifest(doc, ctx)
    assert ctx.problems == []


def test_unsupported_logic_action_errors():
    ctx = make_ctx({"logic_actions": ["skip", "visibility"]})
    doc = {"pages": [], "logic": [{"id": "r1", "type": "branch", "condition": "x", "action": {}}]}
    reconcile_manifest(doc, ctx)
    assert [p.kind for p in ctx.problems] == ["unsupported_logic_action"]
    assert ctx.problems[0].where == "r1"


def test_supported_logic_action_passes():
    ctx = make_ctx({"logic_actions": ["skip"]})
    doc = {"pages": [], "logic": [{"id": "r1", "type": "skip", "condition": "x", "action": {}}]}
    reconcile_manifest(doc, ctx)
    assert ctx.problems == []


def test_widget_triple_number_drops_selection():
    assert _widget_triple({"input_data_type": "number", "measurement_type": "interval"}) == "number.interval"
    # selection present on a number option is ignored
    assert _widget_triple({"input_data_type": "number", "measurement_type": "ratio", "selection": "single"}) == "number.ratio"


def test_widget_triple_text_drops_selection():
    assert _widget_triple({"input_data_type": "text", "measurement_type": "nominal"}) == "text.nominal"


def test_widget_triple_choice_keeps_selection():
    assert _widget_triple({"input_data_type": "choice", "measurement_type": "nominal", "selection": "single"}) == "choice.nominal.single"
    assert _widget_triple({"input_data_type": "choice", "measurement_type": "nominal", "selection": "multiple"}) == "choice.nominal.multiple"
    # choice with no selection defaults to single
    assert _widget_triple({"input_data_type": "choice", "measurement_type": "ordinal"}) == "choice.ordinal.single"


def test_number_interval_passes_manifest_reconcile():
    ctx = make_ctx({"widgets": ["number.interval", "number.ratio"]})
    doc = _doc_with_option({"input_data_type": "number", "measurement_type": "interval", "min": 1, "max": 7, "step": 1})
    reconcile_manifest(doc, ctx)
    assert ctx.problems == []
