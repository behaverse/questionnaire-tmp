"""Tests for Schema 4b (Keyboard Recording, v26.0605)."""
import json
from pathlib import Path

import pytest
from jsonschema import Draft202012Validator


SCHEMA_PATH = Path(__file__).parent.parent.parent / "schemas" / "recordings" / "keyboard" / "schema.json"


@pytest.fixture(scope="module")
def schema():
    return json.loads(SCHEMA_PATH.read_text())


def test_schema_loads(schema):
    assert "$id" in schema


def test_schema_id_is_v26_0605(schema):
    assert schema["$id"] == "https://behaverse.org/schemas/recordings/keyboard/v26.0605/schema.json"


def test_minimal_sample_validates(schema):
    Draft202012Validator(schema).validate({
        "t": 0.0,
        "key": "Enter",
        "key_code": 13,
        "action": "down",
        "modifiers": []
    })


def test_full_sample_with_modifiers(schema):
    Draft202012Validator(schema).validate({
        "t": 12.847,
        "key": "ArrowLeft",
        "key_code": 37,
        "action": "down",
        "modifiers": ["shift", "ctrl"]
    })


def test_action_enum(schema):
    bad = {"t": 0.0, "key": "a", "key_code": 65, "action": "press", "modifiers": []}
    errors = list(Draft202012Validator(schema).iter_errors(bad))
    assert any("enum" in e.message.lower() or "is not one of" in e.message.lower() for e in errors)


def test_modifier_enum(schema):
    bad = {"t": 0.0, "key": "a", "key_code": 65, "action": "down", "modifiers": ["super"]}
    errors = list(Draft202012Validator(schema).iter_errors(bad))
    assert any("enum" in e.message.lower() or "is not one of" in e.message.lower() for e in errors)


def test_all_modifiers_valid(schema):
    Draft202012Validator(schema).validate({
        "t": 0.0, "key": "a", "key_code": 65, "action": "down",
        "modifiers": ["shift", "ctrl", "alt", "meta"]
    })


def test_modifiers_unique(schema):
    bad = {"t": 0.0, "key": "a", "key_code": 65, "action": "down", "modifiers": ["shift", "shift"]}
    errors = list(Draft202012Validator(schema).iter_errors(bad))
    assert any("uniqueItems" in e.message or "unique" in e.message.lower() for e in errors)


def test_required_fields(schema):
    base = {"t": 0.0, "key": "a", "key_code": 65, "action": "down", "modifiers": []}
    for missing in ["t", "key", "key_code", "action", "modifiers"]:
        bad = dict(base)
        del bad[missing]
        errors = list(Draft202012Validator(schema).iter_errors(bad))
        assert any(missing in e.message for e in errors), f"Should require {missing}"


def test_unknown_property_rejected(schema):
    bad = {"t": 0.0, "key": "a", "key_code": 65, "action": "down", "modifiers": [], "extra": "x"}
    errors = list(Draft202012Validator(schema).iter_errors(bad))
    assert any("additional" in e.message.lower() for e in errors)
