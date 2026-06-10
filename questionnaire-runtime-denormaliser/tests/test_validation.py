import pytest
from jsonschema.exceptions import ValidationError

from denormaliser.validation import validate_input, validate_output


def test_validate_input_accepts_minimal_questionnaire(schemas_dir):
    # Mirrors schemas/questionnaire/examples/minimal.json: prompts are ref-only
    # (QuestionInline.prompt is a PromptRef), option is inline. Instrument metadata
    # REQUIRES id+title+description+language.
    q = {
        "metadata": {"id": "qst_x", "title": "X", "description": "d", "language": "en"},
        "pages": [{"id": "page_1", "elements": [{
            "question": {"prompt": {"ref": "pr_x@v26.0609"}},
            "option": {
                "input_data_type": "choice", "measurement_type": "ordinal", "selection": "single",
                "options": [{"index": 1, "value": 0}, {"index": 2, "value": 1}],
                "content": {"en": {"status": "validated", "label": "L",
                                   "options": [{"index": 1, "text": "a"}, {"index": 2, "text": "b"}]}},
            },
        }]}],
    }
    validate_input(q, schemas_dir)  # no raise (ref need not resolve — format only)


def test_validate_input_rejects_missing_pages(schemas_dir):
    with pytest.raises(ValidationError):
        validate_input(
            {"metadata": {"id": "qst_x", "title": "X", "description": "d", "language": "en"}},
            schemas_dir,
        )


def test_validate_output_accepts_well_formed_runtime(schemas_dir):
    rt = {
        "provenance": {
            "source_questionnaire_id": "qst_x", "source_questionnaire_version": "v26.0609",
            "locale": "en", "viewer_conformance_hash": "a" * 64, "deployment_runtime_policy_hash": "b" * 64,
            "generated_at": "2026-06-10T00:00:00Z", "denormaliser_version": "v26.0610",
        },
        "metadata": {"id": "qst_x", "title": "X", "language": "en"},
        "locale": "en",
        "pages": [{"id": "page_1", "elements": []}],
    }
    validate_output(rt, schemas_dir)  # no raise against both Schema 3 and strict


def test_validate_output_strict_requires_locale(schemas_dir):
    rt = {
        "provenance": {
            "source_questionnaire_id": "qst_x", "source_questionnaire_version": "v26.0609",
            "locale": "en", "viewer_conformance_hash": "a" * 64, "deployment_runtime_policy_hash": "b" * 64,
            "generated_at": "2026-06-10T00:00:00Z", "denormaliser_version": "v26.0610",
        },
        "metadata": {"id": "qst_x", "title": "X", "language": "en"},
        "pages": [{"id": "page_1", "elements": []}],
        # no top-level "locale" -> strict schema must reject
    }
    with pytest.raises(ValidationError):
        validate_output(rt, schemas_dir)
