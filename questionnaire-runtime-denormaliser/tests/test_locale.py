from denormaliser.context import Ctx
from denormaliser.locale import apply_locale
from denormaliser.policy import RuntimePolicy


def make_ctx(locale="en", pre_fetch=False):
    return Ctx(
        locale=locale,
        runtime_policy=RuntimePolicy(scorer_impl_preference=["wasm"], pre_fetch_all_locales=pre_fetch),
        viewer_manifest={},
        resolve_entity=lambda ref: None,
    )


def test_trims_content_map_to_locale():
    ctx = make_ctx("en")
    doc = {"prompt": {"content": {
        "en": {"status": "validated", "text": "Hello"},
        "pt": {"status": "validated", "text": "Olá"},
    }}}
    out = apply_locale(doc, ctx)
    assert out["prompt"]["content"] == {"en": {"status": "validated", "text": "Hello"}}
    assert ctx.available_locales == {"en", "pt"}
    assert ctx.problems == []


def test_trims_translations_map():
    ctx = make_ctx("en")
    doc = {"translations": {"en": {"status": "validated", "title": "T"}, "pt": {"status": "validated", "title": "Tp"}}}
    out = apply_locale(doc, ctx)
    assert out["translations"] == {"en": {"status": "validated", "title": "T"}}


def test_missing_locale_records_problem():
    ctx = make_ctx("pt")
    doc = {"prompt": {"id": "pr_x", "content": {"en": {"status": "validated", "text": "Hello"}}}}
    apply_locale(doc, ctx)
    assert len(ctx.problems) == 1
    assert ctx.problems[0].kind == "missing_locale"
    assert "pt" in ctx.problems[0].detail


def test_pre_fetch_all_locales_keeps_all():
    ctx = make_ctx("en", pre_fetch=True)
    doc = {"prompt": {"content": {"en": {"status": "v", "text": "H"}, "pt": {"status": "v", "text": "O"}}}}
    out = apply_locale(doc, ctx)
    assert set(out["prompt"]["content"].keys()) == {"en", "pt"}
    assert ctx.available_locales == {"en", "pt"}


def test_non_language_content_is_not_treated_as_map():
    # A single-locale content map still trims to that one locale (no corruption).
    ctx = make_ctx("en")
    doc = {"content": {"en": {"status": "v", "text": "x"}}}
    out = apply_locale(doc, ctx)
    assert out["content"] == {"en": {"status": "v", "text": "x"}}
