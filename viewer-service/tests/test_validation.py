import pytest
from jsonschema.exceptions import ValidationError
from viewer_service.validation import validate_manifest
from viewer_service.config import get_settings

S = get_settings()

VALID = {
    "viewer_id": "behaverse-web-viewer",
    "viewer_version": "v26.0610",
    "schema_support": {"questionnaire": ["v26.0609"], "instrument": ["v26.0609"]},
    "evaluator": {"language_version": "v1.0", "functions": ["if", "score"]},
    "widgets": ["choice.ordinal.single"],
    "scorer_impl_kinds": ["wasm", "http"],
}


def test_valid_manifest_passes():
    validate_manifest(VALID, S.schemas_dir)  # no raise


def test_missing_required_field_rejected():
    bad = {k: v for k, v in VALID.items() if k != "scorer_impl_kinds"}
    with pytest.raises(ValidationError):
        validate_manifest(bad, S.schemas_dir)
