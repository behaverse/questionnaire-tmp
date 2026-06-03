"""Tests for Schema 6 (Session Metadata, v26.0603)."""
import json
from pathlib import Path

import pytest
from jsonschema import Draft202012Validator


SCHEMA_PATH = Path(__file__).parent.parent.parent / "schemas" / "session" / "schema.json"


@pytest.fixture(scope="module")
def schema():
    return json.loads(SCHEMA_PATH.read_text())


def test_schema_loads(schema):
    assert "$id" in schema


def test_schema_id_is_v26_0603(schema):
    assert schema["$id"] == "https://behaverse.org/schemas/session/v26.0603/schema.json"


def test_minimal_session_validates(schema):
    instance = {
        "session_id":         "550e8400-e29b-41d4-a716-446655440000",
        "session_index":      1,
        "agent_id":           "agent_001",
        "instrument_id":      "qst_phq9",
        "instrument_version": "v26.0602",
        "status":             "completed",
        "started_at":         "2026-06-03T14:30:00Z"
    }
    Draft202012Validator(schema).validate(instance)


def _minimal_session():
    return {
        "session_id":         "550e8400-e29b-41d4-a716-446655440000",
        "session_index":      1,
        "agent_id":           "agent_001",
        "instrument_id":      "qst_phq9",
        "instrument_version": "v26.0602",
        "status":             "completed",
        "started_at":         "2026-06-03T14:30:00Z"
    }


def test_session_full_session(schema):
    instance = {
        **_minimal_session(),
        "deployment_id":     "dep_abc",
        "completed_at":      "2026-06-03T14:35:00Z",
        "submitted_at":      "2026-06-03T14:35:02Z",
        "forwarded_at":      "2026-06-03T14:35:05Z",
        "forward_attempts":  0,
        "initial_locale":    { "language": "en", "region": None },
        "last_active_locale":{ "language": "en", "region": None },
        "device": {
            "user_agent": "Mozilla/5.0...",
            "platform":   "web",
            "device_type":"desktop",
            "viewport":   "1920x1080",
            "timezone":   "Europe/Lisbon"
        },
        "scorer_outputs": {
            "scr_phq9@v26.0602": {
                "total":         12,
                "severity":      "moderate",
                "band":          { "min": 10, "max": 14, "label": "Moderate Depression" },
                "missing_count": 0
            }
        }
    }
    Draft202012Validator(schema).validate(instance)


def test_session_status_enum_rejects_invalid(schema):
    bad = {**_minimal_session(), "status": "running"}
    errors = list(Draft202012Validator(schema).iter_errors(bad))
    assert any("enum" in e.message.lower() or "is not one of" in e.message.lower() for e in errors)


def test_session_instrument_version_pattern(schema):
    bad = {**_minimal_session(), "instrument_version": "1.0.0"}
    errors = list(Draft202012Validator(schema).iter_errors(bad))
    assert any("does not match" in e.message.lower() or "pattern" in e.message.lower() for e in errors)


def test_session_instrument_id_pattern(schema):
    bad = {**_minimal_session(), "instrument_id": "not_qst_prefixed"}
    errors = list(Draft202012Validator(schema).iter_errors(bad))
    assert any("does not match" in e.message.lower() or "pattern" in e.message.lower() for e in errors)


def test_session_session_index_minimum(schema):
    bad = {**_minimal_session(), "session_index": 0}
    errors = list(Draft202012Validator(schema).iter_errors(bad))
    assert any("minimum" in e.message.lower() for e in errors)


def test_session_locale_requires_language(schema):
    bad = {**_minimal_session(), "initial_locale": {}}
    errors = list(Draft202012Validator(schema).iter_errors(bad))
    assert any("language" in e.message for e in errors)


def test_session_locale_extra_property_rejected(schema):
    bad = {**_minimal_session(), "initial_locale": {"language": "en", "extra": "x"}}
    errors = list(Draft202012Validator(schema).iter_errors(bad))
    assert any("additional" in e.message.lower() for e in errors)


def test_session_device_device_type_enum(schema):
    bad = {**_minimal_session(), "device": {"device_type": "robot"}}
    errors = list(Draft202012Validator(schema).iter_errors(bad))
    assert any("enum" in e.message.lower() or "is not one of" in e.message.lower() for e in errors)


def test_session_scorer_outputs_valid_key(schema):
    instance = {
        **_minimal_session(),
        "scorer_outputs": {
            "scr_phq9@v26.0602": {"total": 12, "severity": "moderate"}
        }
    }
    Draft202012Validator(schema).validate(instance)


def test_session_scorer_outputs_invalid_key_rejected(schema):
    bad = {**_minimal_session(), "scorer_outputs": {"phq9_total": 12}}
    errors = list(Draft202012Validator(schema).iter_errors(bad))
    assert any(
        "additional" in e.message.lower() or "does not match" in e.message.lower()
        for e in errors
    )


def test_session_unknown_root_property_rejected(schema):
    bad = {**_minimal_session(), "unknown": "x"}
    errors = list(Draft202012Validator(schema).iter_errors(bad))
    assert any(
        "additional" in e.message.lower() or "does not match" in e.message.lower()
        for e in errors
    )


def test_session_x_prefixed_extension_allowed(schema):
    instance = {**_minimal_session(), "x_lab_field": "ok"}
    Draft202012Validator(schema).validate(instance)
