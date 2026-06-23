import pytest
from jsonschema.exceptions import ValidationError
from viewer_service.validation import validate_manifest, validate_events
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


# ---------------------------------------------------------------------------
# Events schema validation (Schema 4a)
# ---------------------------------------------------------------------------

def _event(verb: str) -> dict:
    """Minimal valid single-event payload for the given verb."""
    return {
        "actor": {"objectType": "bdm:Agent", "id": "participant:anon"},
        "verb": verb,
        "object": {"objectType": "bdm:ConsentForm", "id": "consent:default"},
        "timestamp": "2026-06-23T10:00:00Z",
    }


def test_consented_event_validates():
    """bdm:consented must pass Schema 4a validation (sanity check)."""
    validate_events(_event("bdm:consented"), S.schemas_dir)  # no raise


def test_consent_declined_event_validates():
    """bdm:consent_declined must pass Schema 4a validation (regression: was missing from Verb enum)."""
    validate_events(_event("bdm:consent_declined"), S.schemas_dir)  # no raise


def test_unknown_verb_rejected():
    """An unrecognised verb must raise ValidationError."""
    with pytest.raises(ValidationError):
        validate_events(_event("bdm:not_a_real_verb"), S.schemas_dir)
