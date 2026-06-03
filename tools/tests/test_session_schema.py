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
