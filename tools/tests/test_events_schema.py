"""Tests for Schema 4a (Event Data, v26.0605)."""
import json
from pathlib import Path

import pytest
from jsonschema import Draft202012Validator


SCHEMA_PATH = Path(__file__).parent.parent.parent / "schemas" / "events" / "schema.json"


@pytest.fixture(scope="module")
def schema():
    return json.loads(SCHEMA_PATH.read_text())


def test_schema_loads(schema):
    assert "$id" in schema


def test_schema_id_is_v26_0605(schema):
    assert schema["$id"] == "https://behaverse.org/schemas/events/v26.0605/schema.json"


def test_minimal_event_validates(schema):
    instance = {
        "timestamp": "2026-06-05T14:30:00Z",
        "actor":     {"objectType": "bdm:Agent", "id": "agent_001"},
        "verb":      "bdm:initialized",
        "object":    {"objectType": "bdm:RuntimeInstance", "id": "rt_550e8400"}
    }
    Draft202012Validator(schema).validate(instance)
