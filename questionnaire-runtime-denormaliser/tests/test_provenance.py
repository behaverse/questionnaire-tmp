from denormaliser.context import Ctx
from denormaliser.hashing import canonical_hash
from denormaliser.policy import RuntimePolicy
from denormaliser.provenance import assemble_runtime


def make_ctx():
    ctx = Ctx(
        locale="en",
        runtime_policy=RuntimePolicy(scorer_impl_preference=["wasm"], lock_show_score_timing=True),
        viewer_manifest={"viewer_id": "web", "viewer_version": "v26.0610"},
        resolve_entity=lambda ref: None,
    )
    ctx.available_locales = {"en", "pt"}
    ctx.stripped_scorer_refs = ["scr_y@v26.0602"]
    return ctx


def _work():
    return {
        "@context": "https://behaverse.org/schemas/questionnaire/context.jsonld",
        "metadata": {"id": "qst_demo", "version": "v26.0609", "title": "Demo", "language": "pt"},
        "pages": [{"id": "page_1", "elements": []}],
        "scores": [{"id": "total", "scorer": "scr_x@v26.0602", "path": "/total", "impl": {"kind": "wasm"}}],
    }


def test_assembles_required_top_level_keys():
    ctx = make_ctx()
    rt = assemble_runtime(_work(), ctx, generated_at="2026-06-10T00:00:00Z", denormaliser_version="v26.0610")
    assert set(rt).issuperset({"provenance", "metadata", "locale", "pages"})
    assert "@context" not in rt                                   # dropped
    assert rt["locale"] == "en"
    assert rt["available_locales"] == ["en", "pt"]               # sorted
    assert rt["metadata"]["language"] == "en"                    # forced to active locale
    assert rt["lock_show_score_timing"] is True                 # from policy


def test_provenance_block_fields():
    ctx = make_ctx()
    rt = assemble_runtime(_work(), ctx, generated_at="2026-06-10T00:00:00Z", denormaliser_version="v26.0610")
    prov = rt["provenance"]
    assert prov["source_questionnaire_id"] == "qst_demo"
    assert prov["source_questionnaire_version"] == "v26.0609"
    assert prov["locale"] == "en"
    assert prov["generated_at"] == "2026-06-10T00:00:00Z"
    assert prov["denormaliser_version"] == "v26.0610"
    assert prov["viewer_conformance_hash"] == canonical_hash(ctx.viewer_manifest)
    assert prov["deployment_runtime_policy_hash"] == canonical_hash(ctx.runtime_policy.to_canonical_dict())
    assert prov["stripped_scorer_refs"] == ["scr_y@v26.0602"]


def test_missing_version_raises():
    import pytest
    ctx = make_ctx()
    work = _work()
    del work["metadata"]["version"]
    with pytest.raises(ValueError, match="version"):
        assemble_runtime(work, ctx, generated_at="2026-06-10T00:00:00Z", denormaliser_version="v26.0610")


def test_empty_stripped_lists_are_omitted():
    ctx = make_ctx()
    ctx.stripped_scorer_refs = []
    rt = assemble_runtime(_work(), ctx, generated_at="2026-06-10T00:00:00Z", denormaliser_version="v26.0610")
    assert "stripped_scorer_refs" not in rt["provenance"]


def test_provenance_carries_show_score_flags():
    ctx = Ctx(
        locale="en",
        runtime_policy=RuntimePolicy(
            scorer_impl_preference=["wasm"],
            show_score=True,
            show_score_live=True,
            lock_show_score_timing=False,
        ),
        viewer_manifest={"viewer_id": "web", "viewer_version": "v26.0610"},
        resolve_entity=lambda ref: None,
    )
    ctx.available_locales = {"en"}
    rt = assemble_runtime(_work(), ctx, generated_at="2026-06-10T00:00:00Z", denormaliser_version="v26.0610")
    prov = rt["provenance"]
    assert prov["show_score"] is True
    assert prov["show_score_live"] is True
    assert prov["lock_show_score_timing"] is False
