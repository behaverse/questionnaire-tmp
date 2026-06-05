"""Tests for Schema 4b (Mouse Recording, v26.0605)."""
import json
from pathlib import Path

import pytest
from jsonschema import Draft202012Validator


SCHEMA_PATH = Path(__file__).parent.parent.parent / "schemas" / "recordings" / "mouse" / "schema.json"


@pytest.fixture(scope="module")
def schema():
    return json.loads(SCHEMA_PATH.read_text())


def test_schema_loads(schema):
    assert "$id" in schema


def test_schema_id_is_v26_0605(schema):
    assert schema["$id"] == "https://behaverse.org/schemas/recordings/mouse/v26.0605/schema.json"


def test_minimal_sample_validates(schema):
    Draft202012Validator(schema).validate({
        "t": 0.0,
        "x": 0,
        "y": 0,
        "button_state": "up"
    })


def test_full_sample_validates(schema):
    Draft202012Validator(schema).validate({
        "t": 4.218,
        "x": 1042,
        "y": 587,
        "button_state": "left_down"
    })


def test_button_state_enum(schema):
    bad = {"t": 0.0, "x": 0, "y": 0, "button_state": "down"}
    errors = list(Draft202012Validator(schema).iter_errors(bad))
    assert any("enum" in e.message.lower() or "is not one of" in e.message.lower() for e in errors)


def test_all_button_states_valid(schema):
    for state in ["up", "left_down", "right_down", "middle_down"]:
        Draft202012Validator(schema).validate({"t": 1.0, "x": 0, "y": 0, "button_state": state})


def test_t_must_be_non_negative(schema):
    bad = {"t": -1.0, "x": 0, "y": 0, "button_state": "up"}
    errors = list(Draft202012Validator(schema).iter_errors(bad))
    assert any("minimum" in e.message.lower() for e in errors)


def test_x_must_be_integer(schema):
    bad = {"t": 0.0, "x": 1.5, "y": 0, "button_state": "up"}
    errors = list(Draft202012Validator(schema).iter_errors(bad))
    assert any("integer" in e.message.lower() for e in errors)


def test_required_fields(schema):
    for missing in ["t", "x", "y", "button_state"]:
        bad = {"t": 0.0, "x": 0, "y": 0, "button_state": "up"}
        del bad[missing]
        errors = list(Draft202012Validator(schema).iter_errors(bad))
        assert any(missing in e.message for e in errors), f"Should require {missing}"


def test_unknown_property_rejected(schema):
    bad = {"t": 0.0, "x": 0, "y": 0, "button_state": "up", "extra": "x"}
    errors = list(Draft202012Validator(schema).iter_errors(bad))
    assert any("additional" in e.message.lower() for e in errors)
