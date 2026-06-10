import pytest

from denormaliser import denormalise, PreflightError, RuntimePolicy


def _policy(**kw):
    return RuntimePolicy(scorer_impl_preference=["wasm", "http"], **kw)


def test_collects_multiple_preflight_problems():
    # An unresolved prompt ref AND a missing locale in inline content -> two problems, one raise.
    q = {
        "metadata": {"id": "qst_x", "version": "v26.0609", "title": "X", "language": "en"},
        "pages": [{"id": "page_1", "elements": [
            {"question": {"prompt": {"ref": "pr_missing@v26.0609"}},
             "option": {"input_data_type": "text", "measurement_type": "nominal",
                        "content": {"pt": {"status": "validated", "label": "só-pt"}}}},
        ]}],
    }
    with pytest.raises(PreflightError) as ei:
        denormalise(q, locale="en", runtime_policy=_policy(), viewer_manifest={},
                    resolve_entity=lambda ref: None, generated_at="2026-06-10T00:00:00Z")
    kinds = sorted(p.kind for p in ei.value.problems)
    assert kinds == ["missing_locale", "unresolved_ref"]


def test_happy_path_returns_runtime():
    q = {
        "metadata": {"id": "qst_x", "version": "v26.0609", "title": "X", "language": "en"},
        "pages": [{"id": "page_1", "elements": [
            {"question": {"prompt": {"content": {"en": {"status": "validated", "text": "Hi"}}}},
             "option": {"input_data_type": "text", "measurement_type": "nominal",
                        "content": {"en": {"status": "validated", "label": "x"}}}},
        ]}],
    }
    rt = denormalise(q, locale="en", runtime_policy=_policy(), viewer_manifest={},
                     resolve_entity=lambda ref: None, generated_at="2026-06-10T00:00:00Z")
    assert rt["provenance"]["source_questionnaire_id"] == "qst_x"
    assert rt["locale"] == "en"
    assert rt["pages"][0]["elements"][0]["question"]["prompt"]["content"] == {"en": {"status": "validated", "text": "Hi"}}
