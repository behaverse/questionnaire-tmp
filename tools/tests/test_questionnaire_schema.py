"""Tests for schemas/questionnaire/schema.json (v26.0601 per OD-15).

The new entity model: 11 reusable entities in two categories (content-bearing
and ref-binding). Page elements use a four-branch oneOf. Content lives in a
language-keyed map (content.{lang}).
"""
from __future__ import annotations

from pathlib import Path

import pytest

from tools.validate_schemas import build_registry, load_schema, validate_instance


REPO_ROOT = Path(__file__).resolve().parents[2]
SCHEMAS_ROOT = REPO_ROOT / "schemas"
SCHEMA_PATH = SCHEMAS_ROOT / "questionnaire" / "schema.json"


@pytest.fixture(scope="module")
def schema() -> dict:
    return load_schema(SCHEMA_PATH)


@pytest.fixture(scope="module")
def registry():
    return build_registry(SCHEMAS_ROOT)


def base_metadata() -> dict:
    return {
        "id": "qst_test",
        "title": "Test Questionnaire",
        "description": "Smallest valid questionnaire for v26.0601 tests.",
        "language": "en",
    }


def minimal_message_ref() -> dict:
    return {"ref": "msg_test_welcome@v26.0601"}


# ---------- top-level smoke ----------

def test_schema_id_is_v26_0601(schema):
    assert schema["$id"].endswith("/questionnaire/v26.0601/schema.json")


def test_minimal_questionnaire_validates(schema, registry):
    """Single Page with a single Message ref — smallest valid Questionnaire."""
    instance = {
        "metadata": base_metadata(),
        "pages": [
            {"id": "page_only", "elements": [minimal_message_ref()]}
        ],
    }
    assert validate_instance(schema, instance, registry=registry) == []


def test_missing_metadata_rejected(schema, registry):
    instance = {"pages": [{"id": "page_x", "elements": [minimal_message_ref()]}]}
    errors = validate_instance(schema, instance, registry=registry)
    assert any("metadata" in e for e in errors)


def test_missing_pages_rejected(schema, registry):
    instance = {"metadata": base_metadata()}
    errors = validate_instance(schema, instance, registry=registry)
    assert any("pages" in e for e in errors)


def test_metadata_id_must_start_with_qst(schema, registry):
    md = base_metadata()
    md["id"] = "tsk_n_back"
    instance = {
        "metadata": md,
        "pages": [{"id": "page_only", "elements": [minimal_message_ref()]}],
    }
    errors = validate_instance(schema, instance, registry=registry)
    assert any("id" in e or "qst_" in e for e in errors)


def test_root_extensions_accepted(schema, registry):
    instance = {
        "metadata": base_metadata(),
        "pages": [{"id": "page_x", "elements": [minimal_message_ref()]}],
        "extensions": {"any": 42},
    }
    assert validate_instance(schema, instance, registry=registry) == []


def test_root_x_prefix_accepted(schema, registry):
    instance = {
        "metadata": base_metadata(),
        "pages": [{"id": "page_x", "elements": [minimal_message_ref()]}],
        "x_internal_marker": "foo",
    }
    assert validate_instance(schema, instance, registry=registry) == []


def test_root_unknown_field_rejected(schema, registry):
    instance = {
        "metadata": base_metadata(),
        "pages": [{"id": "page_x", "elements": [minimal_message_ref()]}],
        "pagess": [],
    }
    errors = validate_instance(schema, instance, registry=registry)
    assert any("pagess" in e or "Additional" in e for e in errors)


# ---------- Message ----------

def minimal_message() -> dict:
    return {
        "id": "msg_welcome",
        "type": ["welcome"],
        "content": {
            "en": { "status": "validated", "text": "Welcome." }
        }
    }


def test_message_minimal_validates_against_def(schema, registry):
    from jsonschema import Draft202012Validator, FormatChecker
    msg_schema = {**schema["$defs"]["Message"], "$defs": schema["$defs"]}
    validator = Draft202012Validator(msg_schema, registry=registry, format_checker=Draft202012Validator.FORMAT_CHECKER)
    errors = list(validator.iter_errors(minimal_message()))
    assert errors == []


def test_message_missing_type_fails(schema, registry):
    from jsonschema import Draft202012Validator, FormatChecker
    msg_schema = {**schema["$defs"]["Message"], "$defs": schema["$defs"]}
    validator = Draft202012Validator(msg_schema, registry=registry, format_checker=Draft202012Validator.FORMAT_CHECKER)
    bad = minimal_message()
    del bad["type"]
    errors = list(validator.iter_errors(bad))
    assert any("type" in e.message for e in errors)


def test_message_type_must_be_array(schema, registry):
    from jsonschema import Draft202012Validator, FormatChecker
    msg_schema = {**schema["$defs"]["Message"], "$defs": schema["$defs"]}
    validator = Draft202012Validator(msg_schema, registry=registry, format_checker=Draft202012Validator.FORMAT_CHECKER)
    bad = minimal_message()
    bad["type"] = "welcome"  # string, not array
    errors = list(validator.iter_errors(bad))
    assert any("array" in e.message.lower() for e in errors)


def test_message_compound_type_accepted(schema, registry):
    """Legacy compound values like 'job; purpose' now an array of two tags."""
    from jsonschema import Draft202012Validator, FormatChecker
    msg_schema = {**schema["$defs"]["Message"], "$defs": schema["$defs"]}
    validator = Draft202012Validator(msg_schema, registry=registry, format_checker=Draft202012Validator.FORMAT_CHECKER)
    msg = minimal_message()
    msg["type"] = ["job", "purpose"]
    assert list(validator.iter_errors(msg)) == []


def test_message_content_per_language_status(schema, registry):
    from jsonschema import Draft202012Validator, FormatChecker
    msg_schema = {**schema["$defs"]["Message"], "$defs": schema["$defs"]}
    validator = Draft202012Validator(msg_schema, registry=registry, format_checker=Draft202012Validator.FORMAT_CHECKER)
    msg = {
        "id": "msg_multi",
        "type": ["purpose"],
        "content": {
            "en": { "status": "validated", "text": "EN text" },
            "pt": { "status": "draft",     "text": "PT text" },
            "pt-BR": { "status": "complete", "text": "PT-BR text" }
        }
    }
    assert list(validator.iter_errors(msg)) == []


def test_message_content_invalid_status_fails(schema, registry):
    from jsonschema import Draft202012Validator, FormatChecker
    msg_schema = {**schema["$defs"]["Message"], "$defs": schema["$defs"]}
    validator = Draft202012Validator(msg_schema, registry=registry, format_checker=Draft202012Validator.FORMAT_CHECKER)
    msg = {
        "id": "msg_bad",
        "type": ["info"],
        "content": {
            "en": { "status": "approved", "text": "..." }
        }
    }
    errors = list(validator.iter_errors(msg))
    assert any("is not one of" in e.message or "enum" in e.message or "status" in e.message for e in errors)


def test_message_content_must_have_at_least_one_language(schema, registry):
    from jsonschema import Draft202012Validator, FormatChecker
    msg_schema = {**schema["$defs"]["Message"], "$defs": schema["$defs"]}
    validator = Draft202012Validator(msg_schema, registry=registry, format_checker=Draft202012Validator.FORMAT_CHECKER)
    msg = {"id": "msg_empty_content", "type": ["info"], "content": {}}
    errors = list(validator.iter_errors(msg))
    assert any("minProperties" in e.message or "fewer" in e.message.lower() or "non-empty" in e.message for e in errors)
