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
