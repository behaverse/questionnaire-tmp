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
    """Original skeleton test updated to supply all 12 required fields."""
    response_def = schema["$defs"]["Response"]
    Draft202012Validator(response_def).validate({
        "response_id": 1,
        "agent_id": "agent_001",
        "session_index": 1,
        "instrument_id": "qst_phq9",
        "multitask_type": "",
        "block_index": 1,
        "block_type": "test",
        "transformation_name": "identity",
        "trial_index": "1",
        "trial_start_datetime": "2026-06-03T14:30:00Z",
        "stimulus_id": "pr_phq9_1",
        "stimulus_type": "text"
    })


def test_response_required_fields(schema):
    """All 12 required fields must be present."""
    response_def = schema["$defs"]["Response"]
    minimal_valid = {
        "response_id":          1,
        "agent_id":             "agent_001",
        "session_index":        1,
        "instrument_id":        "qst_phq9",
        "multitask_type":       "",
        "block_index":          1,
        "block_type":           "test",
        "transformation_name":  "identity",
        "trial_index":          "1",
        "trial_start_datetime": "2026-06-03T14:30:00Z",
        "stimulus_id":          "pr_phq9_1",
        "stimulus_type":        "text"
    }
    Draft202012Validator(response_def).validate(minimal_valid)


def test_response_context_fields(schema):
    response_def = schema["$defs"]["Response"]
    instance = {
        "response_id": 1, "agent_id": "a1", "session_index": 1,
        "instrument_id": "qst_x", "multitask_type": "", "block_index": 1,
        "block_type": "test", "transformation_name": "identity",
        "trial_index": "1", "trial_start_datetime": "2026-06-03T14:30:00Z",
        "stimulus_id": "pr_x", "stimulus_type": "text",
        "study_name": "study_2026", "group_name": "control",
        "session_id": "550e8400-e29b-41d4-a716-446655440000",
        "activity_index": 1, "language": "en"
    }
    Draft202012Validator(response_def).validate(instance)


def test_response_session_index_minimum(schema):
    response_def = schema["$defs"]["Response"]
    bad = {
        "response_id": 1, "agent_id": "a1", "session_index": 0,
        "instrument_id": "qst_x", "multitask_type": "", "block_index": 1,
        "block_type": "test", "transformation_name": "identity",
        "trial_index": "1", "trial_start_datetime": "2026-06-03T14:30:00Z",
        "stimulus_id": "pr_x", "stimulus_type": "text"
    }
    errors = list(Draft202012Validator(response_def).iter_errors(bad))
    assert any("minimum" in e.message.lower() for e in errors)


def test_response_instrument_id_pattern(schema):
    response_def = schema["$defs"]["Response"]
    bad = {
        "response_id": 1, "agent_id": "a1", "session_index": 1,
        "instrument_id": "not_qst_prefixed", "multitask_type": "", "block_index": 1,
        "block_type": "test", "transformation_name": "identity",
        "trial_index": "1", "trial_start_datetime": "2026-06-03T14:30:00Z",
        "stimulus_id": "pr_x", "stimulus_type": "text"
    }
    errors = list(Draft202012Validator(response_def).iter_errors(bad))
    assert any("does not match" in e.message.lower() or "pattern" in e.message.lower() for e in errors)


def test_response_multitask_type_enum(schema):
    response_def = schema["$defs"]["Response"]
    bad = {
        "response_id": 1, "agent_id": "a1", "session_index": 1,
        "instrument_id": "qst_x", "multitask_type": "parallel",
        "block_index": 1, "block_type": "test", "transformation_name": "identity",
        "trial_index": "1", "trial_start_datetime": "2026-06-03T14:30:00Z",
        "stimulus_id": "pr_x", "stimulus_type": "text"
    }
    errors = list(Draft202012Validator(response_def).iter_errors(bad))
    assert any("enum" in e.message.lower() or "is not one of" in e.message.lower() for e in errors)


def test_response_block_type_enum(schema):
    response_def = schema["$defs"]["Response"]
    bad = {
        "response_id": 1, "agent_id": "a1", "session_index": 1,
        "instrument_id": "qst_x", "multitask_type": "", "block_index": 1,
        "block_type": "scoring", "transformation_name": "identity",
        "trial_index": "1", "trial_start_datetime": "2026-06-03T14:30:00Z",
        "stimulus_id": "pr_x", "stimulus_type": "text"
    }
    errors = list(Draft202012Validator(response_def).iter_errors(bad))
    assert any("enum" in e.message.lower() or "is not one of" in e.message.lower() for e in errors)


def test_response_stimulus_id_is_string(schema):
    """Deviation D1: stimulus_id is string, not BDM integer."""
    response_def = schema["$defs"]["Response"]
    instance = {
        "response_id": 1, "agent_id": "a1", "session_index": 1,
        "instrument_id": "qst_x", "multitask_type": "", "block_index": 1,
        "block_type": "test", "transformation_name": "identity",
        "trial_index": "1", "trial_start_datetime": "2026-06-03T14:30:00Z",
        "stimulus_id": "ctx_intro+ins_likert+pr_phq9_1", "stimulus_type": "text"
    }
    Draft202012Validator(response_def).validate(instance)


def test_response_option_data_type_enum(schema):
    response_def = schema["$defs"]["Response"]
    instance = {
        "response_id": 1, "agent_id": "a1", "session_index": 1,
        "instrument_id": "qst_x", "multitask_type": "", "block_index": 1,
        "block_type": "test", "transformation_name": "identity",
        "trial_index": "1", "trial_start_datetime": "2026-06-03T14:30:00Z",
        "stimulus_id": "pr_x", "stimulus_type": "text",
        "option_data_type": "choice", "measurement_type": "ordinal"
    }
    Draft202012Validator(response_def).validate(instance)


def test_response_measurement_type_enum_rejects_invalid(schema):
    response_def = schema["$defs"]["Response"]
    bad = {
        "response_id": 1, "agent_id": "a1", "session_index": 1,
        "instrument_id": "qst_x", "multitask_type": "", "block_index": 1,
        "block_type": "test", "transformation_name": "identity",
        "trial_index": "1", "trial_start_datetime": "2026-06-03T14:30:00Z",
        "stimulus_id": "pr_x", "stimulus_type": "text",
        "measurement_type": "categorical"
    }
    errors = list(Draft202012Validator(response_def).iter_errors(bad))
    assert any("enum" in e.message.lower() or "is not one of" in e.message.lower() for e in errors)


def test_response_evaluation_fields(schema):
    response_def = schema["$defs"]["Response"]
    instance = {
        "response_id": 1, "agent_id": "a1", "session_index": 1,
        "instrument_id": "qst_x", "multitask_type": "", "block_index": 1,
        "block_type": "test", "transformation_name": "identity",
        "trial_index": "1", "trial_start_datetime": "2026-06-03T14:30:00Z",
        "stimulus_id": "pr_x", "stimulus_type": "text",
        "correct": True, "score": 2.5, "accuracy": 1.0, "evaluation_label": "correct"
    }
    Draft202012Validator(response_def).validate(instance)


def test_response_additional_properties_rejected(schema):
    """After tightening, unknown properties (not x_-prefixed) should be rejected."""
    response_def = schema["$defs"]["Response"]
    bad = {
        "response_id": 1, "agent_id": "a1", "session_index": 1,
        "instrument_id": "qst_x", "multitask_type": "", "block_index": 1,
        "block_type": "test", "transformation_name": "identity",
        "trial_index": "1", "trial_start_datetime": "2026-06-03T14:30:00Z",
        "stimulus_id": "pr_x", "stimulus_type": "text",
        "unknown_field": "anything"
    }
    errors = list(Draft202012Validator(response_def).iter_errors(bad))
    # Draft 2020-12 reports additionalProperties violations as "does not match any of
    # the regexes" when patternProperties is present, or "Additional properties are
    # not allowed" when it is not.
    assert any(
        "additional" in e.message.lower() or "does not match any of the regexes" in e.message.lower()
        for e in errors
    )


def test_response_x_prefixed_extension_allowed(schema):
    response_def = schema["$defs"]["Response"]
    Draft202012Validator(response_def).validate({
        "response_id": 1, "agent_id": "a1", "session_index": 1,
        "instrument_id": "qst_x", "multitask_type": "", "block_index": 1,
        "block_type": "test", "transformation_name": "identity",
        "trial_index": "1", "trial_start_datetime": "2026-06-03T14:30:00Z",
        "stimulus_id": "pr_x", "stimulus_type": "text",
        "x_lab_field": "ok"
    })


# ---------- ResponseSet wrapper ----------

def _minimal_response():
    """Build a minimal valid Response dict (all 12 required fields)."""
    return {
        "response_id":          1,
        "agent_id":             "agent_001",
        "session_index":        1,
        "instrument_id":        "qst_phq9",
        "multitask_type":       "",
        "block_index":          1,
        "block_type":           "test",
        "transformation_name":  "identity",
        "trial_index":          "1",
        "trial_start_datetime": "2026-06-03T14:30:00Z",
        "stimulus_id":          "pr_phq9_1",
        "stimulus_type":        "text"
    }


def _response_set_validator(schema):
    """Return a validator that can resolve $refs within the ResponseSet $def.

    Extracting the $def sub-schema loses the $defs context needed to resolve
    '$ref: #/$defs/Response' inside ResponseSet.responses.items.  Instead we
    build a thin wrapper schema that embeds $defs from the parent and delegates
    to ResponseSet via $ref so resolution always succeeds.
    """
    wrapper = {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "$defs":   schema["$defs"],
        "$ref":    "#/$defs/ResponseSet",
    }
    return Draft202012Validator(wrapper)


def test_response_set_minimal_valid(schema):
    instance = {
        "session_id": "550e8400-e29b-41d4-a716-446655440000",
        "responses":  [_minimal_response()]
    }
    _response_set_validator(schema).validate(instance)


def test_response_set_multiple_responses(schema):
    r = _minimal_response()
    instance = {
        "session_id": "550e8400-e29b-41d4-a716-446655440000",
        "responses":  [r, {**r, "response_id": 2, "trial_index": "2"}]
    }
    _response_set_validator(schema).validate(instance)


def test_response_set_requires_session_id(schema):
    bad = {"responses": [_minimal_response()]}
    errors = list(_response_set_validator(schema).iter_errors(bad))
    assert any("session_id" in e.message for e in errors)


def test_response_set_requires_responses(schema):
    bad = {"session_id": "550e8400-e29b-41d4-a716-446655440000"}
    errors = list(_response_set_validator(schema).iter_errors(bad))
    assert any("responses" in e.message for e in errors)


def test_response_set_rejects_unknown_property(schema):
    bad = {
        "session_id": "550e8400-e29b-41d4-a716-446655440000",
        "responses":  [_minimal_response()],
        "unknown_field": "extra"
    }
    errors = list(_response_set_validator(schema).iter_errors(bad))
    assert any(
        "additional" in e.message.lower() or "does not match" in e.message.lower()
        for e in errors
    )


def test_response_set_x_extension_allowed(schema):
    instance = {
        "session_id": "550e8400-e29b-41d4-a716-446655440000",
        "responses":  [_minimal_response()],
        "x_lab_extra": "ok"
    }
    _response_set_validator(schema).validate(instance)


def test_root_oneOf_response_branch(schema):
    """Root schema oneOf accepts a single Response object."""
    Draft202012Validator(schema).validate(_minimal_response())


def test_root_oneOf_response_set_branch(schema):
    """Root schema oneOf accepts a ResponseSet object."""
    Draft202012Validator(schema).validate({
        "session_id": "550e8400-e29b-41d4-a716-446655440000",
        "responses":  [_minimal_response()]
    })
