"""Tests for Schema 5 (Response Data, v26.0603)."""
import json
from pathlib import Path

import pytest
from jsonschema import Draft202012Validator


SCHEMA_PATH = Path(__file__).parent.parent.parent / "schemas" / "response" / "schema.json"


@pytest.fixture(scope="module")
def schema():
    return json.loads(SCHEMA_PATH.read_text())


def test_schema_loads(schema):
    assert "$id" in schema


def test_schema_id_is_v26_0603(schema):
    assert schema["$id"] == "https://behaverse.org/schemas/response/v26.0603/schema.json"


def test_minimal_response_validates(schema):
    response_def = schema["$defs"]["Response"]
    Draft202012Validator(response_def).validate({"response_id": 1})
