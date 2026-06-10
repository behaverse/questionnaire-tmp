from denormaliser.context import Ctx
from denormaliser.policy import RuntimePolicy
from denormaliser.scorers import pin_scorers

SCORER = {
    "id": "scr_phq9",
    "implementations": [
        {"kind": "wasm", "url": "https://x/scorer.wasm", "sha256": "0" * 64},
        {"kind": "http", "url": "https://x/score"},
        {"kind": "python", "package": "behaverse-scorer-phq9==26.0602"},
    ],
}


def make_ctx(preference, manifest_kinds):
    return Ctx(
        locale="en",
        runtime_policy=RuntimePolicy(scorer_impl_preference=preference),
        viewer_manifest={"scorer_impl_kinds": manifest_kinds},
        resolve_entity=lambda ref: SCORER if ref == "scr_phq9@v26.0602" else None,
    )


def test_pins_first_preference_in_intersection():
    ctx = make_ctx(["wasm", "http"], ["wasm", "http"])
    doc = {"scores": [{"id": "phq9_total", "scorer": "scr_phq9@v26.0602", "path": "/total"}]}
    pin_scorers(doc, ctx)
    assert doc["scores"][0]["impl"] == {"kind": "wasm", "url": "https://x/scorer.wasm", "sha256": "0" * 64}
    assert ctx.problems == []


def test_skips_preferences_not_supported_by_viewer():
    # wasm preferred but viewer only supports http -> http chosen.
    ctx = make_ctx(["wasm", "http"], ["http"])
    doc = {"scores": [{"id": "phq9_total", "scorer": "scr_phq9@v26.0602", "path": "/total"}]}
    pin_scorers(doc, ctx)
    assert doc["scores"][0]["impl"]["kind"] == "http"


def test_empty_intersection_records_problem():
    # viewer supports only 'r', scorer has no 'r' impl.
    ctx = make_ctx(["r"], ["r"])
    doc = {"scores": [{"id": "phq9_total", "scorer": "scr_phq9@v26.0602", "path": "/total"}]}
    pin_scorers(doc, ctx)
    assert [p.kind for p in ctx.problems] == ["no_scorer_impl"]
    assert ctx.problems[0].where == "phq9_total"


def test_unresolvable_scorer_records_problem():
    ctx = make_ctx(["wasm"], ["wasm"])
    doc = {"scores": [{"id": "x", "scorer": "scr_missing@v26.0602", "path": "/total"}]}
    pin_scorers(doc, ctx)
    assert [p.kind for p in ctx.problems] == ["no_scorer_impl"]


def test_no_scores_key_is_noop():
    ctx = make_ctx(["wasm"], ["wasm"])
    doc = {"pages": []}
    pin_scorers(doc, ctx)
    assert ctx.problems == []
