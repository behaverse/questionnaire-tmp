"""Tests for Schema 3 (Questionnaire Runtime, v26.0603)."""
import json
from pathlib import Path

import pytest
from jsonschema import Draft202012Validator


SCHEMA_PATH = Path(__file__).parent.parent.parent / "schemas" / "runtime" / "schema.json"


@pytest.fixture(scope="module")
def schema():
    return json.loads(SCHEMA_PATH.read_text())


def test_schema_loads(schema):
    assert "$id" in schema


def test_schema_id_is_v26_0603(schema):
    assert schema["$id"] == "https://behaverse.org/schemas/runtime/v26.0603/schema.json"


def test_minimal_runtime_validates(schema):
    Draft202012Validator(schema).validate({
        "provenance": {},
        "metadata":   {},
        "pages":      [{}]
    })
